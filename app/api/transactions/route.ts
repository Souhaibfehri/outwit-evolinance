import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { 
  CreateTransactionRequest,
  createSplitTransactions,
  createTransferTransactions,
  validateSplits,
  calculateBudgetMonth
} from '@/lib/transaction-service'

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

    const metadata = user.user_metadata || {}
    let transactions = metadata.transactions || []

    // Apply filters
    if (month) {
      transactions = transactions.filter((txn: any) => txn.budgetMonth === month)
    }
    if (type && type !== 'all') {
      transactions = transactions.filter((txn: any) => txn.type === type)
    }
    if (category && category !== 'all') {
      transactions = transactions.filter((txn: any) => txn.categoryId === category)
    }
    if (account && account !== 'all') {
      transactions = transactions.filter((txn: any) => txn.accountId === account)
    }

    // Sort by date descending
    transactions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({
      transactions,
      total: transactions.length,
      filters: { month, type, category, account }
    })

  } catch (error) {
    console.error('Error fetching transactions:', error)
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

    const transactionRequest: CreateTransactionRequest = await request.json()
    const metadata = user.user_metadata || {}
    const existingTransactions = metadata.transactions || []

    let newTransactions: any[] = []

    // Handle different transaction types
    if (transactionRequest.type === 'transfer') {
      // Create transfer pair
      newTransactions = createTransferTransactions(transactionRequest, user.id)
    } else if (transactionRequest.splits && transactionRequest.splits.length > 0) {
      // Create split transaction
      const validation = validateSplits(
        transactionRequest.amount, 
        transactionRequest.splits,
        transactionRequest.splits[0].percentage ? 'percentage' : 'amount'
      )

      if (!validation.isValid) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }

      newTransactions = createSplitTransactions(transactionRequest, transactionRequest.splits, user.id)
    } else {
      // Create simple transaction
      const transactionId = `txn_${Date.now()}`
      newTransactions = [{
        id: transactionId,
        date: transactionRequest.date,
        merchant: transactionRequest.merchant,
        description: transactionRequest.description,
        amount: transactionRequest.type === 'expense' ? -Math.abs(transactionRequest.amount) : Math.abs(transactionRequest.amount),
        type: transactionRequest.type,
        accountId: transactionRequest.accountId,
        categoryId: transactionRequest.categoryId || 'uncategorized',
        budgetMonth: transactionRequest.budgetMonth || calculateBudgetMonth(transactionRequest.date),
        note: transactionRequest.note,
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }]
    }

    // Save to user metadata
    const updatedTransactions = [...existingTransactions, ...newTransactions]
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...metadata,
        transactions: updatedTransactions
      }
    })

    if (updateError) {
      console.error('Failed to save transaction:', updateError)
      return NextResponse.json({ error: 'Failed to save transaction' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      transactions: newTransactions,
      message: `${newTransactions.length} transaction(s) created successfully`
    })

  } catch (error) {
    console.error('Error creating transaction:', error)
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

    const { transactionId, updates } = await request.json()
    const metadata = user.user_metadata || {}
    const transactions = metadata.transactions || []

    // Find and update transaction
    const updatedTransactions = transactions.map((txn: any) => {
      if (txn.id === transactionId) {
        return {
          ...txn,
          ...updates,
          updatedAt: new Date().toISOString()
        }
      }
      return txn
    })

    // Save to user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...metadata,
        transactions: updatedTransactions
      }
    })

    if (updateError) {
      console.error('Failed to update transaction:', updateError)
      return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction updated successfully'
    })

  } catch (error) {
    console.error('Error updating transaction:', error)
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
    const transactions = metadata.transactions || []

    // Find transaction to delete
    const transaction = transactions.find((txn: any) => txn.id === transactionId)
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Handle split transaction deletion
    let toDelete = [transactionId]
    if (transaction.splitGroupId) {
      // Delete all transactions in the split group
      const splitTransactions = transactions.filter((txn: any) => 
        txn.splitGroupId === transaction.splitGroupId
      )
      toDelete = splitTransactions.map((txn: any) => txn.id)
    }

    // Handle transfer deletion
    if (transaction.transferPeerId) {
      toDelete.push(transaction.transferPeerId)
    }

    // Remove transactions
    const updatedTransactions = transactions.filter((txn: any) => 
      !toDelete.includes(txn.id)
    )

    // Save to user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...metadata,
        transactions: updatedTransactions
      }
    })

    if (updateError) {
      console.error('Failed to delete transaction:', updateError)
      return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      deletedCount: toDelete.length,
      message: `${toDelete.length} transaction(s) deleted successfully`
    })

  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}
