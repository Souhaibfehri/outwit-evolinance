// Budget v2 Selectors - Pure functions for derived calculations
// All values computed from transactions, never persisted

import { 
  Transaction, 
  BudgetEntry, 
  Category, 
  CategoryBalance, 
  MonthSummary,
  Group,
  GroupBalance,
  Account,
  ScheduledItem,
  SavingsRunway,
  CashFlowForecast,
  getCurrentMonth,
  getPreviousMonth
} from '@/lib/types/budget-v2'

/**
 * Calculate spent amount for a category in a specific month
 */
export function selectSpentByCategory(
  transactions: Transaction[],
  month: string,
  categoryId: string
): number {
  return transactions
    .filter(txn => {
      const txnMonth = txn.date.substring(0, 7) // YYYY-MM
      return txnMonth === month && 
             txn.type === 'outflow' && 
             txn.category_id === categoryId
    })
    .reduce((sum, txn) => {
      // Handle splits
      if (txn.splits) {
        const splitAmount = txn.splits
          .filter(split => split.category_id === categoryId)
          .reduce((splitSum, split) => splitSum + Math.abs(split.amount), 0)
        return sum + splitAmount
      }
      
      return sum + Math.abs(txn.amount)
    }, 0)
}

/**
 * Calculate assigned amount for a category in a specific month
 */
export function selectAssignedByCategory(
  budgetEntries: BudgetEntry[],
  month: string,
  categoryId: string
): number {
  const entry = budgetEntries.find(entry => 
    entry.month_id === month && entry.category_id === categoryId
  )
  return entry?.assigned || 0
}

/**
 * Calculate available amount for a category in a specific month
 */
export function selectAvailableByCategory(
  transactions: Transaction[],
  budgetEntries: BudgetEntry[],
  categories: Category[],
  month: string,
  categoryId: string
): number {
  const category = categories.find(cat => cat.id === categoryId)
  if (!category) return 0

  const assigned = selectAssignedByCategory(budgetEntries, month, categoryId)
  const spent = selectSpentByCategory(transactions, month, categoryId)
  
  // Calculate carryover from previous month
  let carryoverFromPrior = 0
  if (category.rollover_positive === 'carry') {
    const previousMonth = getPreviousMonth(month)
    const priorAssigned = selectAssignedByCategory(budgetEntries, previousMonth, categoryId)
    const priorSpent = selectSpentByCategory(transactions, previousMonth, categoryId)
    const priorAvailable = priorAssigned - priorSpent
    
    if (priorAvailable > 0) {
      carryoverFromPrior = priorAvailable
    }
  }

  return assigned - spent + carryoverFromPrior
}

/**
 * Calculate To-Allocate (TA) for a specific month
 */
export function selectTA(
  transactions: Transaction[],
  budgetEntries: BudgetEntry[],
  categories: Category[],
  month: string
): number {
  // 1. Sum inflows to budget for this month
  const inflowsToTA = transactions
    .filter(txn => {
      const txnMonth = txn.date.substring(0, 7)
      return txnMonth === month && 
             txn.type === 'inflow' && 
             txn.inflow_to_budget === true
    })
    .reduce((sum, txn) => sum + Math.abs(txn.amount), 0)

  // 2. Sum all assignments for this month
  const totalAssigned = budgetEntries
    .filter(entry => entry.month_id === month)
    .reduce((sum, entry) => sum + entry.assigned, 0)

  // 3. Calculate rollover effects from previous month
  const previousMonth = getPreviousMonth(month)
  let rolloverEffect = 0

  categories.forEach(category => {
    const priorAvailable = selectAvailableByCategory(
      transactions, 
      budgetEntries, 
      categories, 
      previousMonth, 
      category.id
    )

    if (priorAvailable > 0 && category.rollover_positive === 'return') {
      rolloverEffect += priorAvailable
    } else if (priorAvailable < 0 && category.rollover_negative === 'reduce_ta') {
      rolloverEffect += priorAvailable // Negative reduces TA
    }
  })

  return inflowsToTA - totalAssigned + rolloverEffect
}

/**
 * Get categories with overspends (Available < 0)
 */
export function selectOverspends(
  transactions: Transaction[],
  budgetEntries: BudgetEntry[],
  categories: Category[],
  month: string
): CategoryBalance[] {
  return categories
    .map(category => {
      const assigned = selectAssignedByCategory(budgetEntries, month, category.id)
      const spent = selectSpentByCategory(transactions, month, category.id)
      const available = selectAvailableByCategory(transactions, budgetEntries, categories, month, category.id)
      
      return {
        category_id: category.id,
        month,
        assigned,
        spent,
        available,
        carryover_from_prior: available - (assigned - spent)
      }
    })
    .filter(balance => balance.available < 0)
}

/**
 * Calculate complete month summary
 */
export function selectMonthSummary(
  transactions: Transaction[],
  budgetEntries: BudgetEntry[],
  categories: Category[],
  month: string
): MonthSummary {
  const to_allocate = selectTA(transactions, budgetEntries, categories, month)
  
  const categoryBalances = categories.map(category => {
    const assigned = selectAssignedByCategory(budgetEntries, month, category.id)
    const spent = selectSpentByCategory(transactions, month, category.id)
    const available = selectAvailableByCategory(transactions, budgetEntries, categories, month, category.id)
    
    return {
      category_id: category.id,
      month,
      assigned,
      spent,
      available,
      carryover_from_prior: available - (assigned - spent)
    }
  })

  const total_assigned = categoryBalances.reduce((sum, cat) => sum + cat.assigned, 0)
  const total_spent = categoryBalances.reduce((sum, cat) => sum + cat.spent, 0)
  
  const total_inflows = transactions
    .filter(txn => {
      const txnMonth = txn.date.substring(0, 7)
      return txnMonth === month && txn.type === 'inflow' && txn.inflow_to_budget === true
    })
    .reduce((sum, txn) => sum + Math.abs(txn.amount), 0)

  return {
    month,
    to_allocate,
    total_assigned,
    total_spent,
    total_inflows,
    categories: categoryBalances,
    overspends: categoryBalances.filter(cat => cat.available < 0)
  }
}

/**
 * Get planned transactions due in date range
 */
export function selectPlannedDueInRange(
  scheduledItems: any[],
  plannedTransactions: any[],
  fromDate: string,
  toDate: string
): any[] {
  return plannedTransactions.filter(planned => {
    const dueDate = planned.date
    return dueDate >= fromDate && dueDate <= toDate
  })
}

/**
 * Calculate total debt from loan accounts
 */
export function selectTotalDebt(
  accounts: Account[],
  transactions: Transaction[]
): number {
  const debtAccounts = accounts.filter(acc => acc.type === 'loan' || acc.type === 'credit')
  
  return debtAccounts.reduce((total, account) => {
    const accountBalance = transactions
      .filter(txn => txn.account_id === account.id)
      .reduce((balance, txn) => balance + txn.amount, 0)
    
    // For debt accounts, negative balance means you owe money
    return total + Math.abs(Math.min(0, accountBalance))
  }, 0)
}

/**
 * Calculate investment value from investment accounts
 */
export function selectInvestmentValue(
  accounts: Account[],
  transactions: Transaction[]
): number {
  const investmentAccounts = accounts.filter(acc => acc.type === 'investment')
  
  return investmentAccounts.reduce((total, account) => {
    const accountBalance = transactions
      .filter(txn => txn.account_id === account.id)
      .reduce((balance, txn) => balance + txn.amount, 0)
    
    return total + Math.max(0, accountBalance)
  }, 0)
}

/**
 * Calculate goal progress
 */
export function selectGoalProgress(
  scheduledItems: any[],
  transactions: Transaction[],
  goalCategoryId: string
): { saved: number; target: number; percentage: number } {
  const goalItem = scheduledItems.find(item => 
    item.type === 'goal' && item.category_id === goalCategoryId
  )
  
  if (!goalItem) return { saved: 0, target: 0, percentage: 0 }

  const target = goalItem.metadata?.target || 0
  
  // Calculate saved amount from transactions to this goal category
  const saved = transactions
    .filter(txn => txn.category_id === goalCategoryId && txn.type === 'outflow')
    .reduce((sum, txn) => sum + Math.abs(txn.amount), 0)

  const percentage = target > 0 ? Math.min(100, (saved / target) * 100) : 0

  return { saved, target, percentage }
}

/**
 * Validate month close readiness
 */
export function validateMonthClose(
  monthSummary: MonthSummary
): { canClose: boolean; issues: string[] } {
  const issues: string[] = []

  if (monthSummary.overspends.length > 0) {
    issues.push(`${monthSummary.overspends.length} categories are overspent`)
  }

  if (monthSummary.to_allocate > 0) {
    issues.push(`$${monthSummary.to_allocate.toFixed(2)} unallocated`)
  }

  return {
    canClose: issues.length === 0,
    issues
  }
}

/**
 * Calculate frequency multiplier for monthly normalization
 */
export function getFrequencyMultiplier(cadence: string): number {
  switch (cadence) {
    case 'weekly': return 52 / 12
    case 'biweekly': return 26 / 12
    case 'semimonthly': return 2
    case 'monthly': return 1
    case 'quarterly': return 1 / 3
    case 'yearly': return 1 / 12
    case 'oneoff': return 0
    default: return 1
  }
}

/**
 * Calculate minimum required amount for a category (from bills)
 */
export function selectMinRequiredByCategory(
  scheduledItems: ScheduledItem[],
  month: string,
  categoryId: string
): number {
  const monthStart = new Date(`${month}-01`)
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)

  return scheduledItems
    .filter(item => 
      item.type === 'bill' && 
      item.category_id === categoryId &&
      new Date(item.next_due) >= monthStart &&
      new Date(item.next_due) <= monthEnd
    )
    .reduce((sum, item) => {
      // Handle flexible bills (use average or fixed amount)
      const amount = item.metadata?.flexible 
        ? item.metadata?.average_amount || Math.abs(item.amount)
        : Math.abs(item.amount)
      
      return sum + amount
    }, 0)
}

/**
 * Calculate group rollup (assigned, spent, available, minReq, shortfall)
 */
export function selectGroupRollup(
  transactions: Transaction[],
  budgetEntries: BudgetEntry[],
  categories: Category[],
  scheduledItems: ScheduledItem[],
  groups: Group[],
  month: string,
  groupId: string
): GroupBalance {
  const group = groups.find(g => g.id === groupId)
  const groupCategories = categories.filter(cat => cat.group_id === groupId)

  const categoryBalances = groupCategories.map(category => {
    const assigned = selectAssignedByCategory(budgetEntries, month, category.id)
    const spent = selectSpentByCategory(transactions, month, category.id)
    const available = selectAvailableByCategory(transactions, budgetEntries, categories, month, category.id)
    const minRequired = selectMinRequiredByCategory(scheduledItems, month, category.id)
    
    return {
      category_id: category.id,
      month,
      assigned,
      spent,
      available,
      carryover_from_prior: available - (assigned - spent)
    }
  })

  const groupAssigned = categoryBalances.reduce((sum, cat) => sum + cat.assigned, 0)
  const groupSpent = categoryBalances.reduce((sum, cat) => sum + cat.spent, 0)
  const groupAvailable = categoryBalances.reduce((sum, cat) => sum + cat.available, 0)
  const groupMinRequired = groupCategories.reduce((sum, cat) => 
    sum + selectMinRequiredByCategory(scheduledItems, month, cat.id), 0
  )
  const groupShortfall = Math.max(0, groupMinRequired - groupAssigned)

  return {
    group_id: groupId,
    group_name: group?.name || 'Unknown Group',
    group_type: group?.type || 'other',
    month,
    assigned: groupAssigned,
    spent: groupSpent,
    available: groupAvailable,
    min_required: groupMinRequired,
    shortfall: groupShortfall,
    categories: categoryBalances
  }
}

/**
 * Calculate liquid cash now (on-budget cash accounts)
 */
export function selectLiquidCashNow(
  accounts: Account[],
  transactions: Transaction[]
): number {
  const liquidAccounts = accounts.filter(acc => 
    acc.on_budget && (acc.type === 'checking' || acc.type === 'savings')
  )

  return liquidAccounts.reduce((total, account) => {
    // Calculate current balance from transactions
    const currentBalance = transactions
      .filter(txn => txn.account_id === account.id)
      .reduce((balance, txn) => balance + txn.amount, account.balance || 0)
    
    return total + Math.max(0, currentBalance)
  }, 0)
}

/**
 * Calculate monthly income forecast
 */
export function selectMonthlyIncomeForecast(
  scheduledItems: ScheduledItem[],
  transactions: Transaction[],
  month: string,
  mode: 'planned_only' | 'planned_plus_average' = 'planned_plus_average'
): number {
  // Get scheduled income for the month
  const plannedIncome = scheduledItems
    .filter(item => item.type === 'income')
    .reduce((sum, item) => {
      const monthlyAmount = Math.abs(item.amount) * getFrequencyMultiplier(item.cadence)
      return sum + monthlyAmount
    }, 0)

  if (mode === 'planned_only') {
    return plannedIncome
  }

  // Add average from last 3 months of actual income
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const recentIncome = transactions
    .filter(txn => 
      txn.type === 'inflow' && 
      txn.inflow_to_budget === true &&
      new Date(txn.date) >= threeMonthsAgo
    )
    .reduce((sum, txn) => sum + Math.abs(txn.amount), 0)

  const averageMonthlyIncome = recentIncome / 3

  // Use higher of planned or average for conservative estimate
  return Math.max(plannedIncome, averageMonthlyIncome)
}

/**
 * Calculate monthly outflow forecast
 */
export function selectMonthlyOutflowForecast(
  scheduledItems: ScheduledItem[],
  transactions: Transaction[],
  categories: Category[],
  month: string,
  mode: 'planned_only' | 'planned_plus_average' = 'planned_plus_average'
): number {
  // Bills forecast
  const billsForecast = scheduledItems
    .filter(item => item.type === 'bill')
    .reduce((sum, item) => {
      const monthlyAmount = Math.abs(item.amount) * getFrequencyMultiplier(item.cadence)
      return sum + monthlyAmount
    }, 0)

  // Planned contributions (goals, debts, investments)
  const plannedContributions = scheduledItems
    .filter(item => ['goal', 'debt', 'investment'].includes(item.type))
    .reduce((sum, item) => {
      const monthlyAmount = Math.abs(item.amount) * getFrequencyMultiplier(item.cadence)
      return sum + monthlyAmount
    }, 0)

  if (mode === 'planned_only') {
    return billsForecast + plannedContributions
  }

  // Variable spend forecast (rolling 90-day average of non-bill categories)
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const billCategoryIds = scheduledItems
    .filter(item => item.type === 'bill')
    .map(item => item.category_id)
    .filter(Boolean)

  const variableSpend = transactions
    .filter(txn => 
      txn.type === 'outflow' &&
      txn.category_id &&
      !billCategoryIds.includes(txn.category_id) &&
      new Date(txn.date) >= ninetyDaysAgo
    )
    .reduce((sum, txn) => sum + Math.abs(txn.amount), 0)

  const averageMonthlyVariable = variableSpend / 3

  return billsForecast + plannedContributions + averageMonthlyVariable
}

/**
 * Calculate savings runway
 */
export function selectRunway(
  accounts: Account[],
  transactions: Transaction[],
  scheduledItems: ScheduledItem[],
  categories: Category[],
  month: string,
  mode: 'planned_only' | 'planned_plus_average' = 'planned_plus_average',
  warningThresholdMonths: number = 6
): SavingsRunway {
  const liquidCash = selectLiquidCashNow(accounts, transactions)
  const monthlyIncome = selectMonthlyIncomeForecast(scheduledItems, transactions, month, mode)
  const monthlyOutflow = selectMonthlyOutflowForecast(scheduledItems, transactions, categories, month, mode)
  
  const monthlyNet = monthlyIncome - monthlyOutflow
  
  let runwayMonths = Infinity
  let depletionDate: string | undefined

  if (monthlyNet < 0) {
    runwayMonths = liquidCash / Math.abs(monthlyNet)
    
    // Calculate depletion date
    const depletionMonths = Math.ceil(runwayMonths)
    const depletionDateObj = new Date()
    depletionDateObj.setMonth(depletionDateObj.getMonth() + depletionMonths)
    depletionDate = `${depletionDateObj.getFullYear()}-${String(depletionDateObj.getMonth() + 1).padStart(2, '0')}`
  }

  return {
    liquid_cash_now: liquidCash,
    monthly_income_forecast: monthlyIncome,
    monthly_bills_forecast: scheduledItems
      .filter(item => item.type === 'bill')
      .reduce((sum, item) => sum + Math.abs(item.amount) * getFrequencyMultiplier(item.cadence), 0),
    variable_spend_forecast: monthlyOutflow - monthlyIncome, // Simplified
    planned_contributions: scheduledItems
      .filter(item => ['goal', 'debt', 'investment'].includes(item.type))
      .reduce((sum, item) => sum + Math.abs(item.amount) * getFrequencyMultiplier(item.cadence), 0),
    monthly_outflow_forecast: monthlyOutflow,
    monthly_net_forecast: monthlyNet,
    runway_months: runwayMonths,
    depletion_date: depletionDate,
    forecast_mode: mode,
    warning_threshold_months: warningThresholdMonths,
    is_critical: runwayMonths <= warningThresholdMonths
  }
}

/**
 * Calculate coverage percentage (funded bills / total bills due)
 */
export function selectCoveragePct(
  transactions: Transaction[],
  budgetEntries: BudgetEntry[],
  scheduledItems: ScheduledItem[],
  month: string
): number {
  const billsThisMonth = scheduledItems.filter(item => {
    if (item.type !== 'bill') return false
    const dueDate = new Date(item.next_due)
    const monthStart = new Date(`${month}-01`)
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)
    return dueDate >= monthStart && dueDate <= monthEnd
  })

  if (billsThisMonth.length === 0) return 100

  const totalBillsAmount = billsThisMonth.reduce((sum, bill) => 
    sum + Math.abs(bill.amount), 0
  )

  const fundedAmount = billsThisMonth.reduce((sum, bill) => {
    if (!bill.category_id) return sum
    const assigned = selectAssignedByCategory(budgetEntries, month, bill.category_id)
    const billAmount = Math.abs(bill.amount)
    return sum + Math.min(assigned, billAmount)
  }, 0)

  return totalBillsAmount > 0 ? (fundedAmount / totalBillsAmount) * 100 : 100
}
