import { redirect } from 'next/navigation'
import { getUserAndEnsure } from '@/lib/ensureUser'
import { BudgetPageClient } from './budget-client'
import {
  calcMonthSummary,
  type CategoryBudgetItem,
  type MonthSummary
} from '@/lib/budget/calcs'
import { calculateRTA, validateBudgetAllocation } from '@/lib/budget-math'

// Force dynamic rendering for authenticated route
export const dynamic = 'force-dynamic'

// Helper functions
function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default async function BudgetPage() {
  // Get user data server-side
  const user = await getUserAndEnsure()
  if (!user) {
    redirect('/onboarding')
  }

  const currentMonth = getCurrentMonth()
  const metadata = user.user_metadata || {}
  
  const categoryGroups = metadata.category_groups || []
  const categories = metadata.categories || []
  const budgetItems = metadata.budget_items || []
  const budgetMonths = metadata.budget_months || []
  const recurringIncome = metadata.recurring_income || []
  const oneOffIncome = metadata.one_off_income || []

  // Find or create current budget month
  let budgetMonth = budgetMonths.find((bm: any) => bm.month === currentMonth)
  if (!budgetMonth) {
    budgetMonth = {
      id: Date.now().toString(),
      userId: user.id,
      month: currentMonth,
      expectedIncome: 0,
      allowOverAssign: false
    }
  }

  // Transform categories to budget items format
  const categoryBudgetItems: CategoryBudgetItem[] = categories.map((category: any) => {
    const budgetItem = budgetItems.find(
      (bi: any) => bi.categoryId === category.id && bi.month === currentMonth
    )
    
    const group = categoryGroups.find((g: any) => g.id === category.groupId)
    
    return {
      categoryId: category.id,
      categoryName: category.name,
      assigned: budgetItem ? parseFloat(budgetItem.assigned) : 0,
      spent: budgetItem ? parseFloat(budgetItem.spent) : 0,
      leftoverFromPrev: budgetItem ? parseFloat(budgetItem.leftoverFromPrev) : 0,
      left: (budgetItem ? parseFloat(budgetItem.assigned) : 0) - (budgetItem ? parseFloat(budgetItem.spent) : 0),
      priority: category.priority || 3,
      rollover: category.rollover || false,
      groupId: category.groupId,
      groupName: group?.name || 'Uncategorized'
    }
  })

  // Calculate month summary
  const monthSummary = calcMonthSummary({
    month: currentMonth,
    userId: user.id,
    expectedIncome: budgetMonth.expectedIncome || 0,
    allowOverAssign: budgetMonth.allowOverAssign || false,
    categories: categoryBudgetItems,
    recurringIncome,
    oneOffIncome
  })

  const initialData = {
    user,
    currentMonth,
    categoryGroups,
    categories,
    budgetItems,
    budgetMonth,
    recurringIncome,
    oneOffIncome,
    monthSummary
  }

  return <BudgetPageClient initialData={initialData} />
}
