// Smart Auto-Assign Engine
// Deterministic logic for suggesting budget allocations

import { TargetCalculation, getTargetPriority } from '@/lib/targets/engine'

export interface AllocationSuggestion {
  categoryId: string
  categoryName: string
  currentAssigned: number
  suggestedAmount: number
  reason: string
  priority: number
  confidence: 'high' | 'medium' | 'low'
  isLocked?: boolean
}

export interface AutoAssignResult {
  suggestions: AllocationSuggestion[]
  totalSuggested: number
  remainingRTA: number
  strategy: string
  confidence: number
}

export interface AllocationLog {
  id: string
  userId: string
  month: string
  timestamp: string
  action: 'approve' | 'approve_lock' | 'reject' | 'undo'
  suggestions: AllocationSuggestion[]
  totalAmount: number
  strategy: string
}

export interface SpendingTrend {
  categoryId: string
  last30DayAverage: number
  last90DayAverage: number
  trend: 'increasing' | 'decreasing' | 'stable'
  volatility: 'low' | 'medium' | 'high'
}

/**
 * Generate smart allocation suggestions based on targets, due dates, and spending trends
 */
export function generateAllocationSuggestions(
  availableRTA: number,
  targetCalculations: TargetCalculation[],
  spendingTrends: SpendingTrend[],
  budgetItems: any[],
  bills: any[] = [],
  lockedCategories: string[] = [],
  month: string
): AutoAssignResult {
  if (availableRTA <= 0) {
    return {
      suggestions: [],
      totalSuggested: 0,
      remainingRTA: availableRTA,
      strategy: 'insufficient_funds',
      confidence: 0
    }
  }

  // Filter out locked categories and snoozed targets
  const eligibleTargets = targetCalculations.filter(calc => 
    !lockedCategories.includes(calc.categoryId) && 
    !calc.isSnoozed &&
    calc.isUnderfunded
  )

  if (eligibleTargets.length === 0) {
    return {
      suggestions: [],
      totalSuggested: 0,
      remainingRTA: availableRTA,
      strategy: 'no_eligible_targets',
      confidence: 0
    }
  }

  // Calculate suggestions using multiple strategies
  const strategies = [
    () => priorityBasedAllocation(availableRTA, eligibleTargets, bills),
    () => urgencyBasedAllocation(availableRTA, eligibleTargets, bills),
    () => trendBasedAllocation(availableRTA, eligibleTargets, spendingTrends),
    () => balancedAllocation(availableRTA, eligibleTargets, spendingTrends, bills)
  ]

  // Try each strategy and pick the best one
  let bestResult: AutoAssignResult | null = null
  let bestScore = 0

  for (const strategy of strategies) {
    const result = strategy()
    const score = calculateStrategyScore(result, targetCalculations)
    
    if (score > bestScore) {
      bestScore = score
      bestResult = result
    }
  }

  return bestResult || {
    suggestions: [],
    totalSuggested: 0,
    remainingRTA: availableRTA,
    strategy: 'no_viable_strategy',
    confidence: 0
  }
}

/**
 * Priority-based allocation: Fund highest priority targets first
 */
function priorityBasedAllocation(
  availableRTA: number,
  targets: TargetCalculation[],
  bills: any[]
): AutoAssignResult {
  const suggestions: AllocationSuggestion[] = []
  let remainingRTA = availableRTA

  // Sort by priority (higher = more important)
  const sortedTargets = [...targets].sort((a, b) => {
    const priorityA = getTargetPriority(a)
    const priorityB = getTargetPriority(b)
    return priorityB - priorityA
  })

  for (const target of sortedTargets) {
    if (remainingRTA <= 0) break

    const neededAmount = Math.min(target.needed, remainingRTA)
    if (neededAmount > 0) {
      suggestions.push({
        categoryId: target.categoryId,
        categoryName: target.categoryName,
        currentAssigned: target.currentBalance + target.needed - neededAmount,
        suggestedAmount: neededAmount,
        reason: getPriorityReason(target),
        priority: getTargetPriority(target),
        confidence: 'high'
      })
      remainingRTA -= neededAmount
    }
  }

  const totalSuggested = suggestions.reduce((sum, s) => sum + s.suggestedAmount, 0)

  return {
    suggestions,
    totalSuggested,
    remainingRTA,
    strategy: 'priority_based',
    confidence: calculateConfidence(suggestions, targets)
  }
}

/**
 * Urgency-based allocation: Fund items due soon first
 */
function urgencyBasedAllocation(
  availableRTA: number,
  targets: TargetCalculation[],
  bills: any[]
): AutoAssignResult {
  const suggestions: AllocationSuggestion[] = []
  let remainingRTA = availableRTA

  // Sort by urgency (days until due)
  const sortedTargets = [...targets].sort((a, b) => {
    const urgencyA = a.daysUntilDue || 999
    const urgencyB = b.daysUntilDue || 999
    return urgencyA - urgencyB
  })

  for (const target of sortedTargets) {
    if (remainingRTA <= 0) break

    const neededAmount = Math.min(target.needed, remainingRTA)
    if (neededAmount > 0) {
      suggestions.push({
        categoryId: target.categoryId,
        categoryName: target.categoryName,
        currentAssigned: target.currentBalance + target.needed - neededAmount,
        suggestedAmount: neededAmount,
        reason: getUrgencyReason(target),
        priority: target.daysUntilDue ? Math.max(1, 100 - target.daysUntilDue) : 50,
        confidence: target.daysUntilDue ? 'high' : 'medium'
      })
      remainingRTA -= neededAmount
    }
  }

  const totalSuggested = suggestions.reduce((sum, s) => sum + s.suggestedAmount, 0)

  return {
    suggestions,
    totalSuggested,
    remainingRTA,
    strategy: 'urgency_based',
    confidence: calculateConfidence(suggestions, targets)
  }
}

/**
 * Trend-based allocation: Consider spending patterns
 */
function trendBasedAllocation(
  availableRTA: number,
  targets: TargetCalculation[],
  spendingTrends: SpendingTrend[]
): AutoAssignResult {
  const suggestions: AllocationSuggestion[] = []
  let remainingRTA = availableRTA

  // Sort by spending trend urgency
  const sortedTargets = [...targets].sort((a, b) => {
    const trendA = spendingTrends.find(t => t.categoryId === a.categoryId)
    const trendB = spendingTrends.find(t => t.categoryId === b.categoryId)
    
    const scoreA = getTrendScore(trendA)
    const scoreB = getTrendScore(trendB)
    
    return scoreB - scoreA
  })

  for (const target of sortedTargets) {
    if (remainingRTA <= 0) break

    const trend = spendingTrends.find(t => t.categoryId === target.categoryId)
    const neededAmount = Math.min(target.needed, remainingRTA)
    
    if (neededAmount > 0) {
      suggestions.push({
        categoryId: target.categoryId,
        categoryName: target.categoryName,
        currentAssigned: target.currentBalance + target.needed - neededAmount,
        suggestedAmount: neededAmount,
        reason: getTrendReason(trend),
        priority: getTrendScore(trend),
        confidence: trend ? 'medium' : 'low'
      })
      remainingRTA -= neededAmount
    }
  }

  const totalSuggested = suggestions.reduce((sum, s) => sum + s.suggestedAmount, 0)

  return {
    suggestions,
    totalSuggested,
    remainingRTA,
    strategy: 'trend_based',
    confidence: calculateConfidence(suggestions, targets)
  }
}

/**
 * Balanced allocation: Distribute proportionally
 */
function balancedAllocation(
  availableRTA: number,
  targets: TargetCalculation[],
  spendingTrends: SpendingTrend[],
  bills: any[]
): AutoAssignResult {
  const suggestions: AllocationSuggestion[] = []
  
  const totalNeeded = targets.reduce((sum, t) => sum + t.needed, 0)
  
  if (totalNeeded === 0) {
    return {
      suggestions: [],
      totalSuggested: 0,
      remainingRTA: availableRTA,
      strategy: 'balanced',
      confidence: 0
    }
  }

  let remainingRTA = availableRTA
  let totalSuggested = 0

  for (const target of targets) {
    if (remainingRTA <= 0) break

    // Proportional allocation based on need
    const proportion = target.needed / totalNeeded
    const suggestedAmount = Math.min(
      Math.round(availableRTA * proportion),
      target.needed,
      remainingRTA
    )

    if (suggestedAmount > 0) {
      suggestions.push({
        categoryId: target.categoryId,
        categoryName: target.categoryName,
        currentAssigned: target.currentBalance + target.needed - suggestedAmount,
        suggestedAmount,
        reason: `Proportional allocation (${(proportion * 100).toFixed(1)}% of need)`,
        priority: 50,
        confidence: 'medium'
      })
      remainingRTA -= suggestedAmount
      totalSuggested += suggestedAmount
    }
  }

  return {
    suggestions,
    totalSuggested,
    remainingRTA,
    strategy: 'balanced',
    confidence: calculateConfidence(suggestions, targets)
  }
}

/**
 * Calculate spending trends from transaction history
 */
export function calculateSpendingTrends(
  transactions: any[],
  categoryIds: string[]
): SpendingTrend[] {
  const trends: SpendingTrend[] = []
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  for (const categoryId of categoryIds) {
    const categoryTransactions = transactions.filter(t => 
      t.categoryId === categoryId && t.type === 'outflow'
    )

    const last30Days = categoryTransactions.filter(t => 
      new Date(t.date) >= thirtyDaysAgo
    )
    const last90Days = categoryTransactions.filter(t => 
      new Date(t.date) >= ninetyDaysAgo
    )

    const last30DayTotal = last30Days.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const last90DayTotal = last90Days.reduce((sum, t) => sum + Math.abs(t.amount), 0)

    const last30DayAverage = last30DayTotal / 30
    const last90DayAverage = last90DayTotal / 90

    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
    if (last30DayAverage > last90DayAverage * 1.2) {
      trend = 'increasing'
    } else if (last30DayAverage < last90DayAverage * 0.8) {
      trend = 'decreasing'
    }

    // Calculate volatility
    const amounts = categoryTransactions.slice(-10).map(t => Math.abs(t.amount))
    const volatility = calculateVolatility(amounts)

    trends.push({
      categoryId,
      last30DayAverage,
      last90DayAverage,
      trend,
      volatility
    })
  }

  return trends
}

// Helper functions
function getPriorityReason(target: TargetCalculation): string {
  switch (target.targetType) {
    case 'have_balance_by':
      return target.daysUntilDue 
        ? `Due in ${target.daysUntilDue} days`
        : 'Time-sensitive target'
    case 'set_aside_another':
      return 'Regular savings goal'
    case 'refill_up_to':
      return 'Maintain target balance'
    default:
      return 'High priority target'
  }
}

function getUrgencyReason(target: TargetCalculation): string {
  if (target.daysUntilDue) {
    if (target.daysUntilDue <= 7) return 'Due this week'
    if (target.daysUntilDue <= 30) return 'Due this month'
    if (target.daysUntilDue <= 90) return 'Due in 3 months'
  }
  return 'No specific due date'
}

function getTrendReason(trend?: SpendingTrend): string {
  if (!trend) return 'No spending history'
  
  switch (trend.trend) {
    case 'increasing':
      return 'Spending is increasing'
    case 'decreasing':
      return 'Spending is decreasing'
    default:
      return 'Stable spending pattern'
  }
}

function getTrendScore(trend?: SpendingTrend): number {
  if (!trend) return 25
  
  let score = 50
  
  if (trend.trend === 'increasing') score += 20
  if (trend.volatility === 'high') score += 15
  if (trend.last30DayAverage > trend.last90DayAverage) score += 10
  
  return score
}

function calculateVolatility(amounts: number[]): 'low' | 'medium' | 'high' {
  if (amounts.length < 3) return 'low'
  
  const mean = amounts.reduce((sum, a) => sum + a, 0) / amounts.length
  const variance = amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length
  const stdDev = Math.sqrt(variance)
  const coefficient = mean > 0 ? stdDev / mean : 0
  
  if (coefficient > 0.5) return 'high'
  if (coefficient > 0.25) return 'medium'
  return 'low'
}

function calculateConfidence(suggestions: AllocationSuggestion[], targets: TargetCalculation[]): number {
  if (suggestions.length === 0) return 0
  
  const totalSuggested = suggestions.reduce((sum, s) => sum + s.suggestedAmount, 0)
  const totalNeeded = targets.reduce((sum, t) => sum + t.needed, 0)
  
  const coverageRatio = totalNeeded > 0 ? totalSuggested / totalNeeded : 0
  const avgConfidence = suggestions.reduce((sum, s) => {
    const conf = s.confidence === 'high' ? 1 : s.confidence === 'medium' ? 0.7 : 0.4
    return sum + conf
  }, 0) / suggestions.length
  
  return Math.round((coverageRatio * 0.6 + avgConfidence * 0.4) * 100)
}

function calculateStrategyScore(result: AutoAssignResult, targets: TargetCalculation[]): number {
  const coverageScore = result.totalSuggested / Math.max(1, targets.reduce((sum, t) => sum + t.needed, 0))
  const confidenceScore = result.confidence / 100
  const efficiencyScore = result.suggestions.length / Math.max(1, targets.length)
  
  return (coverageScore * 0.5 + confidenceScore * 0.3 + efficiencyScore * 0.2) * 100
}
