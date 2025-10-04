import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Transaction } from '@/lib/types/budget-v2'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const account = searchParams.get('account')
    const cleared = searchParams.get('cleared')

    const metadata = user.user_metadata || {}
    let transactions = metadata.transactions_v2 || []

    // Apply filters
    if (month) {
      transactions = transactions.filter((txn: Transaction) => 
        txn.date.substring(0, 7) === month
      )
    }
    if (type && type !== 'all') {
      transactions = transactions.filter((txn: Transaction) => txn.type === type)
    }
    if (category && category !== 'all') {
      transactions = transactions.filter((txn: Transaction) => txn.category_id === category)
    }
    if (account && account !== 'all') {
      transactions = transactions.filter((txn: Transaction) => txn.account_id === account)
    }
    if (cleared === 'true' || cleared === 'false') {
      transactions = transactions.filter((txn: Transaction) => txn.cleared === (cleared === 'true'))
    }

    // Sort by date descending
    transactions.sort((a: Transaction, b: Transaction) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    return NextResponse.json({
      transactions,
      total: transactions.length,
      filters: { month, type, category, account, cleared }
    })

  } catch (error) {
    console.error('Error fetching transactions v2:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const {
      date,
      payee,
      memo,
      amount,
      type,
      account_id,
      category_id,
      inflow_to_budget,
      splits,
      transfer_to_account_id
    } = await request.json()

    const metadata = user.user_metadata || {}
    const existingTransactions = metadata.transactions_v2 || []

    let newTransactions: Transaction[] = []

    if (type === 'transfer') {
      // Create transfer pair
      const transferId = `transfer_${Date.now()}`
      
      newTransactions = [
        {
          id: `${transferId}_out`,
          date,
          account_id,
          payee: payee || 'Transfer',
          memo: memo || `Transfer to ${transfer_to_account_id}`,
          amount: -Math.abs(amount),
          type: 'outflow',
          category_id: null, // Transfers don't affect categories
          inflow_to_budget: false,
          related_txn_id: `${transferId}_in`,
          cleared: false
        },
        {
          id: `${transferId}_in`,
          date,
          account_id: transfer_to_account_id,
          payee: payee || 'Transfer',
          memo: memo || `Transfer from ${account_id}`,
          amount: Math.abs(amount),
          type: 'inflow',
          category_id: null,
          inflow_to_budget: false,
          related_txn_id: `${transferId}_out`,
          cleared: false
        }
      ]
    } else if (splits && splits.length > 0) {
      // Create split transaction
      const splitGroupId = `split_${Date.now()}`
      
      newTransactions = splits.map((split: any, index: number) => ({
        id: `${splitGroupId}_${index}`,
        date,
        account_id,
        payee,
        memo: split.memo || memo,
        amount: type === 'inflow' ? Math.abs(split.amount) : -Math.abs(split.amount),
        type,
        category_id: split.category_id,
        inflow_to_budget: type === 'inflow' ? (inflow_to_budget ?? true) : false,
        related_txn_id: splitGroupId,
        splits: undefined, // Individual split legs don't have sub-splits
        cleared: false
      }))
    } else {
      // Simple transaction
      newTransactions = [{
        id: `txn_${Date.now()}`,
        date,
        account_id,
        payee,
        memo,
        amount: type === 'inflow' ? Math.abs(amount) : -Math.abs(amount),
        type,
        category_id,
        inflow_to_budget: type === 'inflow' ? (inflow_to_budget ?? true) : false,
        cleared: false
      }]
    }

    // Save to user metadata
    const updatedTransactions = [...existingTransactions, ...newTransactions]
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...metadata,
        transactions_v2: updatedTransactions
      }
    })

    if (updateError) {
      console.error('Failed to save transaction v2:', updateError)
      return NextResponse.json({ error: 'Failed to save transaction' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      transactions: newTransactions,
      message: `${newTransactions.length} transaction(s) created successfully`
    })

  } catch (error) {
    console.error('Error creating transaction v2:', error)
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { transaction_id, updates } = await request.json()
    const metadata = user.user_metadata || {}
    const transactions = metadata.transactions_v2 || []

    // Update transaction
    const updatedTransactions = transactions.map((txn: Transaction) => {
      if (txn.id === transaction_id) {
        return {
          ...txn,
          ...updates,
          // Recalculate derived fields if amount/type changes
          amount: updates.type === 'inflow' ? Math.abs(updates.amount || txn.amount) : -Math.abs(updates.amount || txn.amount)
        }
      }
      return txn
    })

    // Save to user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...metadata,
        transactions_v2: updatedTransactions
      }
    })

    if (updateError) {
      console.error('Failed to update transaction v2:', updateError)
      return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction updated successfully'
    })

  } catch (error) {
    console.error('Error updating transaction v2:', error)
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('id')

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 })
    }

    const metadata = user.user_metadata || {}
    const transactions = metadata.transactions_v2 || []

    // Find transaction and related transactions
    const transaction = transactions.find((txn: Transaction) => txn.id === transactionId)
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    let toDelete = [transactionId]

    // Handle related transactions (transfers, splits)
    if (transaction.related_txn_id) {
      // Find all transactions in the same group
      const relatedTransactions = transactions.filter((txn: Transaction) => 
        txn.related_txn_id === transaction.related_txn_id || txn.id === transaction.related_txn_id
      )
      toDelete = [...toDelete, ...relatedTransactions.map(txn => txn.id)]
    }

    // Remove transactions
    const updatedTransactions = transactions.filter((txn: Transaction) => 
      !toDelete.includes(txn.id)
    )

    // Save to user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...metadata,
        transactions_v2: updatedTransactions
      }
    })

    if (updateError) {
      console.error('Failed to delete transaction v2:', updateError)
      return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      deleted_count: toDelete.length,
      message: `${toDelete.length} transaction(s) deleted successfully`
    })

  } catch (error) {
    console.error('Error deleting transaction v2:', error)
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}
