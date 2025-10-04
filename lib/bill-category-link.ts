// Bill ⇄ Category linking service

export interface BillCategoryLink {
  billId: string
  categoryId: string
  autoSuggestAmount: boolean
  createdAt: string
}

export interface LinkedBill {
  id: string
  name: string
  amount: number
  frequency: string
  nextDueDate: string
  categoryId?: string
  categoryName?: string
  suggestedMonthlyAmount: number
}

/**
 * Calculate monthly amount from bill frequency
 */
export function calculateMonthlyAmount(amount: number, frequency: string): number {
  switch (frequency.toLowerCase()) {
    case 'weekly': return amount * 4.33
    case 'biweekly': return amount * 2.17
    case 'semimonthly': return amount * 2
    case 'monthly': return amount
    case 'quarterly': return amount / 3
    case 'annual': return amount / 12
    default: return amount
  }
}

/**
 * Auto-create category for a bill if none exists
 */
export function createCategoryForBill(
  bill: any,
  existingCategories: any[],
  userId: string
): any {
  // Check if category already exists
  const existingCategory = existingCategories.find(cat => 
    cat.name.toLowerCase() === bill.name.toLowerCase() ||
    cat.name.toLowerCase().includes(bill.name.toLowerCase())
  )

  if (existingCategory) {
    return existingCategory
  }

  // Create new category
  const categoryId = `bill_cat_${Date.now()}_${bill.id}`
  
  // Determine category group based on bill type
  const groupMapping: Record<string, string> = {
    'utilities': 'Essentials',
    'housing': 'Essentials', 
    'transportation': 'Essentials',
    'insurance': 'Essentials',
    'entertainment': 'Lifestyle',
    'subscription': 'Lifestyle',
    'health': 'Essentials',
    'other': 'Essentials'
  }

  const groupName = groupMapping[bill.category?.toLowerCase()] || 'Essentials'

  return {
    id: categoryId,
    userId,
    name: bill.name,
    groupName,
    priority: 3,
    rollover: bill.category === 'utilities', // Utilities typically rollover
    sortOrder: 0,
    archived: false,
    type: 'expense',
    monthlyBudgetCents: Math.round(calculateMonthlyAmount(bill.amount, bill.frequency) * 100),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    linkedBillId: bill.id // Track the source bill
  }
}

/**
 * Link a bill to a category
 */
export function linkBillToCategory(
  billId: string,
  categoryId: string,
  bills: any[],
  categories: any[]
): BillCategoryLink {
  return {
    billId,
    categoryId,
    autoSuggestAmount: true,
    createdAt: new Date().toISOString()
  }
}

/**
 * Get bills linked to a category
 */
export function getLinkedBills(
  categoryId: string,
  bills: any[],
  billCategoryLinks: BillCategoryLink[]
): LinkedBill[] {
  const linkedBillIds = billCategoryLinks
    .filter(link => link.categoryId === categoryId)
    .map(link => link.billId)

  return bills
    .filter(bill => linkedBillIds.includes(bill.id))
    .map(bill => ({
      id: bill.id,
      name: bill.name,
      amount: bill.amount,
      frequency: bill.frequency,
      nextDueDate: bill.nextDue || bill.dueDate,
      categoryId,
      suggestedMonthlyAmount: calculateMonthlyAmount(bill.amount, bill.frequency)
    }))
}

/**
 * Update category planned amount based on linked bills
 */
export function suggestCategoryAmountFromBills(
  categoryId: string,
  bills: any[],
  billCategoryLinks: BillCategoryLink[]
): number {
  const linkedBills = getLinkedBills(categoryId, bills, billCategoryLinks)
  
  return linkedBills.reduce((total, bill) => {
    return total + bill.suggestedMonthlyAmount
  }, 0)
}

/**
 * Get next due date for a bill
 */
export function getNextDueDate(bill: any): Date {
  const today = new Date()
  const dueDate = new Date(bill.nextDue || bill.dueDate || today)
  
  // If due date is in the past, calculate next occurrence
  if (dueDate < today) {
    switch (bill.frequency.toLowerCase()) {
      case 'weekly':
        dueDate.setDate(dueDate.getDate() + 7)
        break
      case 'biweekly':
        dueDate.setDate(dueDate.getDate() + 14)
        break
      case 'monthly':
        dueDate.setMonth(dueDate.getMonth() + 1)
        break
      case 'quarterly':
        dueDate.setMonth(dueDate.getMonth() + 3)
        break
      case 'annual':
        dueDate.setFullYear(dueDate.getFullYear() + 1)
        break
    }
  }
  
  return dueDate
}

/**
 * Format due date for display
 */
export function formatDueDate(bill: any): string {
  const dueDate = getNextDueDate(bill)
  const today = new Date()
  const diffTime = dueDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} days overdue`
  } else if (diffDays === 0) {
    return 'Due today'
  } else if (diffDays === 1) {
    return 'Due tomorrow'
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} days`
  } else {
    return dueDate.toLocaleDateString()
  }
}
