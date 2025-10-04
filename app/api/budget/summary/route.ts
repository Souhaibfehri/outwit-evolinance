import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { calculateRTA, validateBudgetAllocation, projectNextMonth } from '@/lib/budget-math'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') || getCurrentMonth()

    const metadata = user.user_metadata || {}
    
    // Get user's financial data
    const categories = metadata.categories || []
    const budgetItems = metadata.budget_items || []
    const budgetMonths = metadata.budget_months || []
    const recurringIncome = metadata.recurring_income || []
    const transactions = metadata.transactions || []

    // Find budget month
    const budgetMonth = budgetMonths.find((bm: any) => bm.month === month)
    const expectedIncome = budgetMonth?.expectedIncome || 0

    // Calculate income for this month
    const monthlyIncome = recurringIncome
      .filter((inc: any) => inc.active)
      .reduce((sum: number, inc: any) => {
        // Convert frequency to monthly amount
        const multiplier = getFrequencyMultiplier(inc.frequency)
        return sum + (inc.amount * multiplier)
      }, 0)

    // Add one-off income for this month
    const oneOffIncome = transactions
      .filter((txn: any) => 
        txn.type === 'income' && 
        txn.budgetMonth === month
      )
      .reduce((sum: number, txn: any) => sum + Math.abs(txn.amount), 0)

    const totalIncome = monthlyIncome + oneOffIncome

    // Calculate category assignments and spending
    const categoryBudgets = categories.map((cat: any) => {
      const budgetItem = budgetItems.find(
        (bi: any) => bi.categoryId === cat.id && bi.month === month
      )
      
      const spentAmount = transactions
        .filter((txn: any) => 
          txn.categoryId === cat.id && 
          txn.budgetMonth === month &&
          txn.type === 'expense'
        )
        .reduce((sum: number, txn: any) => sum + Math.abs(txn.amount), 0)

      return {
        id: cat.id,
        name: cat.name,
        groupId: cat.groupId,
        plannedAmount: budgetItem?.assigned || 0,
        spentAmount,
        rolloverEnabled: cat.rollover || false,
        rolloverFromPrior: budgetItem?.leftoverFromPrev || 0
      }
    })

    // Calculate RTA using the proper formula
    const totalAssigned = categoryBudgets.reduce((sum, cat) => sum + cat.plannedAmount, 0)
    const rolloverEffect = categoryBudgets.reduce((sum, cat) => sum + cat.rolloverFromPrior, 0)
    const readyToAssign = totalIncome - totalAssigned + rolloverEffect

    // Calculate totals
    const totalSpent = categoryBudgets.reduce((sum, cat) => sum + cat.spentAmount, 0)
    const budgetUtilization = totalIncome > 0 ? (totalAssigned / totalIncome) * 100 : 0

    // Validation
    const validation = validateBudgetAllocation(totalIncome, totalAssigned, rolloverEffect)

    // Project next month
    const nextMonth = getNextMonth(month)
    const nextMonthProjection = projectNextMonth(categoryBudgets)

    return NextResponse.json({
      month,
      userId: user.id,
      summary: {
        totalIncome,
        monthlyIncome,
        oneOffIncome,
        totalAssigned,
        totalSpent,
        readyToAssign,
        budgetUtilization,
        rolloverEffect
      },
      categories: categoryBudgets,
      validation,
      nextMonth: {
        month: nextMonth,
        projectedCategories: nextMonthProjection
      }
    })

  } catch (error) {
    console.error('Error calculating budget summary:', error)
    return NextResponse.json({ error: 'Failed to calculate budget summary' }, { status: 500 })
  }
}

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getNextMonth(month: string): string {
  const [year, monthNum] = month.split('-').map(Number)
  const date = new Date(year, monthNum, 1) // monthNum is 1-based for Date constructor
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getFrequencyMultiplier(frequency: string): number {
  switch (frequency) {
    case 'weekly': return 4.33
    case 'biweekly': return 2.17
    case 'semimonthly': return 2
    case 'monthly': return 1
    case 'quarterly': return 1/3
    case 'annual': return 1/12
    default: return 1
  }
}
