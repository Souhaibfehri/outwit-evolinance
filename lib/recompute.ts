// Centralized recompute system for dashboard KPIs and caches

import { getUserAndEnsure, updateUserMetadata } from './ensureUser'
import { nextOccurrence, toMonthlyAmount } from './recurrence'

export interface DashboardKPIs {
  monthlyIncome: number
  readyToAssign: number
  thisMonthSpent: number
  totalDebt: number
  investmentContributions: number
  savingsRate: number
  essentialsPercentage: number
  netCashFlow: number
}

export interface BudgetSummary {
  expectedIncome: number
  totalAssigned: number
  totalSpent: number
  readyToAssign: number
  isOverAllocated: boolean
  categories: Array<{
    id: string
    name: string
    assigned: number
    spent: number
    remaining: number
    rollover: boolean
    priority: number
  }>
}

export interface UpcomingItems {
  bills: Array<{
    id: string
    name: string
    amount: number
    dueDate: Date
    daysUntil: number
    isPastDue: boolean
  }>
  goals: Array<{
    id: string
    name: string
    target: number
    current: number
    progress: number
    needsAttention: boolean
  }>
}

/**
 * Recompute all dashboard KPIs and caches for a user
 */
export async function recomputeAll(userId: string): Promise<{
  success: boolean
  kpis?: DashboardKPIs
  budget?: BudgetSummary
  upcoming?: UpcomingItems
  error?: string
}> {
  try {
    const user = await getUserAndEnsure()
    if (!user || user.id !== userId) {
      return { success: false, error: 'User not found or unauthorized' }
    }

    const metadata = user.user_metadata || {}
    const currentMonth = getCurrentMonth()

    // Calculate KPIs
    const kpis = await calculateDashboardKPIs(metadata, currentMonth)
    const budget = await calculateBudgetSummary(metadata, currentMonth)
    const upcoming = await calculateUpcomingItems(metadata)

    // Cache the results
    const cacheData = {
      dashboard_kpis: kpis,
      budget_summary: budget,
      upcoming_items: upcoming,
      last_recompute: new Date().toISOString()
    }

    const result = await updateUserMetadata(cacheData)
    
    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, kpis, budget, upcoming }
  } catch (error) {
    console.error('Error in recomputeAll:', error)
    return { success: false, error: 'Failed to recompute data' }
  }
}

/**
 * Calculate dashboard KPIs
 */
async function calculateDashboardKPIs(metadata: any, currentMonth: string): Promise<DashboardKPIs> {
  const recurringIncome = metadata.recurring_income || []
  const oneOffIncome = metadata.one_off_income || []
  const transactions = metadata.transactions || []
  const budgetItems = metadata.budget_items || []
  const debts = metadata.debts || []
  const investments = metadata.investments || []

  // Monthly income from recurring sources
  const monthlyIncome = recurringIncome.reduce((total: number, income: any) => {
    if (!income.active) return total
    return total + toMonthlyAmount(income.amountCents / 100, income.schedule, 1)
  }, 0)

  // Add one-off income for current month
  const currentMonthOneOff = oneOffIncome
    .filter((income: any) => {
      const incomeDate = new Date(income.date)
      return `${incomeDate.getFullYear()}-${String(incomeDate.getMonth() + 1).padStart(2, '0')}` === currentMonth
    })
    .reduce((total: number, income: any) => total + (income.amountCents / 100), 0)

  const totalMonthlyIncome = monthlyIncome + currentMonthOneOff

  // Calculate assigned and spent totals
  const currentMonthBudgetItems = budgetItems.filter((item: any) => item.month === currentMonth)
  const totalAssigned = currentMonthBudgetItems.reduce((total: number, item: any) => {
    return total + parseFloat(item.assigned || 0)
  }, 0)

  // This month spent from transactions
  const currentMonthTransactions = transactions.filter((txn: any) => {
    const txnDate = new Date(txn.date)
    return `${txnDate.getFullYear()}-${String(txnDate.getMonth() + 1).padStart(2, '0')}` === currentMonth &&
           txn.type === 'EXPENSE'
  })
  
  const thisMonthSpent = currentMonthTransactions.reduce((total: number, txn: any) => {
    return total + Math.abs(txn.amountCents / 100)
  }, 0)

  // Ready to Assign
  const readyToAssign = totalMonthlyIncome - totalAssigned

  // Total debt
  const totalDebt = debts.reduce((total: number, debt: any) => {
    return total + (debt.balance || 0)
  }, 0)

  // Investment contributions (current month)
  const investmentContributions = currentMonthTransactions
    .filter((txn: any) => txn.type === 'INVESTMENT' || txn.categoryId?.includes('investment'))
    .reduce((total: number, txn: any) => total + Math.abs(txn.amountCents / 100), 0)

  // Savings rate
  const totalIncome = totalMonthlyIncome
  const totalExpenses = thisMonthSpent
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

  // Essentials percentage
  const essentialsSpent = currentMonthTransactions
    .filter((txn: any) => {
      const category = metadata.categories?.find((c: any) => c.id === txn.categoryId)
      return category?.groupName === 'Essentials' || category?.type === 'essential'
    })
    .reduce((total: number, txn: any) => total + Math.abs(txn.amountCents / 100), 0)
  
  const essentialsPercentage = thisMonthSpent > 0 ? (essentialsSpent / thisMonthSpent) * 100 : 0

  // Net cash flow
  const netCashFlow = totalIncome - totalExpenses

  return {
    monthlyIncome: totalMonthlyIncome,
    readyToAssign,
    thisMonthSpent,
    totalDebt,
    investmentContributions,
    savingsRate,
    essentialsPercentage,
    netCashFlow
  }
}

/**
 * Calculate budget summary for current month
 */
async function calculateBudgetSummary(metadata: any, currentMonth: string): Promise<BudgetSummary> {
  const budgetMonths = metadata.budget_months || []
  const budgetItems = metadata.budget_items || []
  const categories = metadata.categories || []
  const recurringIncome = metadata.recurring_income || []

  // Find current budget month
  const budgetMonth = budgetMonths.find((bm: any) => bm.month === currentMonth)
  const expectedIncome = budgetMonth?.expectedIncome || 0

  // Calculate monthly income if not set
  let calculatedIncome = expectedIncome
  if (calculatedIncome === 0) {
    calculatedIncome = recurringIncome.reduce((total: number, income: any) => {
      if (!income.active) return total
      return total + toMonthlyAmount(income.amountCents / 100, income.schedule, 1)
    }, 0)
  }

  // Get current month budget items
  const currentMonthItems = budgetItems.filter((item: any) => item.month === currentMonth)
  
  const totalAssigned = currentMonthItems.reduce((total: number, item: any) => {
    return total + parseFloat(item.assigned || 0)
  }, 0)

  const totalSpent = currentMonthItems.reduce((total: number, item: any) => {
    return total + parseFloat(item.spent || 0)
  }, 0)

  const readyToAssign = calculatedIncome - totalAssigned
  const isOverAllocated = readyToAssign < 0

  // Category details
  const categoryDetails = currentMonthItems.map((item: any) => {
    const category = categories.find((c: any) => c.id === item.categoryId)
    const assigned = parseFloat(item.assigned || 0)
    const spent = parseFloat(item.spent || 0)
    
    return {
      id: item.categoryId,
      name: category?.name || 'Unknown',
      assigned,
      spent,
      remaining: assigned - spent,
      rollover: category?.rollover || false,
      priority: category?.priority || 3
    }
  })

  return {
    expectedIncome: calculatedIncome,
    totalAssigned,
    totalSpent,
    readyToAssign,
    isOverAllocated,
    categories: categoryDetails
  }
}

/**
 * Calculate upcoming bills and goal nudges
 */
async function calculateUpcomingItems(metadata: any): Promise<UpcomingItems> {
  const bills = metadata.bills || []
  const goals = metadata.goals || []
  const today = new Date()

  // Upcoming bills (next 30 days)
  const upcomingBills = bills
    .filter((bill: any) => bill.active && bill.nextDue)
    .map((bill: any) => {
      const dueDate = new Date(bill.nextDue)
      const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      return {
        id: bill.id,
        name: bill.name,
        amount: parseFloat(bill.amount || 0),
        dueDate,
        daysUntil,
        isPastDue: daysUntil < 0
      }
    })
    .filter((bill: any) => bill.daysUntil <= 30) // Next 30 days
    .sort((a: any, b: any) => a.daysUntil - b.daysUntil)

  // Goals needing attention
  const goalNudges = goals.map((goal: any) => {
    const target = goal.target || 0
    const current = goal.saved || 0
    const progress = target > 0 ? (current / target) * 100 : 0
    
    // Check if goal needs attention (no contribution in 30 days, or notify flag set)
    const needsAttention = goal.notify && progress < 100 && (
      !goal.lastContribution || 
      (new Date().getTime() - new Date(goal.lastContribution).getTime()) > 30 * 24 * 60 * 60 * 1000
    )

    return {
      id: goal.id,
      name: goal.name,
      target,
      current,
      progress,
      needsAttention
    }
  })

  return {
    bills: upcomingBills,
    goals: goalNudges
  }
}

/**
 * Get current month string (YYYY-MM)
 */
function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Trigger recompute after data changes
 */
export async function triggerRecompute(userId: string, reason: string = 'data_change'): Promise<void> {
  try {
    console.log(`Triggering recompute for user ${userId}: ${reason}`)
    await recomputeAll(userId)
  } catch (error) {
    console.error('Error triggering recompute:', error)
  }
}
