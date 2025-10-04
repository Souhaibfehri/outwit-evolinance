// Income data model with scheduling, deductions, and budget integration

export type IncomeType = 'EMPLOYMENT' | 'FREELANCE' | 'BENEFIT' | 'OTHER'
export type PaySchedule = 'MONTHLY' | 'SEMI_MONTHLY' | 'BIWEEKLY' | 'WEEKLY' | 'CUSTOM'
export type IncomeStatus = 'SCHEDULED' | 'RECEIVED' | 'SKIPPED'
export type DeductionKind = 'PERCENT' | 'FIXED'

export interface IncomeSource {
  id: string
  userId: string
  name: string
  type: IncomeType
  currency: string // ISO-4217
  gross?: number // Optional for W2-style
  net?: number // For fixed-net sources
  paySchedule: PaySchedule
  anchorDate: string // First paycheck anchor (ISO date)
  dayOfMonth?: number // For monthly/semi-monthly
  secondDay?: number // For semi-monthly second paycheck
  weekday?: number // For weekly/biweekly (0-6, 0=Sunday)
  everyNWeeks?: number // For CUSTOM weekly cadence
  endOn?: string // ISO date
  timezone: string
  autopost: boolean // Auto-create expected entries
  allocationTemplateId?: string // Auto-assign template
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface IncomeOccurrence {
  id: string
  sourceId: string
  userId: string
  scheduledAt: string // ISO datetime in user TZ
  postedAt?: string // When actually received
  gross?: number
  net: number
  currency: string
  status: IncomeStatus
  txId?: string // Linked Transaction ID
  budgetMonth: string // YYYY-MM format
  createdAt: string
}

export interface IncomeDeduction {
  id: string
  sourceId: string
  label: string // Tax, Insurance, 401k, etc.
  kind: DeductionKind
  value: number
}

export interface AllocationTemplate {
  id: string
  userId: string
  name: string
  weights: Record<string, number> // categoryId -> percentage (0-1)
  createdAt: string
}

// UI/API interfaces
export interface CreateIncomeSourceRequest {
  name: string
  type: IncomeType
  currency?: string
  gross?: number
  net?: number
  paySchedule: PaySchedule
  anchorDate: string
  dayOfMonth?: number
  secondDay?: number
  weekday?: number
  everyNWeeks?: number
  endOn?: string
  timezone?: string
  autopost?: boolean
  allocationTemplateId?: string
  notes?: string
  deductions?: Omit<IncomeDeduction, 'id' | 'sourceId'>[]
}

export interface UpdateIncomeSourceRequest {
  name?: string
  type?: IncomeType
  gross?: number
  net?: number
  paySchedule?: PaySchedule
  anchorDate?: string
  dayOfMonth?: number
  secondDay?: number
  weekday?: number
  everyNWeeks?: number
  endOn?: string
  autopost?: boolean
  allocationTemplateId?: string
  notes?: string
  deductions?: Omit<IncomeDeduction, 'id' | 'sourceId'>[]
}

export interface ReceiveIncomeRequest {
  occurrenceId: string
  date?: string
  accountId: string
  amount?: number
  budgetMonth?: 'current' | 'next'
  note?: string
}

export interface RecordOneOffIncomeRequest {
  amount: number
  date: string
  accountId: string
  category?: string
  budgetMonth: 'current' | 'next'
  note?: string
}

export interface QuickCatchUpRequest {
  sourceId: string
  totalAmount: number
  startDate: string
  endDate: string
  accountId: string
  budgetMonth: 'current' | 'next'
}

export interface AssignTemplateRequest {
  templateId: string
  amount: number
  budgetMonth: string
}

// Computed interfaces
export interface IncomeSourceWithOccurrences extends IncomeSource {
  deductions: IncomeDeduction[]
  upcomingOccurrences: IncomeOccurrence[]
  recentOccurrences: IncomeOccurrence[]
  calculatedNet?: number
  nextPayDate?: string
  nextPayAmount?: number
  averageMonthly?: number // For variable income
  isVariable?: boolean
}

export interface IncomeKPIs {
  nextPay?: {
    date: string
    amount: number
    sourceName: string
  }
  thisMonthReceived: number
  thisMonthScheduled: number
  variance: number // vs average
  averageMonthly: number
  ytdReceived: number
  upcomingCount: number
}

// Helper functions
export function calculateNetIncome(gross: number, deductions: IncomeDeduction[]): number {
  let net = gross
  
  for (const deduction of deductions) {
    if (deduction.kind === 'PERCENT') {
      net -= gross * (deduction.value / 100)
    } else {
      net -= deduction.value
    }
  }
  
  return Math.max(0, net)
}

export function getIncomeTypeLabel(type: IncomeType): string {
  switch (type) {
    case 'EMPLOYMENT': return 'Employment'
    case 'FREELANCE': return 'Freelance'
    case 'BENEFIT': return 'Benefit/Pension'
    case 'OTHER': return 'Other'
    default: return type
  }
}

export function getPayScheduleLabel(schedule: PaySchedule): string {
  switch (schedule) {
    case 'MONTHLY': return 'Monthly'
    case 'SEMI_MONTHLY': return 'Semi-Monthly (2x/month)'
    case 'BIWEEKLY': return 'Bi-Weekly (every 2 weeks)'
    case 'WEEKLY': return 'Weekly'
    case 'CUSTOM': return 'Custom'
    default: return schedule
  }
}

export function getStatusColor(status: IncomeStatus): string {
  switch (status) {
    case 'RECEIVED': return 'text-green-600 bg-green-100 border-green-200'
    case 'SCHEDULED': return 'text-blue-600 bg-blue-100 border-blue-200'
    case 'SKIPPED': return 'text-gray-600 bg-gray-100 border-gray-200'
    default: return 'text-gray-600 bg-gray-100 border-gray-200'
  }
}

export function shouldPromptNextMonth(date: Date, eomThresholdDays: number = 3): boolean {
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const daysUntilEOM = lastDayOfMonth - date.getDate()
  return daysUntilEOM <= eomThresholdDays
}

export function getBudgetMonth(date: Date, assignToNext: boolean = false): string {
  const targetDate = assignToNext 
    ? new Date(date.getFullYear(), date.getMonth() + 1, 1)
    : new Date(date.getFullYear(), date.getMonth(), 1)
  
  return targetDate.toISOString().substring(0, 7) // YYYY-MM
}

export function calculateVariableIncomeAverage(
  occurrences: IncomeOccurrence[], 
  months: number = 3
): { average: number; isVariable: boolean } {
  const cutoffDate = new Date()
  cutoffDate.setMonth(cutoffDate.getMonth() - months)
  
  const recentOccurrences = occurrences
    .filter(occ => occ.status === 'RECEIVED')
    .filter(occ => new Date(occ.postedAt || occ.scheduledAt) >= cutoffDate)
    .sort((a, b) => new Date(b.postedAt || b.scheduledAt).getTime() - new Date(a.postedAt || a.scheduledAt).getTime())
  
  if (recentOccurrences.length === 0) {
    return { average: 0, isVariable: false }
  }
  
  const amounts = recentOccurrences.map(occ => occ.net)
  const average = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length
  
  // Calculate coefficient of variation to determine if income is variable
  const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - average, 2), 0) / amounts.length
  const stdDev = Math.sqrt(variance)
  const coefficientOfVariation = average > 0 ? stdDev / average : 0
  
  // Consider variable if CV > 0.15 (15%)
  const isVariable = coefficientOfVariation > 0.15
  
  return { average, isVariable }
}

export function generateUpcomingOccurrences(
  source: IncomeSource,
  deductions: IncomeDeduction[],
  daysAhead: number = 90
): IncomeOccurrence[] {
  const occurrences: IncomeOccurrence[] = []
  const startDate = new Date()
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + daysAhead)
  
  const anchorDate = new Date(source.anchorDate)
  let currentDate = new Date(anchorDate)
  
  // Move to first future occurrence
  while (currentDate < startDate) {
    currentDate = getNextPayDate(currentDate, source)
  }
  
  let occurrenceCount = 0
  const maxOccurrences = 50 // Safety limit
  
  while (currentDate <= endDate && occurrenceCount < maxOccurrences) {
    if (source.endOn && currentDate > new Date(source.endOn)) {
      break
    }
    
    const net = source.net || (source.gross ? calculateNetIncome(source.gross, deductions) : 0)
    const budgetMonth = getBudgetMonth(currentDate, shouldPromptNextMonth(currentDate))
    
    occurrences.push({
      id: `occ_${source.id}_${currentDate.getTime()}`,
      sourceId: source.id,
      userId: source.userId,
      scheduledAt: currentDate.toISOString(),
      gross: source.gross,
      net,
      currency: source.currency,
      status: 'SCHEDULED',
      budgetMonth,
      createdAt: new Date().toISOString()
    })
    
    currentDate = getNextPayDate(currentDate, source)
    occurrenceCount++
  }
  
  return occurrences
}

function getNextPayDate(currentDate: Date, source: IncomeSource): Date {
  const next = new Date(currentDate)
  
  switch (source.paySchedule) {
    case 'MONTHLY':
      if (source.dayOfMonth) {
        next.setMonth(next.getMonth() + 1)
        next.setDate(Math.min(source.dayOfMonth, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()))
      } else {
        next.setMonth(next.getMonth() + 1)
      }
      break
      
    case 'SEMI_MONTHLY':
      if (source.dayOfMonth && source.secondDay) {
        const currentDay = next.getDate()
        if (currentDay < source.dayOfMonth) {
          next.setDate(source.dayOfMonth)
        } else if (currentDay < source.secondDay) {
          next.setDate(source.secondDay)
        } else {
          next.setMonth(next.getMonth() + 1)
          next.setDate(source.dayOfMonth)
        }
      }
      break
      
    case 'BIWEEKLY':
      next.setDate(next.getDate() + 14)
      break
      
    case 'WEEKLY':
      next.setDate(next.getDate() + 7)
      break
      
    case 'CUSTOM':
      if (source.everyNWeeks) {
        next.setDate(next.getDate() + (source.everyNWeeks * 7))
      }
      break
  }
  
  return next
}

export function getAnnualFrequency(schedule: PaySchedule, everyNWeeks?: number): number {
  switch (schedule) {
    case 'MONTHLY': return 12
    case 'SEMI_MONTHLY': return 24
    case 'BIWEEKLY': return 26
    case 'WEEKLY': return 52
    case 'CUSTOM': return everyNWeeks ? Math.floor(52 / everyNWeeks) : 26
    default: return 12
  }
}
