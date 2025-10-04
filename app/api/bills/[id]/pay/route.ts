import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { PayBillRequest } from '@/lib/types/bills'
import { calculateBudgetMonth } from '@/lib/transaction-service'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const billId = params.id
    const payRequest: PayBillRequest = await request.json()

    const metadata = user.user_metadata || {}
    const bills = metadata.bills || []
    const transactions = metadata.transactions || []

    // Find the bill
    const bill = bills.find((b: any) => b.id === billId)
    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }

    // Create payment transaction
    const transactionId = `txn_${Date.now()}`
    const paymentDate = payRequest.date || new Date().toISOString().split('T')[0]
    const paymentAmount = payRequest.amount || bill.amount
    const paymentAccount = payRequest.accountId || bill.accountId || 'default_account'

    const paymentTransaction = {
      id: transactionId,
      date: paymentDate,
      merchant: bill.name,
      description: `Bill payment: ${bill.name}`,
      amount: -Math.abs(paymentAmount), // Negative for expense
      type: 'expense',
      accountId: paymentAccount,
      categoryId: bill.categoryId,
      budgetMonth: calculateBudgetMonth(paymentDate),
      note: payRequest.note || `Auto-generated from bill payment`,
      userId: user.id,
      billId: billId, // Link to bill
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Create bill payment record
    const billPayment = {
      id: `payment_${Date.now()}`,
      billId: billId,
      txId: transactionId,
      paidAt: new Date().toISOString(),
      amount: paymentAmount,
      accountId: paymentAccount,
      note: payRequest.note
    }

    // Update user metadata
    const updatedTransactions = [...transactions, paymentTransaction]
    const billPayments = metadata.bill_payments || []
    const updatedBillPayments = [...billPayments, billPayment]

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...metadata,
        transactions: updatedTransactions,
        bill_payments: updatedBillPayments
      }
    })

    if (updateError) {
      console.error('Failed to record bill payment:', updateError)
      return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      transaction: paymentTransaction,
      payment: billPayment,
      message: `${bill.name} payment of $${paymentAmount} recorded successfully`
    })

  } catch (error) {
    console.error('Error processing bill payment:', error)
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 })
  }
}