// Forecast Engine - 12-Month Predictive Cashflow Timeline
// Computes baseline forecast + applies user overrides

import { getCurrentMonth, getNextMonth, getPreviousMonth } from '@/lib/types/budget-v2'

export interface ForecastMonth {
  month: string // YYYY-MM
  income: number
  rta: number
  categories: ForecastCategory[]
  totalAssigned: number
  totalSpent: number
  netCashFlow: number
}

export interface ForecastCategory {
  categoryId: string
  categoryName: string
  groupId: string
  groupName: string
  baseline: number // computed from targets/averages
  override?: number // user delta adjustment
  final: number // baseline + override
  confidence: 'high' | 'medium' | 'low'
}

export interface ForecastOverride {
  id?: string
  userId: string
  month: string
  categoryId: string | null // null for income overrides
  deltaAmount: number
  note?: string
}

export interface ForecastSnapshot {
  id?: string
  userId: string
  name: string
  baseMonth: string
  data: ForecastMonth[]
}

export interface ForecastOptions {
  includeOverrides: boolean
  seasonalityFactor: boolean
  confidenceThreshold: 'conservative' | 'moderate' | 'optimistic'
}

/**
 * Generate 18-month forecast (past 6 + next 12)
 */
export function generateForecast(
  userData: any,
  options: ForecastOptions = {
    includeOverrides: true,
    seasonalityFactor: true,
    confidenceThreshold: 'moderate'
  }
): ForecastMonth[] {
  const currentMonth = getCurrentMonth()
  const months: string[] = []
  
  // Generate past 6 months
  let month = currentMonth
  for (let i = 0; i < 6; i++) {
    month = getPreviousMonth(month)
    months.unshift(month)
  }
  
  // Add current month
  months.push(currentMonth)
  
  // Generate next 12 months
  month = currentMonth
  for (let i = 0; i < 12; i++) {
    month = getNextMonth(month)
    months.push(month)
  }
  
  const forecast: ForecastMonth[] = []
  
  for (const forecastMonth of months) {
    const monthData = computeMonthForecast(userData, forecastMonth, options)
    forecast.push(monthData)
  }
  
  return forecast
}

/**
 * Compute forecast for a single month
 */
function computeMonthForecast(
  userData: any,
  month: string,
  options: ForecastOptions
): ForecastMonth {
  const isPastMonth = month < getCurrentMonth()
  const isCurrentMonth = month === getCurrentMonth()
  
  // For past/current months, use actual data
  if (isPastMonth || isCurrentMonth) {
    return computeActualMonth(userData, month)
  }
  
  // For future months, compute baseline + apply overrides
  return computePredictedMonth(userData, month, options)
}

/**
 * Compute actual data for past/current months
 */
function computeActualMonth(userData: any, month: string): ForecastMonth {
  const budgetItems = userData.budget_items || []
  const transactions = userData.transactions_v2 || []
  const categories = userData.categories || []
  const categoryGroups = userData.category_groups || []
  const recurringIncome = userData.recurring_income || []
  const oneOffIncome = userData.one_off_income || []
  
  // Calculate actual income for the month
  const monthlyIncome = calculateMonthlyIncome(recurringIncome, oneOffIncome, month)
  
  // Get actual category data
  const forecastCategories: ForecastCategory[] = categories.map((cat: any) => {
    const budgetItem = budgetItems.find((bi: any) => 
      bi.categoryId === cat.id && bi.month === month
    )
    
    const spent = transactions
      .filter((txn: any) => 
        txn.categoryId === cat.id && 
        txn.budgetMonth === month &&
        txn.type === 'outflow'
      )
      .reduce((sum: number, txn: any) => sum + Math.abs(txn.amount), 0)
    
    const group = categoryGroups.find((g: any) => g.id === cat.groupId)
    
    return {
      categoryId: cat.id,
      categoryName: cat.name,
      groupId: cat.groupId || 'uncategorized',
      groupName: group?.name || 'Uncategorized',
      baseline: budgetItem?.assigned || 0,
      final: budgetItem?.assigned || 0,
      confidence: 'high' as const
    }
  })
  
  const totalAssigned = forecastCategories.reduce((sum, cat) => sum + cat.final, 0)
  const totalSpent = forecastCategories.reduce((sum, cat) => {
    const spent = transactions
      .filter((txn: any) => 
        txn.categoryId === cat.categoryId && 
        txn.budgetMonth === month &&
        txn.type === 'outflow'
      )
      .reduce((s: number, txn: any) => s + Math.abs(txn.amount), 0)
    return sum + spent
  }, 0)
  
  const rta = monthlyIncome - totalAssigned
  
  return {
    month,
    income: monthlyIncome,
    rta,
    categories: forecastCategories,
    totalAssigned,
    totalSpent,
    netCashFlow: monthlyIncome - totalSpent
  }
}

/**
 * Compute predicted data for future months
 */
function computePredictedMonth(
  userData: any,
  month: string,
  options: ForecastOptions
): ForecastMonth {
  const categories = userData.categories || []
  const categoryGroups = userData.category_groups || []
  const recurringIncome = userData.recurring_income || []
  const overrides = userData.forecast_overrides || []
  
  // Calculate projected income
  const projectedIncome = calculateMonthlyIncome(recurringIncome, [], month)
  
  // Apply income overrides if any
  const incomeOverride = overrides.find((o: any) => 
    o.month === month && o.categoryId === null
  )
  const finalIncome = projectedIncome + (incomeOverride?.deltaAmount || 0)
  
  // Compute category baselines using WMA(3) with seasonality
  const forecastCategories: ForecastCategory[] = categories.map((cat: any) => {
    const baseline = computeCategoryBaseline(userData, cat, month, options)
    
    // Apply category override if any
    const categoryOverride = overrides.find((o: any) => 
      o.month === month && o.categoryId === cat.id
    )
    
    const group = categoryGroups.find((g: any) => g.id === cat.groupId)
    
    return {
      categoryId: cat.id,
      categoryName: cat.name,
      groupId: cat.groupId || 'uncategorized',
      groupName: group?.name || 'Uncategorized',
      baseline,
      override: categoryOverride?.deltaAmount,
      final: baseline + (categoryOverride?.deltaAmount || 0),
      confidence: determineConfidence(userData, cat, month)
    }
  })
  
  const totalAssigned = forecastCategories.reduce((sum, cat) => sum + cat.final, 0)
  const rta = finalIncome - totalAssigned
  
  // Estimate spending based on assigned amounts (conservative)
  const estimatedSpending = totalAssigned * 0.95 // Assume 95% utilization
  
  return {
    month,
    income: finalIncome,
    rta,
    categories: forecastCategories,
    totalAssigned,
    totalSpent: estimatedSpending,
    netCashFlow: finalIncome - estimatedSpending
  }
}

/**
 * Compute category baseline using Weighted Moving Average with seasonality
 */
function computeCategoryBaseline(
  userData: any,
  category: any,
  targetMonth: string,
  options: ForecastOptions
): number {
  const budgetItems = userData.budget_items || []
  const transactions = userData.transactions_v2 || []
  
  // Get last 3 months of data for WMA calculation
  const months = [
    getPreviousMonth(getPreviousMonth(getPreviousMonth(targetMonth))),
    getPreviousMonth(getPreviousMonth(targetMonth)),
    getPreviousMonth(targetMonth)
  ]
  
  const historicalData = months.map(month => {
    const budgetItem = budgetItems.find((bi: any) => 
      bi.categoryId === category.id && bi.month === month
    )
    
    const spent = transactions
      .filter((txn: any) => 
        txn.categoryId === category.id && 
        txn.budgetMonth === month &&
        txn.type === 'outflow'
      )
      .reduce((sum: number, txn: any) => sum + Math.abs(txn.amount), 0)
    
    return {
      month,
      assigned: budgetItem?.assigned || 0,
      spent
    }
  })
  
  // Calculate WMA(3) - more weight to recent months
  const weights = [0.2, 0.3, 0.5] // Last month gets highest weight
  let wmaAssigned = 0
  let wmaSpent = 0
  
  historicalData.forEach((data, index) => {
    wmaAssigned += data.assigned * weights[index]
    wmaSpent += data.spent * weights[index]
  })
  
  // Use the higher of assigned or spent for conservative forecasting
  let baseline = Math.max(wmaAssigned, wmaSpent)
  
  // Apply seasonality factor if enabled
  if (options.seasonalityFactor) {
    const seasonalMultiplier = getSeasonalityMultiplier(category, targetMonth)
    baseline *= seasonalMultiplier
  }
  
  // Apply confidence threshold adjustment
  const confidenceMultiplier = getConfidenceMultiplier(options.confidenceThreshold)
  baseline *= confidenceMultiplier
  
  return Math.round(baseline * 100) / 100 // Round to cents
}

/**
 * Get seasonality multiplier for category/month combination
 */
function getSeasonalityMultiplier(category: any, month: string): number {
  const monthNum = parseInt(month.split('-')[1])
  const categoryName = category.name.toLowerCase()
  
  // Simple seasonality rules
  if (categoryName.includes('utilities') || categoryName.includes('heating')) {
    // Higher in winter months
    return [12, 1, 2].includes(monthNum) ? 1.3 : 
           [6, 7, 8].includes(monthNum) ? 0.8 : 1.0
  }
  
  if (categoryName.includes('gift') || categoryName.includes('holiday')) {
    // Higher in November/December
    return [11, 12].includes(monthNum) ? 2.0 : 0.3
  }
  
  if (categoryName.includes('vacation') || categoryName.includes('travel')) {
    // Higher in summer months
    return [6, 7, 8].includes(monthNum) ? 1.5 : 0.8
  }
  
  return 1.0 // No seasonality adjustment
}

/**
 * Get confidence multiplier based on threshold
 */
function getConfidenceMultiplier(threshold: 'conservative' | 'moderate' | 'optimistic'): number {
  switch (threshold) {
    case 'conservative': return 1.1 // 10% buffer
    case 'moderate': return 1.0 // No adjustment
    case 'optimistic': return 0.9 // 10% reduction
    default: return 1.0
  }
}

/**
 * Determine confidence level for category prediction
 */
function determineConfidence(
  userData: any,
  category: any,
  month: string
): 'high' | 'medium' | 'low' {
  const budgetItems = userData.budget_items || []
  const transactions = userData.transactions_v2 || []
  
  // Count months with data
  const monthsWithData = budgetItems.filter((bi: any) => 
    bi.categoryId === category.id && bi.assigned > 0
  ).length
  
  // Count transactions
  const transactionCount = transactions.filter((txn: any) => 
    txn.categoryId === category.id
  ).length
  
  if (monthsWithData >= 3 && transactionCount >= 5) return 'high'
  if (monthsWithData >= 2 && transactionCount >= 2) return 'medium'
  return 'low'
}

/**
 * Calculate monthly income from recurring sources
 */
function calculateMonthlyIncome(
  recurringIncome: any[],
  oneOffIncome: any[],
  targetMonth: string
): number {
  let total = 0
  
  // Add recurring income
  recurringIncome.forEach(income => {
    if (!income.active) return
    
    const monthlyAmount = convertToMonthlyAmount(income.amountCents, income.schedule)
    total += monthlyAmount
  })
  
  // Add one-off income for the target month
  oneOffIncome.forEach(income => {
    const incomeDate = new Date(income.date)
    const incomeMonth = `${incomeDate.getFullYear()}-${String(incomeDate.getMonth() + 1).padStart(2, '0')}`
    
    if (incomeMonth === targetMonth) {
      total += income.amountCents
    }
  })
  
  return total / 100 // Convert cents to dollars
}

/**
 * Convert recurring income to monthly equivalent
 */
function convertToMonthlyAmount(amountCents: number, schedule: string): number {
  switch (schedule.toUpperCase()) {
    case 'WEEKLY':
      return amountCents * 4.33 // Average weeks per month
    case 'BIWEEKLY':
      return amountCents * 2.17 // Average bi-weekly periods per month
    case 'SEMIMONTHLY':
      return amountCents * 2
    case 'MONTHLY':
      return amountCents
    case 'IRREGULAR':
      return amountCents // Assume already monthly equivalent
    default:
      return amountCents
  }
}

/**
 * Apply overrides to forecast
 */
export function applyOverrides(
  forecast: ForecastMonth[],
  overrides: ForecastOverride[]
): ForecastMonth[] {
  return forecast.map(month => {
    const monthOverrides = overrides.filter(o => o.month === month.month)
    
    if (monthOverrides.length === 0) return month
    
    // Apply income overrides
    const incomeOverride = monthOverrides.find(o => o.categoryId === null)
    const adjustedIncome = month.income + (incomeOverride?.deltaAmount || 0)
    
    // Apply category overrides
    const adjustedCategories = month.categories.map(cat => {
      const categoryOverride = monthOverrides.find(o => o.categoryId === cat.categoryId)
      if (!categoryOverride) return cat
      
      return {
        ...cat,
        override: categoryOverride.deltaAmount,
        final: cat.baseline + categoryOverride.deltaAmount
      }
    })
    
    const newTotalAssigned = adjustedCategories.reduce((sum, cat) => sum + cat.final, 0)
    const newRTA = adjustedIncome - newTotalAssigned
    
    return {
      ...month,
      income: adjustedIncome,
      rta: newRTA,
      categories: adjustedCategories,
      totalAssigned: newTotalAssigned,
      netCashFlow: adjustedIncome - month.totalSpent
    }
  })
}

/**
 * Group categories by group for display
 */
export function groupForecastByCategory(forecast: ForecastMonth[]): Record<string, ForecastCategory[]> {
  const grouped: Record<string, ForecastCategory[]> = {}
  
  if (forecast.length === 0) return grouped
  
  forecast[0].categories.forEach(cat => {
    if (!grouped[cat.groupName]) {
      grouped[cat.groupName] = []
    }
  })
  
  forecast.forEach(month => {
    month.categories.forEach(cat => {
      const existingCat = grouped[cat.groupName].find(c => c.categoryId === cat.categoryId)
      if (!existingCat) {
        grouped[cat.groupName].push(cat)
      }
    })
  })
  
  return grouped
}
