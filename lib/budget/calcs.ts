// Budget calculation utilities

export interface MonthSummary {
  readyToAssign: number // Ready to Assign (formerly rta)
  expectedIncome: number
  totalAssigned: number // formerly totalAssigned
  totalSpent: number // formerly totalSpent
  leftoverTotal: number
  isOverAssigned: boolean
}

export interface CategoryBudgetItem {
  categoryId: string
  categoryName: string
  assigned: number
  spent: number
  leftoverFromPrev: number
  left: number // assigned - spent
  priority: number
  rollover: boolean
  groupId?: string
  groupName?: string
}

export interface BudgetData {
  month: string
  userId: string
  expectedIncome: number
  allowOverAssign: boolean
  categories: CategoryBudgetItem[]
  recurringIncome: Array<{ amountCents: number; schedule: string; active: boolean }>
  oneOffIncome: Array<{ amountCents: number; date: string }>
}

/**
 * Calculate monthly income from recurring and one-off sources
 */
export function calcMonthlyIncome(
  recurringIncome: Array<{ amountCents: number; schedule: string; active: boolean }>,
  oneOffIncome: Array<{ amountCents: number; date: string }>,
  targetMonth: string
): number {
  let total = 0

  // Add recurring income (convert to monthly equivalent)
  recurringIncome.forEach(income => {
    if (!income.active) return
    
    const monthlyAmount = convertToMonthlyAmount(income.amountCents, income.schedule)
    total += monthlyAmount
  })

  // Add one-off income for the target month
  const [year, month] = targetMonth.split('-')
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
 * Calculate rollover carry-over from previous month
 */
export function calcCarryOver(
  prevMonthCategories: CategoryBudgetItem[],
  currentMonth: string,
  userId: string
): Array<{ categoryId: string; leftoverAmount: number }> {
  const carryOvers: Array<{ categoryId: string; leftoverAmount: number }> = []

  prevMonthCategories.forEach(category => {
    if (category.rollover) {
      const leftover = Math.max(0, category.assigned - category.spent)
      if (leftover > 0) {
        carryOvers.push({
          categoryId: category.categoryId,
          leftoverAmount: leftover
        })
      }
    }
  })

  return carryOvers
}

/**
 * Calculate month summary with RTA and totals
 */
export function calcMonthSummary(data: BudgetData): MonthSummary {
  const totalAssigned = data.categories.reduce((sum, cat) => sum + cat.assigned, 0)
  const totalSpent = data.categories.reduce((sum, cat) => sum + cat.spent, 0)
  const leftoverTotal = data.categories.reduce((sum, cat) => sum + cat.leftoverFromPrev, 0)
  
  // Calculate monthly income
  const monthlyIncome = calcMonthlyIncome(
    data.recurringIncome,
    data.oneOffIncome,
    data.month
  )
  
  const expectedIncome = data.expectedIncome || monthlyIncome
  
  // Ready to Assign = Expected Income + Rollover Leftovers - Total Assigned
  const rta = expectedIncome + leftoverTotal - totalAssigned
  
  const isOverAssigned = rta < 0

  return {
    readyToAssign: rta,
    expectedIncome,
    totalAssigned,
    totalSpent,
    leftoverTotal,
    isOverAssigned
  }
}

/**
 * Validate if a new assignment would exceed RTA
 */
export function validateAssignment(
  currentAssigned: number,
  newAssignment: number,
  categoryId: string,
  monthSummary: MonthSummary,
  allowOverAssign: boolean
): { isValid: boolean; error?: string; newRTA: number } {
  const difference = newAssignment - currentAssigned
  const newRTA = monthSummary.readyToAssign - difference
  
  if (newRTA < 0 && !allowOverAssign) {
    return {
      isValid: false,
      error: `That would exceed your Ready to Assign by $${Math.abs(newRTA).toFixed(2)}. Reduce the amount or allow over-assign.`,
      newRTA
    }
  }
  
  return {
    isValid: true,
    newRTA
  }
}

/**
 * Sort categories by different criteria
 */
export function sortCategories(
  categories: CategoryBudgetItem[],
  sortBy: 'priority' | 'assigned' | 'spent' | 'alphabetical'
): CategoryBudgetItem[] {
  const sorted = [...categories]
  
  switch (sortBy) {
    case 'priority':
      return sorted.sort((a, b) => a.priority - b.priority || a.categoryName.localeCompare(b.categoryName))
    case 'assigned':
      return sorted.sort((a, b) => b.assigned - a.assigned || a.categoryName.localeCompare(b.categoryName))
    case 'spent':
      return sorted.sort((a, b) => b.spent - a.spent || a.categoryName.localeCompare(b.categoryName))
    case 'alphabetical':
      return sorted.sort((a, b) => a.categoryName.localeCompare(b.categoryName))
    default:
      return sorted
  }
}

/**
 * Group categories by their groups
 */
export function groupCategories(
  categories: CategoryBudgetItem[]
): Record<string, CategoryBudgetItem[]> {
  const grouped: Record<string, CategoryBudgetItem[]> = {}
  
  categories.forEach(category => {
    const groupKey = category.groupName || 'Uncategorized'
    if (!grouped[groupKey]) {
      grouped[groupKey] = []
    }
    grouped[groupKey].push(category)
  })
  
  return grouped
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Calculate progress percentage
 */
export function calcProgress(spent: number, assigned: number): number {
  if (assigned === 0) return 0
  return Math.min(100, (spent / assigned) * 100)
}
