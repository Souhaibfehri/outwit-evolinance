// Credit Card Behavior Engine
// Matches YNAB's clarity: balance vs payment available and automatic movement

export interface CreditCardAccount {
  id: string
  name: string
  type: 'credit'
  balance: number // negative = owed amount
  paymentCategoryId: string // linked payment category
  paymentStrategy: 'pay_in_full' | 'pay_over_time'
  monthlyPaymentTarget?: number // for pay_over_time cards
}

export interface CreditCardTransaction {
  id: string
  accountId: string
  categoryId: string
  amount: number // positive = charge, negative = payment
  date: string
  merchant?: string
  memo?: string
}

export interface PaymentCategoryState {
  categoryId: string
  categoryName: string
  paymentAvailable: number // funds available for payment
  cardBalance: number // actual card balance (negative)
  shouldPayInFull: boolean
  monthlyTarget?: number
  overfunded: boolean // payment available > balance
  underfunded: boolean // payment available < balance (for pay-in-full cards)
}

export interface CreditCardMove {
  type: 'spending_to_payment' | 'payment_to_spending' | 'adjust_payment'
  fromCategoryId: string
  toCategoryId: string
  amount: number
  reason: string
  automatic: boolean
}

/**
 * Process credit card expense and update payment category
 */
export function processCreditCardExpense(
  transaction: CreditCardTransaction,
  spendingCategoryId: string,
  paymentCategoryId: string,
  budgetItems: any[],
  month: string
): {
  moves: CreditCardMove[]
  updatedBudgetItems: any[]
  success: boolean
  error?: string
} {
  const moves: CreditCardMove[] = []
  const updatedBudgetItems = [...budgetItems]

  // Find spending category budget item
  const spendingItemIndex = updatedBudgetItems.findIndex(
    item => item.categoryId === spendingCategoryId && item.month === month
  )

  // Find payment category budget item
  const paymentItemIndex = updatedBudgetItems.findIndex(
    item => item.categoryId === paymentCategoryId && item.month === month
  )

  if (spendingItemIndex === -1) {
    return {
      moves: [],
      updatedBudgetItems,
      success: false,
      error: 'Spending category not found in budget'
    }
  }

  const spendingItem = updatedBudgetItems[spendingItemIndex]
  const spendingAvailable = (spendingItem.assigned || 0) - (spendingItem.spent || 0)

  // Check if spending category has enough available funds
  if (spendingAvailable < transaction.amount) {
    return {
      moves: [],
      updatedBudgetItems,
      success: false,
      error: `Insufficient funds in ${spendingItem.categoryName}. Available: $${spendingAvailable.toFixed(2)}, Needed: $${transaction.amount.toFixed(2)}`
    }
  }

  // Update spending category (increase spent)
  updatedBudgetItems[spendingItemIndex] = {
    ...spendingItem,
    spent: (spendingItem.spent || 0) + transaction.amount,
    updatedAt: new Date().toISOString()
  }

  // Update or create payment category (increase assigned)
  if (paymentItemIndex >= 0) {
    const paymentItem = updatedBudgetItems[paymentItemIndex]
    updatedBudgetItems[paymentItemIndex] = {
      ...paymentItem,
      assigned: (paymentItem.assigned || 0) + transaction.amount,
      updatedAt: new Date().toISOString()
    }
  } else {
    // Create new payment category budget item
    updatedBudgetItems.push({
      id: `budget_item_${Date.now()}_${paymentCategoryId}`,
      userId: transaction.accountId, // Assuming userId is available
      month,
      categoryId: paymentCategoryId,
      assigned: transaction.amount,
      spent: 0,
      leftoverFromPrev: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }

  // Record the automatic move
  moves.push({
    type: 'spending_to_payment',
    fromCategoryId: spendingCategoryId,
    toCategoryId: paymentCategoryId,
    amount: transaction.amount,
    reason: `Credit card expense: ${transaction.merchant || 'Purchase'}`,
    automatic: true
  })

  return {
    moves,
    updatedBudgetItems,
    success: true
  }
}

/**
 * Calculate payment category states for all credit cards
 */
export function calculatePaymentCategoryStates(
  creditCardAccounts: CreditCardAccount[],
  budgetItems: any[],
  month: string
): PaymentCategoryState[] {
  const states: PaymentCategoryState[] = []

  for (const card of creditCardAccounts) {
    const paymentItem = budgetItems.find(
      item => item.categoryId === card.paymentCategoryId && item.month === month
    )

    const paymentAvailable = paymentItem ? 
      (paymentItem.assigned || 0) - (paymentItem.spent || 0) : 0

    const cardBalance = Math.abs(card.balance) // Convert to positive for comparison
    const shouldPayInFull = card.paymentStrategy === 'pay_in_full'
    
    let overfunded = false
    let underfunded = false

    if (shouldPayInFull) {
      overfunded = paymentAvailable > cardBalance
      underfunded = paymentAvailable < cardBalance
    } else {
      const monthlyTarget = card.monthlyPaymentTarget || 0
      overfunded = paymentAvailable > monthlyTarget
      underfunded = paymentAvailable < monthlyTarget
    }

    states.push({
      categoryId: card.paymentCategoryId,
      categoryName: `${card.name} Payment`,
      paymentAvailable,
      cardBalance,
      shouldPayInFull,
      monthlyTarget: card.monthlyPaymentTarget,
      overfunded,
      underfunded
    })
  }

  return states
}

/**
 * Process credit card payment
 */
export function processCreditCardPayment(
  paymentAmount: number,
  paymentCategoryId: string,
  cardAccountId: string,
  budgetItems: any[],
  month: string
): {
  updatedBudgetItems: any[]
  updatedCardBalance: number
  success: boolean
  error?: string
} {
  const updatedBudgetItems = [...budgetItems]

  // Find payment category budget item
  const paymentItemIndex = updatedBudgetItems.findIndex(
    item => item.categoryId === paymentCategoryId && item.month === month
  )

  if (paymentItemIndex === -1) {
    return {
      updatedBudgetItems,
      updatedCardBalance: 0,
      success: false,
      error: 'Payment category not found in budget'
    }
  }

  const paymentItem = updatedBudgetItems[paymentItemIndex]
  const paymentAvailable = (paymentItem.assigned || 0) - (paymentItem.spent || 0)

  if (paymentAvailable < paymentAmount) {
    return {
      updatedBudgetItems,
      updatedCardBalance: 0,
      success: false,
      error: `Insufficient payment funds. Available: $${paymentAvailable.toFixed(2)}, Needed: $${paymentAmount.toFixed(2)}`
    }
  }

  // Update payment category (increase spent)
  updatedBudgetItems[paymentItemIndex] = {
    ...paymentItem,
    spent: (paymentItem.spent || 0) + paymentAmount,
    updatedAt: new Date().toISOString()
  }

  return {
    updatedBudgetItems,
    updatedCardBalance: paymentAmount, // This would update the card account balance
    success: true
  }
}

/**
 * Auto-fund payment categories based on card strategy
 */
export function autoFundPaymentCategories(
  creditCardAccounts: CreditCardAccount[],
  budgetItems: any[],
  availableRTA: number,
  month: string
): {
  suggestedFunding: Array<{
    categoryId: string
    categoryName: string
    currentAssigned: number
    suggestedAmount: number
    reason: string
  }>
  totalSuggested: number
  remainingRTA: number
} {
  const suggestions: Array<{
    categoryId: string
    categoryName: string
    currentAssigned: number
    suggestedAmount: number
    reason: string
  }> = []

  let remainingRTA = availableRTA

  for (const card of creditCardAccounts) {
    if (remainingRTA <= 0) break

    const paymentItem = budgetItems.find(
      item => item.categoryId === card.paymentCategoryId && item.month === month
    )

    const currentAssigned = paymentItem?.assigned || 0
    const cardBalance = Math.abs(card.balance)

    let suggestedAmount = 0
    let reason = ''

    if (card.paymentStrategy === 'pay_in_full') {
      suggestedAmount = Math.max(0, cardBalance - currentAssigned)
      reason = 'Pay in full strategy'
    } else if (card.monthlyPaymentTarget) {
      suggestedAmount = Math.max(0, card.monthlyPaymentTarget - currentAssigned)
      reason = `Monthly payment target: $${card.monthlyPaymentTarget.toLocaleString()}`
    }

    // Limit to available RTA
    suggestedAmount = Math.min(suggestedAmount, remainingRTA)

    if (suggestedAmount > 0) {
      suggestions.push({
        categoryId: card.paymentCategoryId,
        categoryName: `${card.name} Payment`,
        currentAssigned,
        suggestedAmount,
        reason
      })
      remainingRTA -= suggestedAmount
    }
  }

  const totalSuggested = suggestions.reduce((sum, s) => sum + s.suggestedAmount, 0)

  return {
    suggestedFunding: suggestions,
    totalSuggested,
    remainingRTA
  }
}

/**
 * Validate credit card transaction rules
 */
export function validateCreditCardTransaction(
  transaction: CreditCardTransaction,
  spendingCategoryId: string,
  budgetItems: any[],
  month: string
): {
  isValid: boolean
  warnings: string[]
  errors: string[]
  suggestedActions: string[]
} {
  const warnings: string[] = []
  const errors: string[] = []
  const suggestedActions: string[] = []

  // Find spending category
  const spendingItem = budgetItems.find(
    item => item.categoryId === spendingCategoryId && item.month === month
  )

  if (!spendingItem) {
    errors.push('Spending category not found in budget')
    suggestedActions.push('Create budget allocation for this category')
    return { isValid: false, warnings, errors, suggestedActions }
  }

  const spendingAvailable = (spendingItem.assigned || 0) - (spendingItem.spent || 0)

  if (spendingAvailable < transaction.amount) {
    errors.push(`Insufficient funds in ${spendingItem.categoryName}`)
    suggestedActions.push('Move funds from another category')
    suggestedActions.push('Increase budget allocation')
    return { isValid: false, warnings, errors, suggestedActions }
  }

  if (spendingAvailable - transaction.amount < spendingAvailable * 0.1) {
    warnings.push('This transaction will use most of your remaining budget for this category')
  }

  return {
    isValid: true,
    warnings,
    errors,
    suggestedActions
  }
}
