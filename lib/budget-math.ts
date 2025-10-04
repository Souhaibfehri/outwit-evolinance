// Budget calculation utilities - single source of truth for RTA math

export interface BudgetMonth {
  month: string // YYYY-MM format
  expectedIncome: number
  totalAssigned: number
  totalSpent: number
  readyToAssign: number
}

export interface CategoryBudget {
  id: string
  name: string
  groupId: string
  plannedAmount: number
  spentAmount: number
  rolloverEnabled: boolean
  rolloverFromPrior: number // Can be positive or negative
}

export interface IncomeSource {
  id: string
  amount: number
  frequency: string
  isActive: boolean
  budgetMonth: string
}

export interface Transaction {
  id: string
  amount: number
  date: string
  budgetMonth: string
  categoryId: string
  type: 'income' | 'expense' | 'transfer'
}

/**
 * Calculate Ready-to-Assign for a specific month
 * RTA = Income - Assigned - Negative Rollover + Positive Rollover
 */
export function calculateRTA(
  month: string,
  income: IncomeSource[],
  categories: CategoryBudget[],
  priorMonthCategories?: CategoryBudget[]
): number {
  // 1. Calculate income for this month
  const monthlyIncome = income
    .filter(inc => inc.isActive && inc.budgetMonth === month)
    .reduce((sum, inc) => sum + inc.amount, 0)

  // 2. Calculate total assigned to categories
  const totalAssigned = categories
    .reduce((sum, cat) => sum + cat.plannedAmount, 0)

  // 3. Calculate rollover effects from prior month
  let rolloverEffect = 0
  if (priorMonthCategories) {
    rolloverEffect = priorMonthCategories
      .filter(cat => cat.rolloverEnabled)
      .reduce((sum, cat) => {
        const leftover = cat.plannedAmount - cat.spentAmount
        return sum + leftover // Positive or negative
      }, 0)
  }

  return monthlyIncome - totalAssigned + rolloverEffect
}

/**
 * Calculate category leftover (planned - spent)
 */
export function calculateCategoryLeftover(category: CategoryBudget): number {
  return category.plannedAmount - category.spentAmount + category.rolloverFromPrior
}

/**
 * Calculate budget utilization percentage
 */
export function calculateBudgetUtilization(
  totalAssigned: number,
  totalIncome: number
): number {
  if (totalIncome === 0) return 0
  return Math.min(100, (totalAssigned / totalIncome) * 100)
}

/**
 * Project next month values based on rollover settings
 */
export function projectNextMonth(
  currentCategories: CategoryBudget[]
): CategoryBudget[] {
  return currentCategories.map(cat => ({
    ...cat,
    rolloverFromPrior: cat.rolloverEnabled 
      ? calculateCategoryLeftover(cat)
      : 0,
    spentAmount: 0, // Reset for new month
    plannedAmount: cat.plannedAmount // Keep same planned amount
  }))
}

/**
 * Validate budget allocation doesn't exceed available income
 */
export function validateBudgetAllocation(
  totalIncome: number,
  totalAssigned: number,
  rolloverEffect: number
): {
  isValid: boolean
  overAllocation: number
  message?: string
} {
  const available = totalIncome + rolloverEffect
  const overAllocation = totalAssigned - available

  if (overAllocation > 0) {
    return {
      isValid: false,
      overAllocation,
      message: `You've allocated $${overAllocation.toFixed(2)} more than your available income`
    }
  }

  return {
    isValid: true,
    overAllocation: 0
  }
}

/**
 * Suggest category allocation based on income
 */
export function suggestCategoryAllocation(
  totalIncome: number,
  categories: CategoryBudget[]
): Record<string, number> {
  const suggestions: Record<string, number> = {}
  
  // Default allocation percentages
  const defaultAllocations: Record<string, number> = {
    'essentials': 0.50,  // 50% for essentials
    'housing': 0.30,     // 30% for housing
    'utilities': 0.10,   // 10% for utilities
    'transportation': 0.10, // 10% for transportation
    'food': 0.15,        // 15% for food
    'entertainment': 0.05, // 5% for entertainment
    'savings': 0.20,     // 20% for savings
    'debt': 0.15,        // 15% for debt payments
    'goals': 0.10        // 10% for goals
  }

  categories.forEach(category => {
    const categoryName = category.name.toLowerCase()
    let percentage = 0.05 // Default 5%

    // Find best match for allocation
    for (const [key, value] of Object.entries(defaultAllocations)) {
      if (categoryName.includes(key)) {
        percentage = value
        break
      }
    }

    suggestions[category.id] = Math.round(totalIncome * percentage)
  })

  return suggestions
}
