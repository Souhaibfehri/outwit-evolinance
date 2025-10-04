// Shared recurrence engine for bills, income, and investments

export type Frequency = 
  | 'daily' 
  | 'weekly' 
  | 'bi-weekly' 
  | 'monthly' 
  | 'quarterly' 
  | 'semi-annual' 
  | 'annual' 
  | 'custom-cron'

export interface Recurrence {
  frequency: Frequency
  interval?: number        // every N periods (default 1)
  byMonthDay?: number     // for monthly: 1-31
  byWeekday?: string      // for weekly: "mon,wed,fri"
  startDate: Date
  endDate?: Date
  active: boolean
  timezone: string
  cron?: string           // for custom frequency
}

/**
 * Create a date without timezone issues
 */
function createCleanDate(year: number, month: number, day: number): Date {
  const date = new Date(Date.UTC(year, month, day, 0, 0, 0, 0))
  return date
}

/**
 * Calculate the next occurrence of a recurrence pattern
 */
export function nextOccurrence(recurrence: Recurrence, from: Date = new Date()): Date | null {
  if (!recurrence.active) return null
  
  const { frequency, interval = 1, byMonthDay, startDate, endDate } = recurrence
  
  // If we have an end date and we're past it, no next occurrence
  if (endDate && from >= endDate) return null
  
  // Normalize dates to avoid timezone issues
  const fromYear = from.getUTCFullYear()
  const fromMonth = from.getUTCMonth()
  const fromDay = from.getUTCDate()
  const startYear = startDate.getUTCFullYear()
  const startMonth = startDate.getUTCMonth()
  const startDay = startDate.getUTCDate()
  
  switch (frequency) {
    case 'daily':
      return createCleanDate(fromYear, fromMonth, fromDay + interval)
      
    case 'weekly': {
      const startDayOfWeek = startDate.getUTCDay()
      const fromDayOfWeek = from.getUTCDay()
      
      // Calculate days to add to get to the same day of week as start date
      let daysToAdd = (startDayOfWeek - fromDayOfWeek + 7) % 7
      if (daysToAdd === 0) daysToAdd = 7 // If same day, go to next week
      
      return createCleanDate(fromYear, fromMonth, fromDay + daysToAdd)
    }
      
    case 'bi-weekly': {
      // Find the start date's day of week
      const startDayOfWeek = startDate.getUTCDay()
      const fromDayOfWeek = from.getUTCDay()
      
      // Calculate how many days since the start date
      const daysSinceStart = Math.floor((from.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
      
      // Find the next bi-weekly occurrence
      const weeksSinceStart = Math.floor(daysSinceStart / 7)
      const nextBiWeeklyWeek = Math.floor(weeksSinceStart / 2) * 2 + 2 // Next bi-weekly period
      
      const daysToAdd = (nextBiWeeklyWeek * 7) - daysSinceStart
      return createCleanDate(fromYear, fromMonth, fromDay + daysToAdd)
    }
      
    case 'monthly': {
      const targetDay = byMonthDay || startDay
      
      // Start with next month since we want the NEXT occurrence
      let nextMonth = fromMonth + 1
      let nextYear = fromYear
      
      if (nextMonth > 11) {
        nextMonth = 0
        nextYear += 1
      }
      
      // Create the target date
      let result = createCleanDate(nextYear, nextMonth, Math.min(targetDay, 28)) // Start with safe day
      
      // Then try to set the actual target day
      result = createCleanDate(nextYear, nextMonth, targetDay)
      
      // Handle month-end edge cases (e.g., Feb 31 becomes Feb 28/29)
      if (result.getUTCDate() !== targetDay) {
        // The day doesn't exist in this month, get the last day of the month
        const lastDayOfMonth = new Date(Date.UTC(nextYear, nextMonth + 1, 0, 0, 0, 0, 0))
        result = lastDayOfMonth
      }
      
      return result
    }
      
    case 'quarterly': {
      // Start with the next quarter from the start date
      let nextMonth = startMonth + 3
      let nextYear = startYear
      
      // Adjust for year overflow
      while (nextMonth > 11) {
        nextMonth -= 12
        nextYear += 1
      }
      
      // Keep advancing quarters until we find one after 'from'
      while (true) {
        const candidate = createCleanDate(nextYear, nextMonth, startDay)
        if (candidate > from) {
          // Handle month-end edge cases
          if (candidate.getUTCDate() !== startDay) {
            return createCleanDate(nextYear, nextMonth + 1, 0)
          }
          return candidate
        }
        
        nextMonth += 3
        if (nextMonth > 11) {
          nextMonth -= 12
          nextYear += 1
        }
        
        // Safety break
        if (nextYear > fromYear + 10) break
      }
      
      return null
    }
      
    case 'semi-annual': {
      // Find the next semi-annual occurrence
      let nextMonth = startMonth
      let nextYear = startYear
      
      // Advance to future semi-annual periods until we find one after 'from'
      while (true) {
        const candidate = createCleanDate(nextYear, nextMonth, startDay)
        if (candidate > from) {
          // Handle month-end edge cases
          if (candidate.getDate() !== startDay) {
            return createCleanDate(nextYear, nextMonth + 1, 0)
          }
          return candidate
        }
        
        nextMonth += 6
        if (nextMonth > 11) {
          nextMonth -= 12
          nextYear += 1
        }
      }
    }
      
    case 'annual': {
      // Find next annual occurrence
      let nextYear = fromYear + 1 // Always go to next year for NEXT occurrence
      
      let candidate = createCleanDate(nextYear, startMonth, startDay)
      
      // Handle month-end edge cases (e.g., Feb 29 in non-leap years)
      if (candidate.getUTCDate() !== startDay) {
        candidate = createCleanDate(nextYear, startMonth + 1, 0)
      }
      
      return candidate
    }
      
    case 'custom-cron':
      // For now, fallback to monthly for custom cron
      // In production, you'd use a cron parser library
      return createCleanDate(fromYear, fromMonth + interval, fromDay)
      
    default:
      return null
  }
}

/**
 * Get all occurrences between two dates
 */
export function occurrencesBetween(recurrence: Recurrence, from: Date, to: Date): Date[] {
  const occurrences: Date[] = []
  
  // Start from the day before 'from' to capture boundary cases
  const searchStart = createCleanDate(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() - 1)
  let current = nextOccurrence(recurrence, searchStart)
  
  while (current && current <= to) {
    // Only include if it's actually in our range
    if (current >= from) {
      occurrences.push(new Date(current))
    }
    
    // Get next occurrence
    current = nextOccurrence(recurrence, current)
    
    // Safety break to prevent infinite loops
    if (occurrences.length > 1000) break
  }
  
  return occurrences
}

/**
 * Check if a date matches a recurrence pattern
 */
export function matchesRecurrence(recurrence: Recurrence, date: Date): boolean {
  const { frequency, interval = 1, byMonthDay, byWeekday, startDate } = recurrence
  
  // Calculate difference from start date
  const diffTime = date.getTime() - startDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  switch (frequency) {
    case 'daily':
      return diffDays >= 0 && diffDays % interval === 0
      
    case 'weekly':
      const diffWeeks = Math.floor(diffDays / 7)
      if (byWeekday) {
        const weekdays = byWeekday.split(',')
        const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
        const currentDay = dayNames[date.getDay()]
        return weekdays.includes(currentDay) && diffWeeks % interval === 0
      }
      return diffDays >= 0 && diffDays % (7 * interval) === 0
      
    case 'bi-weekly':
      return diffDays >= 0 && diffDays % (14 * interval) === 0
      
    case 'monthly':
      const monthsDiff = (date.getFullYear() - startDate.getFullYear()) * 12 + 
                        (date.getMonth() - startDate.getMonth())
      if (byMonthDay) {
        return date.getDate() === byMonthDay && monthsDiff % interval === 0
      }
      return date.getDate() === startDate.getDate() && monthsDiff % interval === 0
      
    case 'quarterly':
      const quartersDiff = Math.floor(
        ((date.getFullYear() - startDate.getFullYear()) * 12 + 
         (date.getMonth() - startDate.getMonth())) / 3
      )
      return quartersDiff % interval === 0 && date.getDate() === startDate.getDate()
      
    case 'annual':
      const yearsDiff = date.getFullYear() - startDate.getFullYear()
      return yearsDiff % interval === 0 && 
             date.getMonth() === startDate.getMonth() && 
             date.getDate() === startDate.getDate()
      
    default:
      return false
  }
}

/**
 * Convert frequency to human-readable string
 */
export function frequencyToString(frequency: Frequency, interval: number = 1): string {
  const intervalStr = interval > 1 ? `every ${interval} ` : ''
  
  switch (frequency) {
    case 'daily': return `${intervalStr}day${interval > 1 ? 's' : ''}`
    case 'weekly': return `${intervalStr}week${interval > 1 ? 's' : ''}`
    case 'bi-weekly': return 'bi-weekly'
    case 'monthly': return `${intervalStr}month${interval > 1 ? 's' : ''}`
    case 'quarterly': return `${intervalStr}quarter${interval > 1 ? 's' : ''}`
    case 'semi-annual': return 'semi-annually'
    case 'annual': return `${intervalStr}year${interval > 1 ? 's' : ''}`
    case 'custom-cron': return 'custom schedule'
    default: return frequency
  }
}

/**
 * Calculate monthly equivalent amount from any frequency
 */
export function toMonthlyAmount(amount: number, frequency: Frequency, interval: number = 1): number {
  switch (frequency) {
    case 'daily':
      return amount * 30.44 / interval // Average days per month
    case 'weekly':
      return amount * 4.33 / interval // Average weeks per month
    case 'bi-weekly':
      return amount * 2.17 / interval // Average bi-weekly periods per month
    case 'monthly':
      return amount / interval
    case 'quarterly':
      return amount / (3 * interval)
    case 'semi-annual':
      return amount / (6 * interval)
    case 'annual':
      return amount / (12 * interval)
    default:
      return amount / interval
  }
}

/**
 * Get days until next occurrence
 */
export function daysUntilNext(recurrence: Recurrence, from: Date = new Date()): number | null {
  const next = nextOccurrence(recurrence, from)
  if (!next) return null
  
  const diffTime = next.getTime() - from.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Create a recurrence pattern from simple frequency
 */
export function createRecurrence(
  frequency: Frequency,
  startDate: Date,
  options: {
    interval?: number
    byMonthDay?: number
    byWeekday?: string
    endDate?: Date
    timezone?: string
  } = {}
): Recurrence {
  return {
    frequency,
    interval: options.interval || 1,
    byMonthDay: options.byMonthDay,
    byWeekday: options.byWeekday,
    startDate,
    endDate: options.endDate,
    active: true,
    timezone: options.timezone || 'UTC'
  }
}