// Budget integration utilities for Income & Investments with RTA updates

import { getCurrentMonth, getNextMonth } from '@/lib/types/budget-v2'

export interface RTAUpdate {
  amount: number
  budgetMonth: string
  category?: string
  description: string
  source: 'income' | 'investment' | 'goal'
}

export interface BudgetMonthAssignment {
  date: Date
  eomThresholdDays: number
  userChoice?: 'current' | 'next'
}

/**
 * Determine which budget month to assign a transaction to
 */
export function getBudgetMonthAssignment(
  assignment: BudgetMonthAssignment
): { budgetMonth: string; shouldPrompt: boolean; reason: string } {
  const { date, eomThresholdDays, userChoice } = assignment
  
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const daysUntilEOM = lastDayOfMonth - date.getDate()
  const shouldPrompt = daysUntilEOM <= eomThresholdDays

  if (userChoice) {
    // User explicitly chose
    const budgetMonth = userChoice === 'next' ? getNextMonth(getCurrentMonth()) : getCurrentMonth()
    return {
      budgetMonth,
      shouldPrompt: false,
      reason: `User selected ${userChoice} month`
    }
  }

  if (shouldPrompt) {
    // Within threshold - suggest next month but allow current
    return {
      budgetMonth: getCurrentMonth(),
      shouldPrompt: true,
      reason: `Within ${eomThresholdDays} days of month end - consider assigning to next month`
    }
  }

  // Normal assignment to current month
  return {
    budgetMonth: getCurrentMonth(),
    shouldPrompt: false,
    reason: 'Standard current month assignment'
  }
}

/**
 * Calculate RTA impact of income/investment transactions
 */
export function calculateRTAImpact(updates: RTAUpdate[]): {
  totalIncrease: number
  totalDecrease: number
  netChange: number
  byMonth: Record<string, number>
  byCategory: Record<string, number>
} {
  const byMonth: Record<string, number> = {}
  const byCategory: Record<string, number> = {}
  let totalIncrease = 0
  let totalDecrease = 0

  updates.forEach(update => {
    // Track by month
    byMonth[update.budgetMonth] = (byMonth[update.budgetMonth] || 0) + update.amount

    // Track by category
    if (update.category) {
      byCategory[update.category] = (byCategory[update.category] || 0) + Math.abs(update.amount)
    }

    // Track increases vs decreases
    if (update.amount > 0) {
      totalIncrease += update.amount
    } else {
      totalDecrease += Math.abs(update.amount)
    }
  })

  return {
    totalIncrease,
    totalDecrease,
    netChange: totalIncrease - totalDecrease,
    byMonth,
    byCategory
  }
}

/**
 * Create income transaction that increases RTA
 */
export function createIncomeTransaction(
  occurrence: {
    id: string
    sourceId: string
    amount: number
    date: string
    accountId: string
    budgetMonth: string
    note?: string
  }
): any {
  return {
    id: `txn_income_${occurrence.id}`,
    date: occurrence.date,
    account_id: occurrence.accountId,
    payee: 'Income',
    memo: occurrence.note || `Income from source ${occurrence.sourceId}`,
    amount: Math.abs(occurrence.amount),
    type: 'inflow',
    category_id: null, // Income increases RTA
    inflow_to_budget: true,
    income_occurrence_id: occurrence.id,
    budget_month: occurrence.budgetMonth
  }
}

/**
 * Create investment contribution transaction
 */
export function createInvestmentTransaction(
  contribution: {
    id: string
    accountId: string
    amount: number
    date: string
    source: 'RTA' | 'TRANSFER' | 'ONE_OFF'
    sourceAccountId?: string
    budgetMonth: string
    note?: string
  }
): any[] {
  const transactions = []

  switch (contribution.source) {
    case 'RTA':
      // Create expense transaction that reduces RTA
      transactions.push({
        id: `txn_invest_rta_${contribution.id}`,
        date: contribution.date,
        account_id: 'budget_account',
        payee: `Investment: ${contribution.accountId}`,
        memo: contribution.note || 'Investment contribution from RTA',
        amount: -Math.abs(contribution.amount),
        type: 'outflow',
        category_id: 'investment_contributions',
        inflow_to_budget: false,
        investment_contribution_id: contribution.id,
        budget_month: contribution.budgetMonth
      })
      break

    case 'TRANSFER':
      // Create transfer transactions (no budget impact)
      if (!contribution.sourceAccountId) {
        throw new Error('Source account required for transfers')
      }
      
      const transferId = `transfer_invest_${contribution.id}`
      
      transactions.push(
        // Outflow from source account
        {
          id: `${transferId}_out`,
          date: contribution.date,
          account_id: contribution.sourceAccountId,
          payee: `Investment: ${contribution.accountId}`,
          memo: contribution.note || 'Investment transfer',
          amount: -Math.abs(contribution.amount),
          type: 'outflow',
          category_id: null,
          inflow_to_budget: false,
          related_txn_id: `${transferId}_in`,
          investment_contribution_id: contribution.id
        },
        // Inflow to investment account
        {
          id: `${transferId}_in`,
          date: contribution.date,
          account_id: contribution.accountId,
          payee: `From ${contribution.sourceAccountId}`,
          memo: contribution.note || 'Investment contribution',
          amount: Math.abs(contribution.amount),
          type: 'inflow',
          category_id: null,
          inflow_to_budget: false,
          related_txn_id: `${transferId}_out`,
          investment_contribution_id: contribution.id
        }
      )
      break

    case 'ONE_OFF':
      // Create income then immediate investment allocation
      const incomeId = `txn_invest_income_${contribution.id}`
      
      transactions.push(
        // Income transaction
        {
          id: `${incomeId}_income`,
          date: contribution.date,
          account_id: contribution.sourceAccountId || 'budget_account',
          payee: 'One-off Income',
          memo: `Income for investment`,
          amount: Math.abs(contribution.amount),
          type: 'inflow',
          category_id: null,
          inflow_to_budget: true,
          related_txn_id: `${incomeId}_allocation`
        },
        // Immediate allocation to investment
        {
          id: `${incomeId}_allocation`,
          date: contribution.date,
          account_id: 'budget_account',
          payee: `Investment: ${contribution.accountId}`,
          memo: contribution.note || 'Allocated to investment',
          amount: -Math.abs(contribution.amount),
          type: 'outflow',
          category_id: 'investment_contributions',
          inflow_to_budget: false,
          related_txn_id: `${incomeId}_income`,
          investment_contribution_id: contribution.id,
          budget_month: contribution.budgetMonth
        }
      )
      break
  }

  return transactions
}

/**
 * Allocation template system for automatic budget assignment
 */
export interface AllocationRule {
  categoryId: string
  categoryName: string
  percentage: number // 0-100
  priority: number // 1-5, for overflow handling
}

export interface AllocationTemplate {
  id: string
  userId: string
  name: string
  rules: AllocationRule[]
  totalPercentage: number
  createdAt: string
}

export function validateAllocationTemplate(template: Omit<AllocationTemplate, 'id' | 'userId' | 'createdAt'>): {
  isValid: boolean
  errors: string[]
  totalPercentage: number
} {
  const errors: string[] = []
  
  if (!template.name?.trim()) {
    errors.push('Template name is required')
  }
  
  if (!template.rules || template.rules.length === 0) {
    errors.push('At least one allocation rule is required')
  }
  
  const totalPercentage = template.rules.reduce((sum, rule) => sum + rule.percentage, 0)
  
  if (Math.abs(totalPercentage - 100) > 0.01) {
    errors.push(`Total allocation must equal 100% (currently ${totalPercentage.toFixed(1)}%)`)
  }
  
  // Check for duplicate categories
  const categoryIds = template.rules.map(rule => rule.categoryId)
  const uniqueCategoryIds = new Set(categoryIds)
  if (categoryIds.length !== uniqueCategoryIds.size) {
    errors.push('Each category can only appear once in the template')
  }
  
  // Validate individual rules
  template.rules.forEach((rule, index) => {
    if (!rule.categoryId) {
      errors.push(`Rule ${index + 1}: Category is required`)
    }
    if (rule.percentage < 0 || rule.percentage > 100) {
      errors.push(`Rule ${index + 1}: Percentage must be between 0% and 100%`)
    }
    if (rule.priority < 1 || rule.priority > 5) {
      errors.push(`Rule ${index + 1}: Priority must be between 1 and 5`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    totalPercentage
  }
}

/**
 * Apply allocation template to an income amount
 */
export function applyAllocationTemplate(
  template: AllocationTemplate,
  amount: number,
  budgetMonth: string
): {
  allocations: Array<{
    categoryId: string
    categoryName: string
    amount: number
    percentage: number
  }>
  totalAllocated: number
  remainder: number
} {
  const allocations = template.rules.map(rule => ({
    categoryId: rule.categoryId,
    categoryName: rule.categoryName,
    amount: Math.round((amount * rule.percentage) / 100),
    percentage: rule.percentage
  }))

  const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.amount, 0)
  const remainder = amount - totalAllocated

  // If there's a remainder due to rounding, add it to the highest priority category
  if (remainder !== 0) {
    const highestPriorityRule = template.rules.reduce((highest, rule) => 
      rule.priority > highest.priority ? rule : highest
    )
    
    const targetAllocation = allocations.find(alloc => alloc.categoryId === highestPriorityRule.categoryId)
    if (targetAllocation) {
      targetAllocation.amount += remainder
    }
  }

  return {
    allocations,
    totalAllocated: amount,
    remainder: 0
  }
}

/**
 * Month-end assignment helper
 */
export function getEOMAssignmentOptions(date: Date, eomThresholdDays: number = 3): {
  shouldPrompt: boolean
  currentMonth: string
  nextMonth: string
  daysUntilEOM: number
  recommendation: 'current' | 'next'
} {
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const daysUntilEOM = lastDayOfMonth - date.getDate()
  const shouldPrompt = daysUntilEOM <= eomThresholdDays

  const currentMonth = getCurrentMonth()
  const nextMonth = getNextMonth(currentMonth)
  
  // Recommend next month if very close to EOM
  const recommendation = daysUntilEOM <= 1 ? 'next' : 'current'

  return {
    shouldPrompt,
    currentMonth,
    nextMonth,
    daysUntilEOM,
    recommendation
  }
}
