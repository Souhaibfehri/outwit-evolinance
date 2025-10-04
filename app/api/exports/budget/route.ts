import { NextRequest, NextResponse } from 'next/server'
import { getUserAndEnsure } from '@/lib/ensureUser'
import { toCSV, CSV_COLUMNS } from '@/lib/csv'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const month = searchParams.get('month') || getCurrentMonth()

    const metadata = user.user_metadata || {}
    const budgetMonths = metadata.budget_months || []
    const budgetItems = metadata.budget_items || []
    const categories = metadata.categories || []
    const categoryGroups = metadata.category_groups || []

    // Get budget data for the specified month
    const budgetMonth = budgetMonths.find((bm: any) => bm.month === month)
    const monthBudgetItems = budgetItems.filter((item: any) => item.month === month)

    // Enrich budget items with category and group information
    const enrichedBudgetItems = monthBudgetItems.map((item: any) => {
      const category = categories.find((cat: any) => cat.id === item.categoryId)
      const group = categoryGroups.find((grp: any) => grp.id === category?.groupId)
      
      return {
        month: item.month,
        categoryName: category?.name || 'Unknown Category',
        groupName: group?.name || 'Ungrouped',
        assigned: parseFloat(item.assigned || 0),
        spent: parseFloat(item.spent || 0),
        remaining: parseFloat(item.assigned || 0) - parseFloat(item.spent || 0),
        leftoverFromPrev: parseFloat(item.leftoverFromPrev || 0),
        rollover: category?.rollover || false,
        priority: category?.priority || 3
      }
    })

    // Add summary row
    const summary = {
      month: month,
      categoryName: 'TOTAL',
      groupName: 'Summary',
      assigned: enrichedBudgetItems.reduce((sum, item) => sum + item.assigned, 0),
      spent: enrichedBudgetItems.reduce((sum, item) => sum + item.spent, 0),
      remaining: enrichedBudgetItems.reduce((sum, item) => sum + item.remaining, 0),
      leftoverFromPrev: enrichedBudgetItems.reduce((sum, item) => sum + item.leftoverFromPrev, 0),
      rollover: false,
      priority: 0
    }

    const allBudgetData = [...enrichedBudgetItems, summary]

    if (format === 'csv') {
      const budgetColumns = [
        { key: 'month', label: 'Month' },
        { key: 'groupName', label: 'Group' },
        { key: 'categoryName', label: 'Category' },
        { key: 'assigned', label: 'Assigned', transform: (val: number) => `$${val.toFixed(2)}` },
        { key: 'spent', label: 'Spent', transform: (val: number) => `$${val.toFixed(2)}` },
        { key: 'remaining', label: 'Remaining', transform: (val: number) => `$${val.toFixed(2)}` },
        { key: 'leftoverFromPrev', label: 'Rollover', transform: (val: number) => `$${val.toFixed(2)}` },
        { key: 'priority', label: 'Priority' },
        { key: 'rollover', label: 'Rollover Enabled', transform: (val: boolean) => val ? 'Yes' : 'No' }
      ]

      const csvContent = toCSV(allBudgetData, budgetColumns)
      
      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="budget-${month}.csv"`
        }
      })
    } else if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: {
          budgetMonth,
          budgetItems: enrichedBudgetItems,
          summary: {
            expectedIncome: budgetMonth?.expectedIncome || 0,
            totalAssigned: summary.assigned,
            totalSpent: summary.spent,
            readyToAssign: (budgetMonth?.expectedIncome || 0) - summary.assigned
          }
        },
        month
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Unsupported format'
    }, { status: 400 })

  } catch (error) {
    console.error('Error exporting budget:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to export budget'
    }, { status: 500 })
  }
}

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
