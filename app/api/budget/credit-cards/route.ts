import { NextRequest, NextResponse } from 'next/server'
import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'
import { 
  processCreditCardExpense,
  processCreditCardPayment,
  calculatePaymentCategoryStates,
  autoFundPaymentCategories,
  CreditCardTransaction
} from '@/lib/credit-cards/engine'
import { z } from 'zod'

const CreditCardExpenseSchema = z.object({
  transaction: z.object({
    id: z.string(),
    accountId: z.string(),
    categoryId: z.string(),
    amount: z.number().positive(),
    date: z.string(),
    merchant: z.string().optional(),
    memo: z.string().optional()
  }),
  spendingCategoryId: z.string(),
  paymentCategoryId: z.string(),
  month: z.string().regex(/^\d{4}-\d{2}$/)
})

const CreditCardPaymentSchema = z.object({
  paymentAmount: z.number().positive(),
  paymentCategoryId: z.string(),
  cardAccountId: z.string(),
  month: z.string().regex(/^\d{4}-\d{2}$/)
})

const AutoFundPaymentsSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  availableRTA: z.number()
})

// Get credit card payment states
export async function GET(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') || getCurrentMonth()

    const metadata = user.user_metadata || {}
    const accounts = metadata.accounts || []
    const budgetItems = metadata.budget_items || []

    // Find credit card accounts
    const creditCardAccounts = accounts.filter((account: any) => 
      account.type === 'credit' && account.paymentCategoryId
    )

    if (creditCardAccounts.length === 0) {
      return NextResponse.json({
        success: true,
        paymentStates: [],
        message: 'No credit card accounts found'
      })
    }

    // Calculate payment states
    const paymentStates = calculatePaymentCategoryStates(
      creditCardAccounts,
      budgetItems,
      month
    )

    return NextResponse.json({
      success: true,
      paymentStates,
      month,
      creditCardCount: creditCardAccounts.length
    })

  } catch (error) {
    console.error('Error getting credit card states:', error)
    return NextResponse.json(
      { error: 'Failed to get credit card states' },
      { status: 500 }
    )
  }
}

// Process credit card expense
export async function POST(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = CreditCardExpenseSchema.parse(body)

    const metadata = user.user_metadata || {}
    const budgetItems = metadata.budget_items || []
    const transactions = metadata.transactions_v2 || []

    // Process the credit card expense
    const result = processCreditCardExpense(
      validatedData.transaction,
      validatedData.spendingCategoryId,
      validatedData.paymentCategoryId,
      budgetItems,
      validatedData.month
    )

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 400 })
    }

    // Add transaction to history
    const newTransaction = {
      ...validatedData.transaction,
      budgetMonth: validatedData.month,
      type: 'outflow',
      createdAt: new Date().toISOString()
    }

    const updatedTransactions = [...transactions, newTransaction]

    // Save updates
    const updateResult = await updateUserMetadata({
      ...metadata,
      budget_items: result.updatedBudgetItems,
      transactions_v2: updatedTransactions,
      credit_card_moves: [...(metadata.credit_card_moves || []), ...result.moves]
    })

    if (!updateResult.success) {
      return NextResponse.json({ error: updateResult.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      transaction: newTransaction,
      moves: result.moves,
      updatedCategories: result.moves.map(move => [move.fromCategoryId, move.toCategoryId]).flat()
    })

  } catch (error) {
    console.error('Error processing credit card expense:', error)
    return NextResponse.json(
      { error: 'Failed to process credit card expense' },
      { status: 500 }
    )
  }
}

// Process credit card payment
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = CreditCardPaymentSchema.parse(body)

    const metadata = user.user_metadata || {}
    const budgetItems = metadata.budget_items || []
    const accounts = metadata.accounts || []
    const transactions = metadata.transactions_v2 || []

    // Process the payment
    const result = processCreditCardPayment(
      validatedData.paymentAmount,
      validatedData.paymentCategoryId,
      validatedData.cardAccountId,
      budgetItems,
      validatedData.month
    )

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 400 })
    }

    // Update card account balance
    const updatedAccounts = accounts.map((account: any) => {
      if (account.id === validatedData.cardAccountId) {
        return {
          ...account,
          balance: account.balance + validatedData.paymentAmount, // Reduce debt (increase balance toward 0)
          updatedAt: new Date().toISOString()
        }
      }
      return account
    })

    // Create payment transaction
    const paymentTransaction = {
      id: `payment_${Date.now()}`,
      accountId: validatedData.cardAccountId,
      categoryId: validatedData.paymentCategoryId,
      amount: -validatedData.paymentAmount, // Negative for payment
      date: new Date().toISOString().split('T')[0],
      merchant: 'Credit Card Payment',
      type: 'outflow',
      budgetMonth: validatedData.month,
      createdAt: new Date().toISOString()
    }

    const updatedTransactions = [...transactions, paymentTransaction]

    // Save updates
    const updateResult = await updateUserMetadata({
      ...metadata,
      budget_items: result.updatedBudgetItems,
      accounts: updatedAccounts,
      transactions_v2: updatedTransactions
    })

    if (!updateResult.success) {
      return NextResponse.json({ error: updateResult.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      paymentAmount: validatedData.paymentAmount,
      newCardBalance: result.updatedCardBalance,
      transaction: paymentTransaction
    })

  } catch (error) {
    console.error('Error processing credit card payment:', error)
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    )
  }
}

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
