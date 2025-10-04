import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { 
  selectMonthSummary,
  selectOverspends,
  selectTA
} from '@/lib/budget-v2-selectors'
import { getCurrentMonth } from '@/lib/types/budget-v2'

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
    
    // Get Budget v2 data
    const transactions = metadata.transactions_v2 || []
    const budgetEntries = metadata.budget_entries || []
    const categories = metadata.categories_v2 || []
    const accounts = metadata.accounts || []

    // Calculate month summary using selectors
    const monthSummary = selectMonthSummary(
      transactions,
      budgetEntries,
      categories,
      month
    )

    // Get overspends for quick action
    const overspends = selectOverspends(
      transactions,
      budgetEntries,
      categories,
      month
    )

    // Calculate additional metrics
    const totalBudgetedIncome = transactions
      .filter(txn => {
        const txnMonth = txn.date.substring(0, 7)
        return txnMonth === month && txn.type === 'inflow' && txn.inflow_to_budget === true
      })
      .reduce((sum, txn) => sum + Math.abs(txn.amount), 0)

    const budgetUtilization = totalBudgetedIncome > 0 
      ? (monthSummary.total_assigned / totalBudgetedIncome) * 100 
      : 0

    return NextResponse.json({
      month,
      userId: user.id,
      summary: monthSummary,
      overspends,
      metrics: {
        budget_utilization: budgetUtilization,
        unallocated_percentage: totalBudgetedIncome > 0 
          ? (monthSummary.to_allocate / totalBudgetedIncome) * 100 
          : 0,
        categories_count: categories.length,
        active_categories: monthSummary.categories.filter(cat => cat.assigned > 0).length
      }
    })

  } catch (error) {
    console.error('Error calculating budget v2 summary:', error)
    return NextResponse.json({ error: 'Failed to calculate budget summary' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { action, month, assignments } = await request.json()

    if (action === 'assign') {
      // Update budget assignments
      const metadata = user.user_metadata || {}
      const budgetEntries = metadata.budget_entries || []

      // Update or create budget entries
      const updatedEntries = [...budgetEntries]
      
      Object.entries(assignments).forEach(([categoryId, amount]: [string, any]) => {
        const existingIndex = updatedEntries.findIndex(entry => 
          entry.month_id === month && entry.category_id === categoryId
        )

        if (existingIndex >= 0) {
          updatedEntries[existingIndex] = {
            ...updatedEntries[existingIndex],
            assigned: amount
          }
        } else {
          updatedEntries.push({
            id: `entry_${Date.now()}_${categoryId}`,
            month_id: month,
            category_id: categoryId,
            assigned: amount
          })
        }
      })

      // Save to user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          ...metadata,
          budget_entries: updatedEntries
        }
      })

      if (updateError) {
        console.error('Failed to update budget assignments:', updateError)
        return NextResponse.json({ error: 'Failed to update assignments' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Budget assignments updated successfully'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error updating budget v2:', error)
    return NextResponse.json({ error: 'Failed to update budget' }, { status: 500 })
  }
}
