import { NextRequest, NextResponse } from 'next/server'
import { getUserAndEnsure } from '@/lib/ensureUser'
import { calculateTargetNeeds } from '@/lib/targets/engine'
import { getCurrentMonth, getPreviousMonth } from '@/lib/types/budget-v2'

export interface FinancialInsight {
  id: string
  type: 'savings_rate' | 'forecast_drift' | 'category_volatility' | 'unassigned_income' | 'due_soon_bills' | 'goal_milestone' | 'overspending_pattern'
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
  actionable: boolean
  quickActions: QuickAction[]
  data?: any
}

export interface QuickAction {
  id: string
  label: string
  type: 'fund' | 'reassign' | 'snooze' | 'create_goal' | 'navigate'
  params?: any
  icon?: string
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const metadata = user.user_metadata || {}
    const currentMonth = getCurrentMonth()

    // Generate insights
    const insights = await generateFinancialInsights(metadata, currentMonth)

    // Sort by severity and actionability
    const sortedInsights = insights.sort((a, b) => {
      const severityScore = { critical: 3, warning: 2, info: 1 }
      const actionableScore = (insight: FinancialInsight) => insight.actionable ? 1 : 0
      
      const scoreA = severityScore[a.severity] * 10 + actionableScore(a)
      const scoreB = severityScore[b.severity] * 10 + actionableScore(b)
      
      return scoreB - scoreA
    })

    // Return top 3 insights
    const topInsights = sortedInsights.slice(0, 3)

    return NextResponse.json({
      success: true,
      insights: topInsights,
      totalInsights: insights.length,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating insights:', error)
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    )
  }
}

async function generateFinancialInsights(metadata: any, currentMonth: string): Promise<FinancialInsight[]> {
  const insights: FinancialInsight[] = []
  
  const budgetItems = metadata.budget_items || []
  const categories = metadata.categories || []
  const transactions = metadata.transactions_v2 || []
  const bills = metadata.bills || []
  const goals = metadata.goals_v2 || []
  const recurringIncome = metadata.recurring_income || []

  // 1. Savings Rate Analysis
  const savingsRateInsight = analyzeSavingsRate(transactions, currentMonth)
  if (savingsRateInsight) insights.push(savingsRateInsight)

  // 2. Forecast Drift Analysis
  const forecastDriftInsight = analyzeForecastDrift(budgetItems, transactions, currentMonth)
  if (forecastDriftInsight) insights.push(forecastDriftInsight)

  // 3. Category Volatility Analysis
  const volatilityInsight = analyzeCategoryVolatility(transactions, categories, currentMonth)
  if (volatilityInsight) insights.push(volatilityInsight)

  // 4. Unassigned Income Analysis
  const unassignedIncomeInsight = analyzeUnassignedIncome(budgetItems, recurringIncome, currentMonth)
  if (unassignedIncomeInsight) insights.push(unassignedIncomeInsight)

  // 5. Due Soon Bills Analysis
  const dueSoonBillsInsight = analyzeDueSoonBills(bills)
  if (dueSoonBillsInsight) insights.push(dueSoonBillsInsight)

  // 6. Goal Milestone Analysis
  const goalMilestoneInsight = analyzeGoalMilestones(goals)
  if (goalMilestoneInsight) insights.push(goalMilestoneInsight)

  // 7. Overspending Pattern Analysis
  const overspendingInsight = analyzeOverspendingPatterns(budgetItems, transactions, currentMonth)
  if (overspendingInsight) insights.push(overspendingInsight)

  return insights
}

function analyzeSavingsRate(transactions: any[], currentMonth: string): FinancialInsight | null {
  const monthTransactions = transactions.filter((txn: any) => txn.budgetMonth === currentMonth)
  
  const income = monthTransactions
    .filter((txn: any) => txn.type === 'inflow')
    .reduce((sum: number, txn: any) => sum + txn.amount, 0)
  
  const savings = monthTransactions
    .filter((txn: any) => 
      txn.type === 'outflow' && 
      (txn.categoryId?.includes('savings') || txn.categoryId?.includes('goal'))
    )
    .reduce((sum: number, txn: any) => sum + Math.abs(txn.amount), 0)

  const savingsRate = income > 0 ? (savings / income) * 100 : 0

  if (savingsRate < 10) {
    return {
      id: 'low_savings_rate',
      type: 'savings_rate',
      title: 'Low Savings Rate',
      description: `Your current savings rate is ${savingsRate.toFixed(1)}%. Financial experts recommend 20%+.`,
      severity: savingsRate < 5 ? 'critical' : 'warning',
      actionable: true,
      quickActions: [
        {
          id: 'create_savings_goal',
          label: 'Create Savings Goal',
          type: 'create_goal',
          params: { type: 'emergency_fund' },
          icon: 'PiggyBank'
        },
        {
          id: 'review_expenses',
          label: 'Review Expenses',
          type: 'navigate',
          params: { route: '/transactions' },
          icon: 'BarChart3'
        }
      ],
      data: { currentRate: savingsRate, targetRate: 20, income, savings }
    }
  }

  return null
}

function analyzeForecastDrift(budgetItems: any[], transactions: any[], currentMonth: string): FinancialInsight | null {
  // Compare planned vs actual spending for current month
  const currentMonthItems = budgetItems.filter((item: any) => item.month === currentMonth)
  const currentMonthTransactions = transactions.filter((txn: any) => 
    txn.budgetMonth === currentMonth && txn.type === 'outflow'
  )

  let totalPlanned = 0
  let totalActual = 0
  let categoriesOverBudget = 0

  for (const item of currentMonthItems) {
    const planned = parseFloat(item.assigned) || 0
    const actual = currentMonthTransactions
      .filter((txn: any) => txn.categoryId === item.categoryId)
      .reduce((sum: number, txn: any) => sum + Math.abs(txn.amount), 0)

    totalPlanned += planned
    totalActual += actual

    if (actual > planned * 1.1) { // 10% over budget
      categoriesOverBudget++
    }
  }

  const driftPercentage = totalPlanned > 0 ? ((totalActual - totalPlanned) / totalPlanned) * 100 : 0

  if (Math.abs(driftPercentage) > 15 || categoriesOverBudget > 2) {
    return {
      id: 'forecast_drift',
      type: 'forecast_drift',
      title: 'Budget vs Actual Drift',
      description: `Your spending is ${driftPercentage > 0 ? 'over' : 'under'} budget by ${Math.abs(driftPercentage).toFixed(1)}%. ${categoriesOverBudget} categories are significantly over budget.`,
      severity: Math.abs(driftPercentage) > 25 ? 'critical' : 'warning',
      actionable: true,
      quickActions: [
        {
          id: 'rebalance_budget',
          label: 'Rebalance Budget',
          type: 'reassign',
          params: { month: currentMonth },
          icon: 'ArrowLeftRight'
        },
        {
          id: 'review_forecast',
          label: 'Review Forecast',
          type: 'navigate',
          params: { route: '/forecast' },
          icon: 'Calendar'
        }
      ],
      data: { driftPercentage, categoriesOverBudget, totalPlanned, totalActual }
    }
  }

  return null
}

function analyzeCategoryVolatility(transactions: any[], categories: any[], currentMonth: string): FinancialInsight | null {
  // Find categories with high spending volatility
  const volatileCategories: Array<{ name: string; volatility: number; categoryId: string }> = []

  for (const category of categories) {
    const last3Months = [
      getPreviousMonth(getPreviousMonth(currentMonth)),
      getPreviousMonth(currentMonth),
      currentMonth
    ]

    const monthlySpending = last3Months.map(month => {
      return transactions
        .filter((txn: any) => 
          txn.categoryId === category.id && 
          txn.budgetMonth === month &&
          txn.type === 'outflow'
        )
        .reduce((sum: number, txn: any) => sum + Math.abs(txn.amount), 0)
    })

    if (monthlySpending.length >= 2) {
      const mean = monthlySpending.reduce((sum, val) => sum + val, 0) / monthlySpending.length
      const variance = monthlySpending.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / monthlySpending.length
      const volatility = mean > 0 ? Math.sqrt(variance) / mean : 0

      if (volatility > 0.5 && mean > 50) { // High volatility and significant spending
        volatileCategories.push({
          name: category.name,
          volatility,
          categoryId: category.id
        })
      }
    }
  }

  if (volatileCategories.length > 0) {
    const mostVolatile = volatileCategories.sort((a, b) => b.volatility - a.volatility)[0]
    
    return {
      id: 'category_volatility',
      type: 'category_volatility',
      title: 'Volatile Spending Detected',
      description: `${mostVolatile.name} has highly variable spending (${(mostVolatile.volatility * 100).toFixed(0)}% volatility). Consider adjusting your budget or setting up automatic transfers.`,
      severity: 'warning',
      actionable: true,
      quickActions: [
        {
          id: 'adjust_category_budget',
          label: 'Adjust Budget',
          type: 'fund',
          params: { categoryId: mostVolatile.categoryId },
          icon: 'DollarSign'
        },
        {
          id: 'review_transactions',
          label: 'Review Transactions',
          type: 'navigate',
          params: { route: `/transactions?category=${mostVolatile.categoryId}` },
          icon: 'List'
        }
      ],
      data: { volatileCategories }
    }
  }

  return null
}

function analyzeUnassignedIncome(budgetItems: any[], recurringIncome: any[], currentMonth: string): FinancialInsight | null {
  const expectedIncome = recurringIncome.reduce((total: number, income: any) => {
    if (!income.active) return total
    return total + (income.amountCents / 100)
  }, 0)

  const currentMonthItems = budgetItems.filter((item: any) => item.month === currentMonth)
  const totalAssigned = currentMonthItems.reduce((sum: number, item: any) => 
    sum + (parseFloat(item.assigned) || 0), 0)

  const unassigned = expectedIncome - totalAssigned

  if (unassigned > 50) { // More than $50 unassigned
    return {
      id: 'unassigned_income',
      type: 'unassigned_income',
      title: 'Unassigned Income',
      description: `You have ${formatCurrency(unassigned)} in Ready to Assign that hasn't been allocated to categories yet.`,
      severity: unassigned > 500 ? 'warning' : 'info',
      actionable: true,
      quickActions: [
        {
          id: 'auto_assign',
          label: 'Auto-Assign',
          type: 'fund',
          params: { amount: unassigned },
          icon: 'Zap'
        },
        {
          id: 'manual_assign',
          label: 'Manual Assign',
          type: 'navigate',
          params: { route: '/budget' },
          icon: 'Wallet'
        }
      ],
      data: { unassigned, expectedIncome, totalAssigned }
    }
  }

  return null
}

function analyzeDueSoonBills(bills: any[]): FinancialInsight | null {
  const now = new Date()
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const dueSoonBills = bills.filter((bill: any) => {
    if (bill.isPaid) return false
    const dueDate = new Date(bill.dueDate)
    return dueDate >= now && dueDate <= sevenDaysFromNow
  })

  const urgentBills = dueSoonBills.filter((bill: any) => {
    const dueDate = new Date(bill.dueDate)
    return dueDate <= threeDaysFromNow
  })

  if (dueSoonBills.length > 0) {
    const totalAmount = dueSoonBills.reduce((sum: number, bill: any) => sum + bill.amount, 0)
    
    return {
      id: 'due_soon_bills',
      type: 'due_soon_bills',
      title: urgentBills.length > 0 ? 'Urgent Bills Due' : 'Bills Due Soon',
      description: `${dueSoonBills.length} bills totaling ${formatCurrency(totalAmount)} are due within ${urgentBills.length > 0 ? '3' : '7'} days.`,
      severity: urgentBills.length > 0 ? 'critical' : 'warning',
      actionable: true,
      quickActions: [
        {
          id: 'pay_bills',
          label: 'Pay Bills',
          type: 'navigate',
          params: { route: '/bills' },
          icon: 'CreditCard'
        },
        {
          id: 'fund_bill_categories',
          label: 'Fund Categories',
          type: 'fund',
          params: { bills: dueSoonBills },
          icon: 'DollarSign'
        }
      ],
      data: { dueSoonBills, urgentBills, totalAmount }
    }
  }

  return null
}

function analyzeGoalMilestones(goals: any[]): FinancialInsight | null {
  const activeGoals = goals.filter((goal: any) => goal.status === 'ACTIVE')
  
  const nearMilestoneGoals = activeGoals.filter((goal: any) => {
    const contributions = goal.contributions || []
    const totalContributed = contributions.reduce((sum: number, c: any) => sum + c.amount, 0)
    const progress = goal.targetAmount > 0 ? (totalContributed / goal.targetAmount) * 100 : 0
    
    // Check if close to 25%, 50%, 75%, or 100% milestones
    const milestones = [25, 50, 75, 100]
    return milestones.some(milestone => 
      progress >= milestone - 5 && progress < milestone
    )
  })

  if (nearMilestoneGoals.length > 0) {
    const goal = nearMilestoneGoals[0]
    const contributions = goal.contributions || []
    const totalContributed = contributions.reduce((sum: number, c: any) => sum + c.amount, 0)
    const progress = goal.targetAmount > 0 ? (totalContributed / goal.targetAmount) * 100 : 0
    
    const nextMilestone = [25, 50, 75, 100].find(m => progress < m) || 100
    const amountNeeded = (goal.targetAmount * (nextMilestone / 100)) - totalContributed

    return {
      id: 'goal_milestone',
      type: 'goal_milestone',
      title: 'Goal Milestone Within Reach',
      description: `${goal.name} is ${progress.toFixed(1)}% complete. You're ${formatCurrency(amountNeeded)} away from the ${nextMilestone}% milestone!`,
      severity: 'info',
      actionable: true,
      quickActions: [
        {
          id: 'contribute_to_goal',
          label: `Add ${formatCurrency(amountNeeded)}`,
          type: 'fund',
          params: { goalId: goal.id, amount: amountNeeded },
          icon: 'Target'
        },
        {
          id: 'view_goal_details',
          label: 'View Goal',
          type: 'navigate',
          params: { route: `/goals?goal=${goal.id}` },
          icon: 'ExternalLink'
        }
      ],
      data: { goal, progress, nextMilestone, amountNeeded }
    }
  }

  return null
}

function analyzeOverspendingPatterns(budgetItems: any[], transactions: any[], currentMonth: string): FinancialInsight | null {
  const last3Months = [
    getPreviousMonth(getPreviousMonth(currentMonth)),
    getPreviousMonth(currentMonth),
    currentMonth
  ]

  const consistentOverspenders: Array<{ categoryId: string; name: string; avgOverspend: number }> = []

  // Get unique categories
  const categoryIds = Array.from(new Set(budgetItems.map((item: any) => item.categoryId)))

  for (const categoryId of categoryIds) {
    const monthlyOverspends = last3Months.map(month => {
      const budgetItem = budgetItems.find((item: any) => 
        item.categoryId === categoryId && item.month === month
      )
      
      const spent = transactions
        .filter((txn: any) => 
          txn.categoryId === categoryId && 
          txn.budgetMonth === month &&
          txn.type === 'outflow'
        )
        .reduce((sum: number, txn: any) => sum + Math.abs(txn.amount), 0)

      const assigned = budgetItem ? parseFloat(budgetItem.assigned) || 0 : 0
      return Math.max(0, spent - assigned)
    })

    const overspendMonths = monthlyOverspends.filter(overspend => overspend > 0).length
    const avgOverspend = monthlyOverspends.reduce((sum, val) => sum + val, 0) / monthlyOverspends.length

    if (overspendMonths >= 2 && avgOverspend > 25) { // Consistent overspending
      const category = budgetItems.find((item: any) => item.categoryId === categoryId)
      consistentOverspenders.push({
        categoryId,
        name: category?.categoryName || 'Unknown Category',
        avgOverspend
      })
    }
  }

  if (consistentOverspenders.length > 0) {
    const topOverspender = consistentOverspenders.sort((a, b) => b.avgOverspend - a.avgOverspend)[0]
    
    return {
      id: 'overspending_pattern',
      type: 'overspending_pattern',
      title: 'Consistent Overspending Detected',
      description: `${topOverspender.name} has been over budget for multiple months (avg: ${formatCurrency(topOverspender.avgOverspend)} over). Consider increasing the budget or reviewing spending habits.`,
      severity: 'warning',
      actionable: true,
      quickActions: [
        {
          id: 'increase_budget',
          label: 'Increase Budget',
          type: 'fund',
          params: { categoryId: topOverspender.categoryId, amount: topOverspender.avgOverspend },
          icon: 'TrendingUp'
        },
        {
          id: 'review_spending',
          label: 'Review Spending',
          type: 'navigate',
          params: { route: `/transactions?category=${topOverspender.categoryId}` },
          icon: 'Search'
        }
      ],
      data: { consistentOverspenders, topOverspender }
    }
  }

  return null
}

// Helper function
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}
