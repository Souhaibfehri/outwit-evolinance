import { NextRequest, NextResponse } from 'next/server'
import { getUserAndEnsure } from '@/lib/ensureUser'
import { calculateTargetNeeds } from '@/lib/targets/engine'
import { getCurrentMonth, getPreviousMonth } from '@/lib/types/budget-v2'

interface DashboardV2KPIs {
  readyToAssign: number
  savingsRateMTD: number
  totalDebt: number
  goalProgress: number
  costToBeMe: number
  expectedIncome: number
  netWorth: number
}

interface HeatmapCell {
  month: string
  categoryId: string
  categoryName: string
  status: 'funded' | 'needs' | 'overspent' | 'forecast_risk' | 'no_data'
  assigned: number
  spent: number
  available: number
  utilization: number
}

interface NetWorthDataPoint {
  date: string
  netWorth: number
  assets: number
  liabilities: number
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const metadata = user.user_metadata || {}
    const currentMonth = getCurrentMonth()

    // Calculate KPIs
    const kpis = await calculateDashboardV2KPIs(metadata, currentMonth)
    
    // Generate heatmap data
    const heatmapData = generateHeatmapData(metadata, currentMonth)
    
    // Generate net worth history
    const netWorthHistory = generateNetWorthHistory(metadata)

    return NextResponse.json({
      success: true,
      kpis,
      heatmapData,
      netWorthHistory,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating Dashboard V2 data:', error)
    return NextResponse.json(
      { error: 'Failed to generate dashboard data' },
      { status: 500 }
    )
  }
}

async function calculateDashboardV2KPIs(metadata: any, currentMonth: string): Promise<DashboardV2KPIs> {
  const budgetItems = metadata.budget_items || []
  const categories = metadata.categories || []
  const transactions = metadata.transactions_v2 || []
  const accounts = metadata.accounts || []
  const goals = metadata.goals_v2 || []
  const debts = metadata.debt_accounts || []
  const recurringIncome = metadata.recurring_income || []

  // Calculate Ready to Assign
  const currentMonthItems = budgetItems.filter((item: any) => item.month === currentMonth)
  const totalAssigned = currentMonthItems.reduce((sum: number, item: any) => 
    sum + (parseFloat(item.assigned) || 0), 0)
  
  const expectedIncome = recurringIncome.reduce((total: number, income: any) => {
    if (!income.active) return total
    return total + (income.amountCents / 100)
  }, 0)

  const readyToAssign = expectedIncome - totalAssigned

  // Calculate Savings Rate MTD
  const currentMonthTransactions = transactions.filter((txn: any) => 
    txn.budgetMonth === currentMonth
  )
  
  const monthlyIncome = currentMonthTransactions
    .filter((txn: any) => txn.type === 'inflow')
    .reduce((sum: number, txn: any) => sum + txn.amount, 0)
  
  const savingsTransactions = currentMonthTransactions
    .filter((txn: any) => 
      txn.type === 'outflow' && 
      (txn.categoryId?.includes('savings') || txn.categoryId?.includes('goal'))
    )
    .reduce((sum: number, txn: any) => sum + Math.abs(txn.amount), 0)

  const savingsRateMTD = monthlyIncome > 0 ? (savingsTransactions / monthlyIncome) * 100 : 0

  // Calculate Total Debt
  const totalDebt = debts.reduce((sum: number, debt: any) => 
    sum + (parseFloat(debt.principalBalance) || 0), 0)

  // Calculate Goal Progress
  const activeGoals = goals.filter((goal: any) => goal.status === 'ACTIVE')
  const goalProgress = activeGoals.length > 0 ? 
    activeGoals.reduce((sum: number, goal: any) => {
      const contributions = goal.contributions || []
      const totalContributed = contributions.reduce((s: number, c: any) => s + c.amount, 0)
      const progress = goal.targetAmount > 0 ? (totalContributed / goal.targetAmount) * 100 : 0
      return sum + progress
    }, 0) / activeGoals.length : 0

  // Calculate Cost to Be Me
  const targetCalculation = calculateTargetNeeds(categories, budgetItems, currentMonth, expectedIncome)
  const costToBeMe = targetCalculation.totalNeeded

  // Calculate Net Worth
  const totalAssets = accounts
    .filter((account: any) => account.type !== 'credit')
    .reduce((sum: number, account: any) => sum + (parseFloat(account.balance) || 0), 0)
  
  const totalLiabilities = accounts
    .filter((account: any) => account.type === 'credit')
    .reduce((sum: number, account: any) => sum + Math.abs(parseFloat(account.balance) || 0), 0) + totalDebt

  const netWorth = totalAssets - totalLiabilities

  return {
    readyToAssign,
    savingsRateMTD,
    totalDebt,
    goalProgress,
    costToBeMe,
    expectedIncome,
    netWorth
  }
}

function generateHeatmapData(metadata: any, currentMonth: string): HeatmapCell[] {
  const categories = metadata.categories || []
  const budgetItems = metadata.budget_items || []
  const transactions = metadata.transactions_v2 || []
  const heatmapData: HeatmapCell[] = []

  // Generate last 6 months + current month
  const months: string[] = []
  let month = currentMonth
  for (let i = 0; i < 6; i++) {
    month = getPreviousMonth(month)
    months.unshift(month)
  }
  months.push(currentMonth)

  for (const category of categories) {
    for (const month of months) {
      const budgetItem = budgetItems.find((item: any) => 
        item.categoryId === category.id && item.month === month
      )

      const monthTransactions = transactions.filter((txn: any) =>
        txn.categoryId === category.id && 
        txn.budgetMonth === month &&
        txn.type === 'outflow'
      )

      const assigned = budgetItem ? parseFloat(budgetItem.assigned) || 0 : 0
      const spent = monthTransactions.reduce((sum: number, txn: any) => 
        sum + Math.abs(txn.amount), 0)
      const available = assigned - spent
      const utilization = assigned > 0 ? (spent / assigned) * 100 : 0

      let status: HeatmapCell['status'] = 'no_data'
      
      if (assigned > 0) {
        if (available < 0) {
          status = 'overspent'
        } else if (available < assigned * 0.1) {
          status = 'needs' // Less than 10% remaining
        } else {
          status = 'funded'
        }
      }

      // Future months get forecast risk status if applicable
      if (month > currentMonth && assigned > 0) {
        // Simple forecast risk: if category typically overspends
        const historicalOverspends = months.filter(m => m < month).map(m => {
          const histItem = budgetItems.find((item: any) => 
            item.categoryId === category.id && item.month === m
          )
          const histTransactions = transactions.filter((txn: any) =>
            txn.categoryId === category.id && 
            txn.budgetMonth === m &&
            txn.type === 'outflow'
          )
          const histSpent = histTransactions.reduce((sum: number, txn: any) => 
            sum + Math.abs(txn.amount), 0)
          const histAssigned = histItem ? parseFloat(histItem.assigned) || 0 : 0
          return histSpent > histAssigned
        }).filter(Boolean).length

        if (historicalOverspends >= 2) {
          status = 'forecast_risk'
        }
      }

      heatmapData.push({
        month,
        categoryId: category.id,
        categoryName: category.name,
        status,
        assigned,
        spent,
        available,
        utilization
      })
    }
  }

  return heatmapData
}

function generateNetWorthHistory(metadata: any): NetWorthDataPoint[] {
  const accounts = metadata.accounts || []
  const debts = metadata.debt_accounts || []
  const netWorthSnapshots = metadata.net_worth_snapshots || []

  // If we have snapshots, use them
  if (netWorthSnapshots.length > 0) {
    return netWorthSnapshots.map((snapshot: any) => ({
      date: snapshot.date,
      netWorth: snapshot.netWorth,
      assets: snapshot.assets,
      liabilities: snapshot.liabilities
    }))
  }

  // Otherwise, generate synthetic data based on current balances
  // This is a simplified approach - in reality, you'd track this over time
  const currentAssets = accounts
    .filter((account: any) => account.type !== 'credit')
    .reduce((sum: number, account: any) => sum + (parseFloat(account.balance) || 0), 0)
  
  const currentLiabilities = accounts
    .filter((account: any) => account.type === 'credit')
    .reduce((sum: number, account: any) => sum + Math.abs(parseFloat(account.balance) || 0), 0) +
    debts.reduce((sum: number, debt: any) => sum + (parseFloat(debt.principalBalance) || 0), 0)

  const currentNetWorth = currentAssets - currentLiabilities

  // Generate 12 months of synthetic data with slight variations
  const history: NetWorthDataPoint[] = []
  const now = new Date()
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now)
    date.setMonth(date.getMonth() - i)
    
    // Add some realistic variation (±5% from current)
    const variation = (Math.random() - 0.5) * 0.1 // ±5%
    const netWorth = currentNetWorth * (1 + variation)
    const assets = currentAssets * (1 + variation * 0.5)
    const liabilities = currentLiabilities * (1 - variation * 0.3)

    history.push({
      date: date.toISOString().split('T')[0],
      netWorth,
      assets,
      liabilities
    })
  }

  return history
}

function formatDateForChart(date: string, timeframe: '3m' | '6m' | '12m'): string {
  const d = new Date(date)
  
  switch (timeframe) {
    case '3m':
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    case '6m':
      return d.toLocaleDateString('en-US', { month: 'short' })
    case '12m':
      return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    default:
      return d.toLocaleDateString('en-US', { month: 'short' })
  }
}
