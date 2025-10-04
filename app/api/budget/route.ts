import { NextRequest, NextResponse } from 'next/server'
import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'
import { calcMonthSummary } from '@/lib/budget/calcs'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') || getCurrentMonth()

    const metadata = user.user_metadata || {}
    const budgetMonths = metadata.budget_months || []
    const budgetItems = metadata.budget_items || []
    const categories = metadata.categories || []
    const categoryGroups = metadata.category_groups || []
    const recurringIncome = metadata.recurring_income || []

    // Find or create budget month
    let budgetMonth = budgetMonths.find((bm: any) => bm.month === month)
    if (!budgetMonth) {
      // Calculate expected income from recurring sources
      const expectedIncome = recurringIncome.reduce((total: number, income: any) => {
        if (!income.active) return total
        return total + (income.amountCents / 100) // Convert cents to dollars
      }, 0)

      budgetMonth = {
        id: `budget_month_${Date.now()}`,
        userId: user.id,
        month,
        expectedIncome,
        allowOverAssign: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }

    // Get budget items for the month
    const monthBudgetItems = budgetItems.filter((item: any) => item.month === month)

    // Calculate summary
    const summary = calcMonthSummary(budgetMonth, monthBudgetItems, categories, categoryGroups)

    return NextResponse.json({
      success: true,
      budgetMonth,
      budgetItems: monthBudgetItems,
      categories,
      categoryGroups,
      summary
    })

  } catch (error) {
    console.error('Error fetching budget:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch budget'
    }, { status: 500 })
  }
}

const UpdateBudgetSchema = z.object({
  budgetMonth: z.object({
    expectedIncome: z.number(),
    allowOverAssign: z.boolean()
  }).optional(),
  budgetItems: z.array(z.object({
    id: z.string(),
    categoryId: z.string(),
    assigned: z.number(),
    spent: z.number().optional(),
    leftoverFromPrev: z.number().optional()
  })).optional()
})

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = UpdateBudgetSchema.parse(body)
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') || getCurrentMonth()

    const metadata = user.user_metadata || {}
    let budgetMonths = metadata.budget_months || []
    let budgetItems = metadata.budget_items || []

    // Update budget month if provided
    if (validatedData.budgetMonth) {
      const monthIndex = budgetMonths.findIndex((bm: any) => bm.month === month)
      if (monthIndex >= 0) {
        budgetMonths[monthIndex] = {
          ...budgetMonths[monthIndex],
          ...validatedData.budgetMonth,
          updatedAt: new Date().toISOString()
        }
      } else {
        // Create new budget month
        budgetMonths.push({
          id: `budget_month_${Date.now()}`,
          userId: user.id,
          month,
          ...validatedData.budgetMonth,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }
    }

    // Update budget items if provided
    if (validatedData.budgetItems) {
      for (const itemUpdate of validatedData.budgetItems) {
        const itemIndex = budgetItems.findIndex((item: any) => item.id === itemUpdate.id)
        if (itemIndex >= 0) {
          budgetItems[itemIndex] = {
            ...budgetItems[itemIndex],
            ...itemUpdate,
            updatedAt: new Date().toISOString()
          }
        } else {
          // Create new budget item
          budgetItems.push({
            id: itemUpdate.id || `budget_item_${Date.now()}_${itemUpdate.categoryId}`,
            userId: user.id,
            month,
            ...itemUpdate,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        }
      }
    }

    const result = await updateUserMetadata({
      ...metadata,
      budget_months: budgetMonths,
      budget_items: budgetItems
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Budget updated successfully'
    })

  } catch (error) {
    console.error('Error updating budget:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid budget data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to update budget'
    }, { status: 500 })
  }
}

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
