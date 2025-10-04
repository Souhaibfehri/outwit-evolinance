// Utility functions for catch-up estimator

export interface CategorySplit {
  name: string
  percentage: number
  amount: number
  color: string
}

export interface CatchUpInput {
  daysAway: number
  totalSpent: number
  categories: CategorySplit[]
}

export function normalizeCategorySplit(categories: CategorySplit[]): CategorySplit[] {
  const total = categories.reduce((sum, cat) => sum + cat.percentage, 0)
  
  if (total === 0) return categories
  
  return categories.map(cat => ({
    ...cat,
    percentage: Math.round((cat.percentage / total) * 100),
    amount: (cat.amount * 100) / total
  }))
}

export function validateCategorySplit(categories: CategorySplit[]): {
  isValid: boolean
  totalPercentage: number
  errors: string[]
} {
  const totalPercentage = categories.reduce((sum, cat) => sum + cat.percentage, 0)
  const errors: string[] = []
  
  if (totalPercentage < 95 || totalPercentage > 105) {
    errors.push(`Total percentage is ${totalPercentage}%. Should be between 95-105%.`)
  }
  
  const negativeCategories = categories.filter(cat => cat.percentage < 0)
  if (negativeCategories.length > 0) {
    errors.push('Category percentages cannot be negative.')
  }
  
  return {
    isValid: errors.length === 0,
    totalPercentage,
    errors
  }
}

export function generateEstimatedTransactions(input: CatchUpInput, userId: string, accountId: string) {
  const { daysAway, totalSpent, categories } = input
  const normalizedCategories = normalizeCategorySplit(categories)
  
  // Create transaction date (end of the away period)
  const transactionDate = new Date()
  transactionDate.setDate(transactionDate.getDate() - 1) // Yesterday as the catch-up date
  
  const transactions = normalizedCategories
    .filter(category => category.amount > 0)
    .map((category, index) => ({
      id: `catchup_${Date.now()}_${index}`,
      date: transactionDate.toISOString().split('T')[0],
      merchant: `${category.name} (Catch-up estimate)`,
      categoryId: category.name.toLowerCase().replace(/\s+/g, '_'), // Simple category mapping
      accountId,
      type: 'EXPENSE' as const,
      amountCents: Math.round(category.amount * 100),
      note: `Approximate catch-up entry created for ${daysAway} days away`,
      isApproximate: true,
      source: 'catch_up',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
  
  return transactions
}

export function getSuggestedCategorySplit(
  lastMonthTransactions: any[] = [],
  budgetCategories: any[] = []
): CategorySplit[] {
  // If we have last month's data, use actual spending percentages
  if (lastMonthTransactions.length > 0) {
    const totalSpent = lastMonthTransactions.reduce((sum, t) => sum + Math.abs(t.amountCents), 0)
    const categorySpending = lastMonthTransactions.reduce((acc, t) => {
      const categoryName = t.category?.name || 'Misc'
      acc[categoryName] = (acc[categoryName] || 0) + Math.abs(t.amountCents)
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(categorySpending).map(([name, amount], index) => ({
      name,
      percentage: Math.round((amount / totalSpent) * 100),
      amount: amount / 100,
      color: `bg-${['blue', 'green', 'yellow', 'red', 'purple', 'gray'][index % 6]}-500`
    }))
  }
  
  // If we have budget categories, use their proportions
  if (budgetCategories.length > 0) {
    const totalBudget = budgetCategories.reduce((sum, cat) => sum + cat.monthlyBudgetCents, 0)
    
    return budgetCategories.map((cat, index) => ({
      name: cat.name,
      percentage: totalBudget > 0 ? Math.round((cat.monthlyBudgetCents / totalBudget) * 100) : 0,
      amount: 0,
      color: `bg-${['blue', 'green', 'yellow', 'red', 'purple', 'gray'][index % 6]}-500`
    }))
  }
  
  // Fallback to equal split across default categories
  const defaultCategories = [
    'Essentials', 'Groceries', 'Transport', 'Dining Out', 'Shopping', 'Misc'
  ]
  
  return defaultCategories.map((name, index) => ({
    name,
    percentage: Math.round(100 / defaultCategories.length),
    amount: 0,
    color: `bg-${['blue', 'green', 'yellow', 'red', 'purple', 'gray'][index]}-500`
  }))
}
