import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { MakePaymentRequest } from '@/lib/types/debts'
import { calculatePaymentAllocation } from '@/lib/debt-payoff-engine'
import { getCurrentMonth, getNextMonth } from '@/lib/types/budget-v2'

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

    const debtId = params.id
    const paymentRequest: MakePaymentRequest = await request.json()

    const metadata = user.user_metadata || {}
    const debts = metadata.debt_accounts || []
    const transactions = metadata.transactions_v2 || []
    const debtPayments = metadata.debt_payments || []

    // Find the debt
    const debt = debts.find((d: any) => d.id === debtId)
    if (!debt) {
      return NextResponse.json({ error: 'Debt not found' }, { status: 404 })
    }

    // Calculate payment allocation (interest vs principal)
    const allocation = calculatePaymentAllocation(debt, paymentRequest.amount)
    
    // Determine budget month
    const budgetMonth = paymentRequest.assignToMonth === 'next' 
      ? getNextMonth(getCurrentMonth())
      : getCurrentMonth()

    // Create payment transaction(s)
    const transactionId = `txn_${Date.now()}`
    const paymentTransactions = []

    if (debt.type === 'credit_card') {
      // Credit card payment: Transfer from checking to credit card
      const transferId = `transfer_${Date.now()}`
      
      paymentTransactions.push(
        // Outflow from checking account
        {
          id: `${transferId}_out`,
          date: paymentRequest.date,
          account_id: paymentRequest.accountId,
          payee: debt.name,
          memo: `Payment to ${debt.name}`,
          amount: -Math.abs(paymentRequest.amount),
          type: 'outflow',
          category_id: 'debt_payments', // Budget category for debt payments
          inflow_to_budget: false,
          related_txn_id: `${transferId}_in`
        },
        // Inflow to credit card (reduces debt)
        {
          id: `${transferId}_in`,
          date: paymentRequest.date,
          account_id: debt.id, // Credit card account
          payee: 'Payment',
          memo: `Payment from ${paymentRequest.accountId}`,
          amount: Math.abs(paymentRequest.amount),
          type: 'inflow',
          category_id: null,
          inflow_to_budget: false,
          related_txn_id: `${transferId}_out`
        }
      )
    } else {
      // Loan payment: Split between interest (expense) and principal (transfer)
      paymentTransactions.push(
        // Interest expense
        {
          id: `${transactionId}_interest`,
          date: paymentRequest.date,
          account_id: paymentRequest.accountId,
          payee: debt.name,
          memo: `Interest payment - ${debt.name}`,
          amount: -allocation.interest,
          type: 'outflow',
          category_id: 'debt_interest',
          inflow_to_budget: false,
          related_txn_id: transactionId
        },
        // Principal payment (transfer to loan account)
        {
          id: `${transactionId}_principal`,
          date: paymentRequest.date,
          account_id: debt.id, // Loan account
          payee: 'Principal Payment',
          memo: `Principal payment - ${debt.name}`,
          amount: allocation.principal,
          type: 'inflow',
          category_id: null,
          inflow_to_budget: false,
          related_txn_id: transactionId
        }
      )
    }

    // Create debt payment record
    const debtPayment = {
      id: `payment_${Date.now()}`,
      debtId: debtId,
      transactionId: transactionId,
      paidAt: new Date().toISOString(),
      amount: paymentRequest.amount,
      allocation: {
        interest: allocation.interest,
        principal: allocation.principal,
        fees: allocation.fees
      }
    }

    // Update debt balance
    const updatedDebts = debts.map((d: any) => {
      if (d.id === debtId) {
        return {
          ...d,
          principalBalance: Math.max(0, d.principalBalance - allocation.principal),
          updatedAt: new Date().toISOString()
        }
      }
      return d
    })

    // Atomic update: save all changes together
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...metadata,
        debt_accounts: updatedDebts,
        transactions_v2: [...transactions, ...paymentTransactions],
        debt_payments: [...debtPayments, debtPayment]
      }
    })

    if (updateError) {
      console.error('Failed to record debt payment:', updateError)
      return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
    }

    // Calculate new balance for response
    const newBalance = Math.max(0, debt.principalBalance - allocation.principal)
    const isPaidOff = newBalance <= 0.01

    return NextResponse.json({
      success: true,
      payment: debtPayment,
      transactions: paymentTransactions,
      allocation,
      new_balance: newBalance,
      paid_off: isPaidOff,
      message: isPaidOff 
        ? `🎉 ${debt.name} is paid off! Congratulations!`
        : `Payment recorded. New balance: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(newBalance)}`
    })

  } catch (error) {
    console.error('Error processing debt payment:', error)
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 })
  }
}
