// Bill scheduler engine with timezone and business day support

import { Bill, BillOccurrence, BUSINESS_DAYS } from '@/lib/types/bills'

/**
 * Get next N occurrences for a bill
 */
export function getNextOccurrences(
  bill: Bill, 
  fromDate: Date = new Date(), 
  limit: number = 3
): Date[] {
  const occurrences: Date[] = []
  const startDate = new Date(Math.max(fromDate.getTime(), new Date(bill.startsOn).getTime()))
  
  // If bill has ended, return empty
  if (bill.endsOn && new Date(bill.endsOn) < fromDate) {
    return occurrences
  }

  let currentDate = new Date(startDate)
  let attempts = 0
  const maxAttempts = limit * 10 // Safety valve

  while (occurrences.length < limit && attempts < maxAttempts) {
    attempts++
    
    const nextDate = calculateNextOccurrence(bill, currentDate)
    
    // Skip if before fromDate
    if (nextDate < fromDate) {
      currentDate = nextDate
      continue
    }
    
    // Skip if after end date
    if (bill.endsOn && nextDate > new Date(bill.endsOn)) {
      break
    }

    // Apply business day rule
    const adjustedDate = applyBusinessDayRule(nextDate, bill.businessDayRule)
    
    // Set proper time and timezone
    const finalDate = setTimeAndTimezone(adjustedDate, bill.dueTime, bill.timezone)
    
    occurrences.push(finalDate)
    currentDate = new Date(nextDate.getTime() + 24 * 60 * 60 * 1000) // Move to next day
  }

  return occurrences
}

/**
 * Calculate the next occurrence based on frequency
 */
function calculateNextOccurrence(bill: Bill, fromDate: Date): Date {
  const date = new Date(fromDate)

  switch (bill.frequency) {
    case 'monthly':
      return calculateMonthlyOccurrence(date, bill.dayOfMonth || 1)
    
    case 'weekly':
      return calculateWeeklyOccurrence(date, bill.weekday || 0)
    
    case 'biweekly':
      return calculateBiweeklyOccurrence(date, new Date(bill.startsOn))
    
    case 'quarterly':
      return calculateQuarterlyOccurrence(date, bill.dayOfMonth || 1)
    
    case 'semiannual':
      return calculateSemiannualOccurrence(date, bill.dayOfMonth || 1)
    
    case 'annual':
      return calculateAnnualOccurrence(date, bill.dayOfMonth || 1)
    
    case 'customEveryNMonths':
      return calculateCustomMonthsOccurrence(date, bill.everyN || 1, bill.dayOfMonth || 1)
    
    default:
      // Fallback to monthly
      return calculateMonthlyOccurrence(date, bill.dayOfMonth || 1)
  }
}

/**
 * Monthly occurrence calculation
 */
function calculateMonthlyOccurrence(fromDate: Date, dayOfMonth: number): Date {
  const date = new Date(fromDate)
  
  if (dayOfMonth === -1) {
    // Last day of month
    date.setMonth(date.getMonth() + 1, 0) // Sets to last day of current month
  } else {
    // Specific day of month
    date.setDate(dayOfMonth)
    
    // If we've passed this day this month, move to next month
    if (date <= fromDate) {
      date.setMonth(date.getMonth() + 1)
      date.setDate(dayOfMonth)
    }
    
    // Handle months with fewer days (e.g., Feb 30 → Feb 28)
    const maxDayInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    if (dayOfMonth > maxDayInMonth) {
      date.setDate(maxDayInMonth)
    }
  }
  
  return date
}

/**
 * Weekly occurrence calculation
 */
function calculateWeeklyOccurrence(fromDate: Date, weekday: number): Date {
  const date = new Date(fromDate)
  const currentWeekday = date.getDay()
  
  let daysToAdd = weekday - currentWeekday
  if (daysToAdd <= 0) {
    daysToAdd += 7 // Next week
  }
  
  date.setDate(date.getDate() + daysToAdd)
  return date
}

/**
 * Bi-weekly occurrence calculation
 */
function calculateBiweeklyOccurrence(fromDate: Date, anchorDate: Date): Date {
  const daysDiff = Math.floor((fromDate.getTime() - anchorDate.getTime()) / (24 * 60 * 60 * 1000))
  const weeksSinceAnchor = Math.floor(daysDiff / 14)
  const nextBiweekly = new Date(anchorDate)
  
  nextBiweekly.setDate(anchorDate.getDate() + (weeksSinceAnchor + 1) * 14)
  
  return nextBiweekly
}

/**
 * Quarterly occurrence calculation
 */
function calculateQuarterlyOccurrence(fromDate: Date, dayOfMonth: number): Date {
  const date = new Date(fromDate)
  
  // Find next quarter
  const currentQuarter = Math.floor(date.getMonth() / 3)
  const nextQuarterMonth = (currentQuarter + 1) * 3
  
  if (nextQuarterMonth >= 12) {
    date.setFullYear(date.getFullYear() + 1)
    date.setMonth(0) // January
  } else {
    date.setMonth(nextQuarterMonth)
  }
  
  date.setDate(Math.min(dayOfMonth, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()))
  
  return date
}

/**
 * Semi-annual occurrence calculation
 */
function calculateSemiannualOccurrence(fromDate: Date, dayOfMonth: number): Date {
  const date = new Date(fromDate)
  
  // Add 6 months
  date.setMonth(date.getMonth() + 6)
  date.setDate(Math.min(dayOfMonth, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()))
  
  return date
}

/**
 * Annual occurrence calculation
 */
function calculateAnnualOccurrence(fromDate: Date, dayOfMonth: number): Date {
  const date = new Date(fromDate)
  
  // Add 1 year
  date.setFullYear(date.getFullYear() + 1)
  date.setDate(Math.min(dayOfMonth, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()))
  
  return date
}

/**
 * Custom every N months calculation
 */
function calculateCustomMonthsOccurrence(fromDate: Date, everyN: number, dayOfMonth: number): Date {
  const date = new Date(fromDate)
  
  date.setMonth(date.getMonth() + everyN)
  date.setDate(Math.min(dayOfMonth, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()))
  
  return date
}

/**
 * Apply business day rule
 */
function applyBusinessDayRule(date: Date, rule: Bill['businessDayRule']): Date {
  if (rule === 'none') return date
  
  const adjustedDate = new Date(date)
  const dayOfWeek = adjustedDate.getDay()
  
  // If it's a weekend, move to next business day
  if (dayOfWeek === 0) { // Sunday
    adjustedDate.setDate(adjustedDate.getDate() + 1) // Monday
  } else if (dayOfWeek === 6) { // Saturday
    adjustedDate.setDate(adjustedDate.getDate() + 2) // Monday
  }
  
  return adjustedDate
}

/**
 * Set time and timezone
 */
function setTimeAndTimezone(date: Date, dueTime: string, timezone: string): Date {
  const [hours, minutes] = dueTime.split(':').map(Number)
  const adjustedDate = new Date(date)
  
  adjustedDate.setHours(hours, minutes, 0, 0)
  
  // Note: Proper timezone handling would require a library like date-fns-tz
  // For now, we'll use the local timezone with the specified time
  return adjustedDate
}

/**
 * Check if a bill is overdue
 */
export function isBillOverdue(bill: Bill, currentDate: Date = new Date()): boolean {
  const nextOccurrences = getNextOccurrences(bill, currentDate, 1)
  if (nextOccurrences.length === 0) return false
  
  const nextDue = nextOccurrences[0]
  return currentDate > nextDue
}

/**
 * Check if a bill is due soon
 */
export function isBillDueSoon(
  bill: Bill, 
  currentDate: Date = new Date(), 
  dueSoonDays: number = 7
): boolean {
  const nextOccurrences = getNextOccurrences(bill, currentDate, 1)
  if (nextOccurrences.length === 0) return false
  
  const nextDue = nextOccurrences[0]
  const diffTime = nextDue.getTime() - currentDate.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays >= 0 && diffDays <= dueSoonDays
}

/**
 * Get bill status
 */
export function getBillStatus(bill: Bill, currentDate: Date = new Date()): BillListItem['status'] {
  const nextOccurrences = getNextOccurrences(bill, currentDate, 1)
  if (nextOccurrences.length === 0) return 'upcoming'
  
  const nextDue = nextOccurrences[0]
  const diffTime = nextDue.getTime() - currentDate.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'overdue'
  if (diffDays === 0) return 'due_today'
  return 'upcoming'
}

/**
 * Format frequency for display
 */
export function formatFrequencyDisplay(bill: Bill): string {
  switch (bill.frequency) {
    case 'monthly':
      return `Monthly (${getOrdinalDay(bill.dayOfMonth || 1)})`
    case 'weekly':
      return `Weekly (${getDayName(bill.weekday || 0)})`
    case 'biweekly':
      return 'Bi-weekly'
    case 'quarterly':
      return `Quarterly (${getOrdinalDay(bill.dayOfMonth || 1)})`
    case 'semiannual':
      return `Semi-annual (${getOrdinalDay(bill.dayOfMonth || 1)})`
    case 'annual':
      return `Annual (${getOrdinalDay(bill.dayOfMonth || 1)})`
    case 'customEveryNMonths':
      return `Every ${bill.everyN} months`
    default:
      return 'Custom'
  }
}

/**
 * Get ordinal day (1st, 2nd, 3rd, etc.)
 */
function getOrdinalDay(day: number): string {
  if (day === -1) return 'last day'
  
  const suffix = ['th', 'st', 'nd', 'rd'][day % 10] || 'th'
  if (day >= 11 && day <= 13) return `${day}th`
  return `${day}${suffix}`
}

/**
 * Get day name
 */
function getDayName(dayIndex: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayIndex] || 'Unknown'
}

/**
 * Calculate days until due
 */
export function getDaysUntilDue(bill: Bill, currentDate: Date = new Date()): number {
  const nextOccurrences = getNextOccurrences(bill, currentDate, 1)
  if (nextOccurrences.length === 0) return 999
  
  const nextDue = nextOccurrences[0]
  const diffTime = nextDue.getTime() - currentDate.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Get bills that need autopay processing
 */
export function getBillsForAutopay(
  bills: Bill[], 
  currentDate: Date = new Date()
): Bill[] {
  return bills.filter(bill => {
    if (!bill.autopayEnabled || bill.archivedAt) return false
    
    const nextOccurrences = getNextOccurrences(bill, currentDate, 1)
    if (nextOccurrences.length === 0) return false
    
    const nextDue = nextOccurrences[0]
    const gracePeriod = bill.autopayGraceDays * 24 * 60 * 60 * 1000
    const autopayDate = new Date(nextDue.getTime() - gracePeriod)
    
    return currentDate >= autopayDate && currentDate <= nextDue
  })
}

/**
 * Calculate monthly amount from bill frequency
 */
export function calculateMonthlyAmount(bill: Bill): number {
  switch (bill.frequency) {
    case 'weekly': return bill.amount * 4.33
    case 'biweekly': return bill.amount * 2.17
    case 'monthly': return bill.amount
    case 'quarterly': return bill.amount / 3
    case 'semiannual': return bill.amount / 6
    case 'annual': return bill.amount / 12
    case 'customEveryNMonths': return bill.amount / (bill.everyN || 1)
    default: return bill.amount
  }
}

/**
 * Validate bill schedule
 */
export function validateBillSchedule(bill: Partial<Bill>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!bill.name?.trim()) {
    errors.push('Bill name is required')
  }

  if (!bill.amount || bill.amount <= 0) {
    errors.push('Amount must be greater than 0')
  }

  if (!bill.categoryId) {
    errors.push('Category is required')
  }

  if (!bill.startsOn) {
    errors.push('Start date is required')
  }

  if (bill.frequency === 'customEveryNMonths' && (!bill.everyN || bill.everyN < 1)) {
    errors.push('Custom frequency must be at least 1 month')
  }

  if (bill.frequency === 'weekly' && (bill.weekday === undefined || bill.weekday < 0 || bill.weekday > 6)) {
    errors.push('Valid weekday (0-6) required for weekly bills')
  }

  if (bill.dayOfMonth && (bill.dayOfMonth < -1 || bill.dayOfMonth === 0 || bill.dayOfMonth > 31)) {
    errors.push('Day of month must be 1-31 or -1 for last day')
  }

  if (bill.endsOn && bill.startsOn && new Date(bill.endsOn) <= new Date(bill.startsOn)) {
    errors.push('End date must be after start date')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Get bill color based on status
 */
export function getBillStatusColor(status: BillListItem['status']): {
  stripe: string
  badge: string
  text: string
} {
  switch (status) {
    case 'overdue':
      return {
        stripe: 'border-l-red-500',
        badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        text: 'text-red-600 dark:text-red-400'
      }
    case 'due_today':
      return {
        stripe: 'border-l-amber-500',
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
        text: 'text-amber-600 dark:text-amber-400'
      }
    case 'upcoming':
      return {
        stripe: 'border-l-gray-300',
        badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
        text: 'text-gray-600 dark:text-gray-400'
      }
    case 'paid':
      return {
        stripe: 'border-l-green-500',
        badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        text: 'text-green-600 dark:text-green-400'
      }
  }
}
