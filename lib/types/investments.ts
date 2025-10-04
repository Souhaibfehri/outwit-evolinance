// Investment data model with accounts, plans, contributions, and projections

export type InvestType = 'BROKERAGE' | 'RETIREMENT' | 'SAVINGS' | 'CRYPTO' | 'OTHER'
export type InvestSource = 'RTA' | 'TRANSFER' | 'ONE_OFF'
export type PaySchedule = 'MONTHLY' | 'SEMI_MONTHLY' | 'BIWEEKLY' | 'WEEKLY' | 'CUSTOM'

export interface InvestmentAccount {
  id: string
  userId: string
  name: string
  type: InvestType
  currency: string
  trackHoldings: boolean // If true, store value snapshots
  currentValue?: number // Latest value from snapshots
  createdAt: string
  updatedAt: string
}

export interface InvestmentPlan {
  id: string
  userId: string
  accountId: string
  name: string
  amount: number
  currency: string
  cadence: PaySchedule
  anchorDate: string // ISO date
  dayOfMonth?: number
  weekday?: number // 0-6 for weekly/biweekly
  everyNWeeks?: number // For custom cadence
  aprAssumption?: number // For projections (e.g., 7%)
  autopay: boolean // Auto-post contributions
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface InvestmentContribution {
  id: string
  planId?: string // Optional, for recurring contributions
  accountId: string
  userId: string
  date: string // ISO date
  amount: number
  currency: string
  source: InvestSource
  txId?: string // Linked Transaction ID
  transactionId?: string // Alternative name for transaction link
  budgetMonth: string // YYYY-MM format
  note?: string
  createdAt: string
}

export interface HoldingSnapshot {
  id: string
  accountId: string
  userId: string
  asOf: string // ISO date
  value: number
  currency: string
  createdAt: string
}

// UI/API interfaces
export interface CreateInvestmentAccountRequest {
  name: string
  type: InvestType
  currency?: string
  trackHoldings?: boolean
  currentValue?: number
}

export interface UpdateInvestmentAccountRequest {
  name?: string
  type?: InvestType
  trackHoldings?: boolean
  currentValue?: number
}

export interface CreateInvestmentPlanRequest {
  accountId: string
  name: string
  amount: number
  currency?: string
  cadence: PaySchedule
  anchorDate: string
  dayOfMonth?: number
  weekday?: number
  everyNWeeks?: number
  aprAssumption?: number
  autopay?: boolean
}

export interface UpdateInvestmentPlanRequest {
  name?: string
  amount?: number
  cadence?: PaySchedule
  anchorDate?: string
  dayOfMonth?: number
  weekday?: number
  everyNWeeks?: number
  aprAssumption?: number
  autopay?: boolean
  active?: boolean
}

export interface ContributeToInvestmentRequest {
  accountId: string
  amount: number
  date?: string
  source: InvestSource
  accountSourceId?: string // For transfers
  budgetMonth?: 'current' | 'next'
  note?: string
}

export interface RecordValueSnapshotRequest {
  accountId: string
  value: number
  asOf?: string
  currency?: string
}

// Computed interfaces
export interface InvestmentAccountWithDetails extends InvestmentAccount {
  plans: InvestmentPlan[]
  contributions: InvestmentContribution[]
  snapshots: HoldingSnapshot[]
  totalContributed: number
  monthlyContributions: number
  ytdContributions: number
  projectedValue?: ProjectionResult
}

export interface InvestmentKPIs {
  totalAccounts: number
  contributedThisMonth: number
  ytdContributions: number
  totalContributed: number
  totalCurrentValue: number
  projectedFiveYear: number
  averageAPR: number
}

export interface ProjectionResult {
  futureValue: number
  totalContributions: number
  totalGrowth: number
  years: number
  monthlyContribution: number
  aprAssumption: number
  compoundingPeriods: number
}

export interface SIPCalculation {
  monthlyContribution: number
  aprAssumption: number
  years: number
  compoundingFrequency: number // 12 for monthly
  futureValue: number
  totalContributions: number
  totalGrowth: number
  yearlyBreakdown: Array<{
    year: number
    endingBalance: number
    yearlyContributions: number
    yearlyGrowth: number
  }>
}

// Helper functions
export function getInvestmentTypeLabel(type: InvestType): string {
  switch (type) {
    case 'BROKERAGE': return 'Brokerage Account'
    case 'RETIREMENT': return 'Retirement (401k/IRA)'
    case 'SAVINGS': return 'High-Yield Savings'
    case 'CRYPTO': return 'Cryptocurrency'
    case 'OTHER': return 'Other Investment'
    default: return type
  }
}

export function getInvestmentTypeIcon(type: InvestType): string {
  switch (type) {
    case 'BROKERAGE': return '📈'
    case 'RETIREMENT': return '🏦'
    case 'SAVINGS': return '💰'
    case 'CRYPTO': return '₿'
    case 'OTHER': return '💎'
    default: return '💼'
  }
}

export function getInvestSourceLabel(source: InvestSource): string {
  switch (source) {
    case 'RTA': return 'Ready-to-Assign'
    case 'TRANSFER': return 'Account Transfer'
    case 'ONE_OFF': return 'One-off Income'
    default: return source
  }
}

/**
 * Calculate SIP (Systematic Investment Plan) future value
 * Uses compound interest formula for regular contributions
 */
export function calculateSIP(
  monthlyContribution: number,
  aprAssumption: number,
  years: number,
  compoundingFrequency: number = 12
): SIPCalculation {
  if (monthlyContribution <= 0 || years <= 0) {
    return {
      monthlyContribution: 0,
      aprAssumption,
      years,
      compoundingFrequency,
      futureValue: 0,
      totalContributions: 0,
      totalGrowth: 0,
      yearlyBreakdown: []
    }
  }

  const monthlyRate = aprAssumption / 100 / 12
  const totalMonths = years * 12
  const yearlyBreakdown: SIPCalculation['yearlyBreakdown'] = []

  let currentBalance = 0
  let totalContributions = 0

  // Calculate year by year for breakdown
  for (let year = 1; year <= years; year++) {
    let yearlyContributions = 0
    let startingBalance = currentBalance

    // Calculate monthly contributions and growth for this year
    for (let month = 1; month <= 12; month++) {
      // Add monthly contribution
      currentBalance += monthlyContribution
      yearlyContributions += monthlyContribution
      totalContributions += monthlyContribution

      // Apply monthly compound growth
      if (monthlyRate > 0) {
        currentBalance *= (1 + monthlyRate)
      }
    }

    const yearlyGrowth = currentBalance - startingBalance - yearlyContributions

    yearlyBreakdown.push({
      year,
      endingBalance: currentBalance,
      yearlyContributions,
      yearlyGrowth
    })
  }

  const futureValue = currentBalance
  const totalGrowth = futureValue - totalContributions

  return {
    monthlyContribution,
    aprAssumption,
    years,
    compoundingFrequency,
    futureValue,
    totalContributions,
    totalGrowth,
    yearlyBreakdown
  }
}

/**
 * Calculate how adding extra monthly amount affects time to reach target
 */
export function calculateTargetDelta(
  currentMonthly: number,
  extraMonthly: number,
  targetValue: number,
  aprAssumption: number
): {
  currentYears: number
  newYears: number
  yearsSaved: number
  monthsSaved: number
} {
  if (targetValue <= 0 || aprAssumption < 0) {
    return { currentYears: 0, newYears: 0, yearsSaved: 0, monthsSaved: 0 }
  }

  const monthlyRate = aprAssumption / 100 / 12

  // Calculate years to reach target with current contribution
  const currentYears = calculateYearsToTarget(currentMonthly, targetValue, monthlyRate)
  
  // Calculate years to reach target with extra contribution
  const newMonthly = currentMonthly + extraMonthly
  const newYears = calculateYearsToTarget(newMonthly, targetValue, monthlyRate)
  
  const yearsSaved = Math.max(0, currentYears - newYears)
  const monthsSaved = Math.round(yearsSaved * 12)

  return {
    currentYears: Math.round(currentYears * 100) / 100,
    newYears: Math.round(newYears * 100) / 100,
    yearsSaved: Math.round(yearsSaved * 100) / 100,
    monthsSaved
  }
}

function calculateYearsToTarget(monthlyContribution: number, targetValue: number, monthlyRate: number): number {
  if (monthlyContribution <= 0) return Infinity
  if (monthlyRate <= 0) return targetValue / (monthlyContribution * 12)

  // Formula: n = log(1 + (FV * r) / PMT) / log(1 + r)
  // Where FV = future value, PMT = monthly payment, r = monthly rate
  const numerator = Math.log(1 + (targetValue * monthlyRate) / monthlyContribution)
  const denominator = Math.log(1 + monthlyRate)
  
  return numerator / denominator / 12 // Convert months to years
}

/**
 * Generate upcoming investment plan occurrences
 */
export function generateUpcomingContributions(
  plan: InvestmentPlan,
  daysAhead: number = 90
): Array<{
  date: string
  amount: number
  planName: string
}> {
  if (!plan.active) return []

  const contributions: Array<{ date: string; amount: number; planName: string }> = []
  const startDate = new Date()
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + daysAhead)
  
  const anchorDate = new Date(plan.anchorDate)
  let currentDate = new Date(anchorDate)
  
  // Move to first future occurrence
  while (currentDate < startDate) {
    currentDate = getNextContributionDate(currentDate, plan)
  }
  
  let occurrenceCount = 0
  const maxOccurrences = 20 // Safety limit
  
  while (currentDate <= endDate && occurrenceCount < maxOccurrences) {
    contributions.push({
      date: currentDate.toISOString().split('T')[0],
      amount: plan.amount,
      planName: plan.name
    })
    
    currentDate = getNextContributionDate(currentDate, plan)
    occurrenceCount++
  }
  
  return contributions
}

function getNextContributionDate(currentDate: Date, plan: InvestmentPlan): Date {
  const next = new Date(currentDate)
  
  switch (plan.cadence) {
    case 'MONTHLY':
      if (plan.dayOfMonth) {
        next.setMonth(next.getMonth() + 1)
        next.setDate(Math.min(plan.dayOfMonth, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()))
      } else {
        next.setMonth(next.getMonth() + 1)
      }
      break
      
    case 'BIWEEKLY':
      next.setDate(next.getDate() + 14)
      break
      
    case 'WEEKLY':
      next.setDate(next.getDate() + 7)
      break
      
    case 'CUSTOM':
      if (plan.everyNWeeks) {
        next.setDate(next.getDate() + (plan.everyNWeeks * 7))
      }
      break
  }
  
  return next
}

/**
 * Calculate investment performance metrics
 */
export function calculateInvestmentMetrics(
  contributions: InvestmentContribution[],
  snapshots: HoldingSnapshot[]
): {
  totalContributed: number
  currentValue: number
  totalReturn: number
  returnPercentage: number
  monthlyAverage: number
  ytdContributions: number
} {
  const totalContributed = contributions.reduce((sum, contrib) => sum + contrib.amount, 0)
  
  // Get latest snapshot value
  const sortedSnapshots = snapshots.sort((a, b) => new Date(b.asOf).getTime() - new Date(a.asOf).getTime())
  const currentValue = sortedSnapshots[0]?.value || totalContributed
  
  const totalReturn = currentValue - totalContributed
  const returnPercentage = totalContributed > 0 ? (totalReturn / totalContributed) * 100 : 0
  
  // Calculate monthly average
  const monthsOfData = Math.max(1, contributions.length > 0 ? 
    Math.ceil((Date.now() - new Date(contributions[0].date).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 1)
  const monthlyAverage = totalContributed / monthsOfData
  
  // YTD contributions
  const currentYear = new Date().getFullYear()
  const ytdContributions = contributions
    .filter(contrib => new Date(contrib.date).getFullYear() === currentYear)
    .reduce((sum, contrib) => sum + contrib.amount, 0)

  return {
    totalContributed,
    currentValue,
    totalReturn,
    returnPercentage,
    monthlyAverage,
    ytdContributions
  }
}
