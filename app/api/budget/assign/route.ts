import { NextRequest, NextResponse } from 'next/server'
import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'
import { z } from 'zod'

const AssignBudgetSchema = z.object({
  categoryId: z.string(),
  month: z.string(),
  amount: z.number(),
  allowOverAssign: z.boolean().optional()
})

export async function POST(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = AssignBudgetSchema.parse(body)

    const metadata = user.user_metadata || {}
    let budgetItems = metadata.budget_items || []
    let budgetMonths = metadata.budget_months || []
    const recurringIncome = metadata.recurring_income || []
    const userPrefs = metadata.user_prefs || {}

    // Get or create budget month
    let budgetMonth = budgetMonths.find((bm: any) => bm.month === validatedData.month)
    if (!budgetMonth) {
      // Calculate expected income
      const expectedIncome = recurringIncome.reduce((total: number, income: any) => {
        if (!income.active) return total
        return total + (income.amountCents / 100)
      }, 0)

      budgetMonth = {
        id: `budget_month_${Date.now()}`,
        userId: user.id,
        month: validatedData.month,
        expectedIncome,
        allowOverAssign: userPrefs.softBudgetLimit || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      budgetMonths.push(budgetMonth)
    }

    // Calculate current assignments
    const currentMonthItems = budgetItems.filter((item: any) => item.month === validatedData.month)
    const totalAssigned = currentMonthItems.reduce((total: number, item: any) => {
      return total + parseFloat(item.assigned || 0)
    }, 0)

    // Calculate Ready to Assign
    const readyToAssign = budgetMonth.expectedIncome - totalAssigned + validatedData.amount

    // Check budget limits
    const isOverAssigning = readyToAssign < 0
    const allowOverAssign = validatedData.allowOverAssign ?? budgetMonth.allowOverAssign ?? userPrefs.softBudgetLimit

    if (isOverAssigning && !allowOverAssign) {
      return NextResponse.json({
        success: false,
        error: 'Budget over-allocation not allowed',
        details: {
          readyToAssign: budgetMonth.expectedIncome - totalAssigned,
          requestedAmount: validatedData.amount,
          wouldOverAssignBy: Math.abs(readyToAssign)
        }
      }, { status: 400 })
    }

    // Find or create budget item
    const existingItemIndex = budgetItems.findIndex(
      (item: any) => item.categoryId === validatedData.categoryId && item.month === validatedData.month
    )

    if (existingItemIndex >= 0) {
      // Update existing item
      budgetItems[existingItemIndex] = {
        ...budgetItems[existingItemIndex],
        assigned: validatedData.amount,
        updatedAt: new Date().toISOString()
      }
    } else {
      // Create new item
      budgetItems.push({
        id: `budget_item_${Date.now()}_${validatedData.categoryId}`,
        userId: user.id,
        month: validatedData.month,
        categoryId: validatedData.categoryId,
        assigned: validatedData.amount,
        spent: 0,
        leftoverFromPrev: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
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
      message: 'Budget assigned successfully',
      newReadyToAssign: readyToAssign,
      isOverAssigned: isOverAssigning
    })

  } catch (error) {
    console.error('Error assigning budget:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid assignment data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to assign budget'
    }, { status: 500 })
  }
}
