// YNAB-style Targets Engine
// Handles "Refill Up To", "Set Aside Another", "Have Balance By" targets

export type TargetType = 'refill_up_to' | 'set_aside_another' | 'have_balance_by' | 'none'
export type TargetCadence = 'monthly' | 'yearly' | 'custom'

export interface CategoryTarget {
  categoryId: string
  categoryName: string
  targetType: TargetType
  targetAmount: number
  targetDate?: string // ISO date for 'have_balance_by'
  targetCadence: TargetCadence
  snoozedUntil?: string // ISO date
  targetEnabled: boolean
}

export interface TargetCalculation {
  categoryId: string
  categoryName: string
  targetType: TargetType
  targetAmount: number
  currentBalance: number // assigned - spent + carryover
  needed: number // amount needed to meet target
  isUnderfunded: boolean
  isSnoozed: boolean
  daysUntilDue?: number
  monthsUntilDue?: number
  suggestedAssignment: number
}

export interface CostToBeMeCalculation {
  totalTargetAmount: number
  totalNeeded: number
  totalUnderfunded: number
  expectedIncome: number
  surplus: number // expectedIncome - totalNeeded
  categories: TargetCalculation[]
}

/**
 * Calculate target needs for all categories in a given month
 */
export function calculateTargetNeeds(
  categories: any[],
  budgetItems: any[],
  month: string,
  expectedIncome: number = 0
): CostToBeMeCalculation {
  const currentDate = new Date()
  const targetCalculations: TargetCalculation[] = []
  
  let totalTargetAmount = 0
  let totalNeeded = 0
  let totalUnderfunded = 0

  categories.forEach(category => {
    if (!category.targetEnabled || category.targetType === 'none') return

    const budgetItem = budgetItems.find(
      (bi: any) => bi.categoryId === category.id && bi.month === month
    )

    const assigned = budgetItem?.assigned || 0
    const spent = budgetItem?.spent || 0
    const carryover = budgetItem?.leftoverFromPrev || 0
    const currentBalance = assigned - spent + carryover

    // Check if target is snoozed for current month
    const isSnoozed = category.snoozedUntil && 
      new Date(category.snoozedUntil) >= currentDate

    const calculation = calculateCategoryTarget(
      category,
      currentBalance,
      month,
      isSnoozed
    )

    targetCalculations.push(calculation)
    
    if (!isSnoozed) {
      totalTargetAmount += calculation.targetAmount
      totalNeeded += Math.max(0, calculation.needed)
      if (calculation.isUnderfunded) {
        totalUnderfunded += calculation.needed
      }
    }
  })

  const surplus = expectedIncome - totalNeeded

  return {
    totalTargetAmount,
    totalNeeded,
    totalUnderfunded,
    expectedIncome,
    surplus,
    categories: targetCalculations
  }
}

/**
 * Calculate target need for a single category
 */
function calculateCategoryTarget(
  category: any,
  currentBalance: number,
  month: string,
  isSnoozed: boolean = false
): TargetCalculation {
  const targetAmount = parseFloat(category.targetAmount) || 0
  let needed = 0
  let suggestedAssignment = 0
  let daysUntilDue: number | undefined
  let monthsUntilDue: number | undefined

  switch (category.targetType) {
    case 'refill_up_to':
      // Need to reach target amount, accounting for carryover
      needed = Math.max(0, targetAmount - currentBalance)
      suggestedAssignment = needed
      break

    case 'set_aside_another':
      // Always need the full target amount each period
      needed = targetAmount
      suggestedAssignment = targetAmount
      break

    case 'have_balance_by':
      if (category.targetDate) {
        const targetDate = new Date(category.targetDate)
        const currentDate = new Date()
        const monthsRemaining = Math.max(1, 
          (targetDate.getFullYear() - currentDate.getFullYear()) * 12 + 
          (targetDate.getMonth() - currentDate.getMonth())
        )
        
        daysUntilDue = Math.ceil((targetDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
        monthsUntilDue = monthsRemaining
        
        const totalNeeded = Math.max(0, targetAmount - currentBalance)
        needed = totalNeeded / monthsRemaining
        suggestedAssignment = Math.ceil(needed)
      }
      break

    default:
      needed = 0
      suggestedAssignment = 0
  }

  return {
    categoryId: category.id,
    categoryName: category.name,
    targetType: category.targetType,
    targetAmount,
    currentBalance,
    needed,
    isUnderfunded: needed > 0 && !isSnoozed,
    isSnoozed,
    daysUntilDue,
    monthsUntilDue,
    suggestedAssignment
  }
}

/**
 * Calculate underfunded amount for selected categories
 */
export function calculateUnderfundedAmount(
  selectedCategoryIds: string[],
  targetCalculations: TargetCalculation[]
): number {
  return targetCalculations
    .filter(calc => selectedCategoryIds.includes(calc.categoryId))
    .reduce((sum, calc) => sum + Math.max(0, calc.needed), 0)
}

/**
 * Snooze a target until the end of current month
 */
export function snoozeTarget(categoryId: string, month: string): Date {
  const [year, monthNum] = month.split('-').map(Number)
  const endOfMonth = new Date(year, monthNum, 0) // Last day of month
  return endOfMonth
}

/**
 * Check if a target is currently snoozed
 */
export function isTargetSnoozed(category: any): boolean {
  if (!category.snoozedUntil) return false
  return new Date(category.snoozedUntil) >= new Date()
}

/**
 * Get target display text for UI
 */
export function getTargetDisplayText(target: CategoryTarget): string {
  switch (target.targetType) {
    case 'refill_up_to':
      return `Refill up to $${target.targetAmount.toLocaleString()}`
    
    case 'set_aside_another':
      const cadenceText = target.targetCadence === 'monthly' ? 'month' : 'year'
      return `Set aside $${target.targetAmount.toLocaleString()} each ${cadenceText}`
    
    case 'have_balance_by':
      const dateText = target.targetDate ? 
        new Date(target.targetDate).toLocaleDateString() : 'target date'
      return `Have $${target.targetAmount.toLocaleString()} by ${dateText}`
    
    default:
      return 'No target set'
  }
}

/**
 * Validate target configuration
 */
export function validateTarget(target: Partial<CategoryTarget>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!target.targetType || target.targetType === 'none') {
    return { isValid: true, errors: [] }
  }

  if (!target.targetAmount || target.targetAmount <= 0) {
    errors.push('Target amount must be greater than 0')
  }

  if (target.targetType === 'have_balance_by') {
    if (!target.targetDate) {
      errors.push('Target date is required for "Have balance by" targets')
    } else {
      const targetDate = new Date(target.targetDate)
      const today = new Date()
      if (targetDate <= today) {
        errors.push('Target date must be in the future')
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Calculate monthly contribution needed for "have_balance_by" target
 */
export function calculateMonthlyContribution(
  targetAmount: number,
  currentBalance: number,
  targetDate: string
): number {
  const target = new Date(targetDate)
  const now = new Date()
  
  const monthsRemaining = Math.max(1,
    (target.getFullYear() - now.getFullYear()) * 12 + 
    (target.getMonth() - now.getMonth())
  )
  
  const amountNeeded = Math.max(0, targetAmount - currentBalance)
  return amountNeeded / monthsRemaining
}

/**
 * Get target priority for auto-assignment
 * Higher number = higher priority
 */
export function getTargetPriority(calculation: TargetCalculation): number {
  if (calculation.isSnoozed) return 0
  if (!calculation.isUnderfunded) return 1

  // Prioritize by urgency and type
  let priority = 5

  if (calculation.targetType === 'have_balance_by' && calculation.daysUntilDue) {
    // More urgent = higher priority
    if (calculation.daysUntilDue <= 30) priority += 5
    else if (calculation.daysUntilDue <= 90) priority += 3
    else if (calculation.daysUntilDue <= 180) priority += 1
  }

  if (calculation.targetType === 'set_aside_another') {
    priority += 2 // Regular savings should be prioritized
  }

  return priority
}
