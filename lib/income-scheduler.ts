// Income and investment scheduling system with timezone support

import { IncomeSource, PaySchedule, generateUpcomingOccurrences } from '@/lib/types/income'
import { InvestmentPlan, generateUpcomingContributions } from '@/lib/types/investments'

export interface ScheduledEvent {
  id: string
  type: 'income' | 'investment'
  sourceId: string
  sourceName: string
  date: Date
  amount: number
  status: 'scheduled' | 'processed' | 'skipped'
  metadata?: Record<string, any>
}

/**
 * Generate comprehensive schedule for income and investments
 */
export function generateCombinedSchedule(
  incomeSources: IncomeSource[],
  investmentPlans: InvestmentPlan[],
  daysAhead: number = 90,
  timezone: string = 'UTC'
): ScheduledEvent[] {
  const events: ScheduledEvent[] = []

  // Generate income events
  incomeSources.forEach(source => {
    if (!source.autopost) return

    try {
      const occurrences = generateUpcomingOccurrences(source, [], daysAhead)
      
      occurrences.forEach(occurrence => {
        events.push({
          id: occurrence.id,
          type: 'income',
          sourceId: source.id,
          sourceName: source.name,
          date: new Date(occurrence.scheduledAt),
          amount: occurrence.net,
          status: 'scheduled',
          metadata: {
            currency: source.currency,
            paySchedule: source.paySchedule,
            budgetMonth: occurrence.budgetMonth
          }
        })
      })
    } catch (error) {
      console.error(`Error generating schedule for income source ${source.id}:`, error)
    }
  })

  // Generate investment events
  investmentPlans.forEach(plan => {
    if (!plan.active || !plan.autopay) return

    try {
      const contributions = generateUpcomingContributions(plan, daysAhead)
      
      contributions.forEach(contribution => {
        events.push({
          id: `invest_${plan.id}_${contribution.date}`,
          type: 'investment',
          sourceId: plan.id,
          sourceName: plan.name,
          date: new Date(contribution.date),
          amount: contribution.amount,
          status: 'scheduled',
          metadata: {
            accountId: plan.accountId,
            currency: plan.currency,
            cadence: plan.cadence,
            aprAssumption: plan.aprAssumption
          }
        })
      })
    } catch (error) {
      console.error(`Error generating schedule for investment plan ${plan.id}:`, error)
    }
  })

  // Sort by date
  return events.sort((a, b) => a.date.getTime() - b.date.getTime())
}

/**
 * Calculate next occurrence date for any pay schedule
 */
export function calculateNextOccurrence(
  schedule: PaySchedule,
  anchorDate: Date,
  options: {
    dayOfMonth?: number
    secondDay?: number
    weekday?: number
    everyNWeeks?: number
    timezone?: string
  } = {}
): Date {
  const next = new Date(anchorDate)
  
  switch (schedule) {
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1)
      if (options.dayOfMonth) {
        const lastDayOfMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
        next.setDate(Math.min(options.dayOfMonth, lastDayOfMonth))
      }
      break
      
    case 'SEMI_MONTHLY':
      if (options.dayOfMonth && options.secondDay) {
        const currentDay = next.getDate()
        if (currentDay < options.dayOfMonth) {
          next.setDate(options.dayOfMonth)
        } else if (currentDay < options.secondDay) {
          next.setDate(options.secondDay)
        } else {
          next.setMonth(next.getMonth() + 1)
          next.setDate(options.dayOfMonth)
        }
      } else {
        // Default to 15th and last day
        const currentDay = next.getDate()
        if (currentDay < 15) {
          next.setDate(15)
        } else {
          const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
          if (currentDay < lastDay) {
            next.setDate(lastDay)
          } else {
            next.setMonth(next.getMonth() + 1)
            next.setDate(15)
          }
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
      if (options.everyNWeeks) {
        next.setDate(next.getDate() + (options.everyNWeeks * 7))
      } else {
        next.setDate(next.getDate() + 14) // Default to biweekly
      }
      break
  }
  
  return next
}

/**
 * Generate all occurrences between two dates
 */
export function generateOccurrencesBetween(
  schedule: PaySchedule,
  anchorDate: Date,
  startDate: Date,
  endDate: Date,
  options: {
    dayOfMonth?: number
    secondDay?: number
    weekday?: number
    everyNWeeks?: number
    timezone?: string
  } = {}
): Date[] {
  const occurrences: Date[] = []
  let currentDate = new Date(anchorDate)
  
  // Move to first occurrence on or after start date
  while (currentDate < startDate) {
    currentDate = calculateNextOccurrence(schedule, currentDate, options)
  }
  
  // Generate occurrences until end date
  let iterationCount = 0
  const maxIterations = 1000 // Safety limit
  
  while (currentDate <= endDate && iterationCount < maxIterations) {
    occurrences.push(new Date(currentDate))
    currentDate = calculateNextOccurrence(schedule, currentDate, options)
    iterationCount++
  }
  
  return occurrences
}

/**
 * Validate pay schedule configuration
 */
export function validatePaySchedule(
  schedule: PaySchedule,
  options: {
    dayOfMonth?: number
    secondDay?: number
    weekday?: number
    everyNWeeks?: number
  }
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  switch (schedule) {
    case 'MONTHLY':
      if (options.dayOfMonth && (options.dayOfMonth < 1 || options.dayOfMonth > 31)) {
        errors.push('Day of month must be between 1 and 31')
      }
      break
      
    case 'SEMI_MONTHLY':
      if (options.dayOfMonth && (options.dayOfMonth < 1 || options.dayOfMonth > 31)) {
        errors.push('First day of month must be between 1 and 31')
      }
      if (options.secondDay && (options.secondDay < 1 || options.secondDay > 31)) {
        errors.push('Second day of month must be between 1 and 31')
      }
      if (options.dayOfMonth && options.secondDay && options.dayOfMonth >= options.secondDay) {
        errors.push('Second day must be later than first day')
      }
      break
      
    case 'WEEKLY':
    case 'BIWEEKLY':
      if (options.weekday !== undefined && (options.weekday < 0 || options.weekday > 6)) {
        errors.push('Weekday must be between 0 (Sunday) and 6 (Saturday)')
      }
      break
      
    case 'CUSTOM':
      if (!options.everyNWeeks || options.everyNWeeks < 1 || options.everyNWeeks > 52) {
        errors.push('Custom schedule must specify weeks between 1 and 52')
      }
      break
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Calculate frequency multiplier for annual calculations
 */
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

/**
 * Calculate expected annual income from a source
 */
export function calculateAnnualIncome(
  source: IncomeSource,
  deductions: any[] = []
): { gross: number; net: number; frequency: number } {
  const frequency = getAnnualFrequency(source.paySchedule, source.everyNWeeks)
  
  let gross = 0
  let net = 0
  
  if (source.gross) {
    gross = source.gross * frequency
    // Calculate net using deductions
    if (deductions.length > 0) {
      net = calculateNetIncome(source.gross, deductions) * frequency
    } else {
      net = source.net ? source.net * frequency : gross * 0.75 // Estimate 25% deductions
    }
  } else if (source.net) {
    net = source.net * frequency
    gross = net / 0.75 // Estimate gross
  }
  
  return { gross, net, frequency }
}

/**
 * Import helper: match bank transactions to scheduled income
 */
export function matchImportedIncomeTransaction(
  importedTransaction: {
    date: string
    amount: number
    payee?: string
    memo?: string
  },
  scheduledOccurrences: any[],
  tolerancePercent: number = 5,
  dateWindowDays: number = 2
): any | null {
  const txDate = new Date(importedTransaction.date)
  const txAmount = Math.abs(importedTransaction.amount)
  
  for (const occurrence of scheduledOccurrences) {
    if (occurrence.status !== 'SCHEDULED') continue
    
    const occDate = new Date(occurrence.scheduledAt)
    const daysDiff = Math.abs((txDate.getTime() - occDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Check date window
    if (daysDiff > dateWindowDays) continue
    
    // Check amount tolerance
    const amountDiff = Math.abs(txAmount - occurrence.net) / occurrence.net
    if (amountDiff > tolerancePercent / 100) continue
    
    // Check payee matching (optional)
    if (importedTransaction.payee || importedTransaction.memo) {
      const importedText = `${importedTransaction.payee || ''} ${importedTransaction.memo || ''}`.toLowerCase()
      const sourceName = occurrence.sourceName?.toLowerCase() || ''
      
      // Simple keyword matching
      const hasMatch = sourceName.split(' ').some(word => 
        word.length > 2 && importedText.includes(word)
      )
      
      if (!hasMatch) continue
    }
    
    return occurrence
  }
  
  return null
}

function calculateNetIncome(gross: number, deductions: any[]): number {
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
