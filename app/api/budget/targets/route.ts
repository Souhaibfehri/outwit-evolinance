import { NextRequest, NextResponse } from 'next/server'
import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'
import { calculateTargetNeeds } from '@/lib/targets/engine'
import { z } from 'zod'

const UpdateTargetSchema = z.object({
  categoryId: z.string(),
  targetEnabled: z.boolean(),
  targetType: z.enum(['refill_up_to', 'set_aside_another', 'have_balance_by', 'none']).optional(),
  targetAmount: z.number().optional(),
  targetDate: z.string().optional(), // ISO date string
  targetCadence: z.enum(['monthly', 'yearly', 'custom']).optional(),
  snoozedUntil: z.string().optional() // ISO date string
})

// Get target calculations for current month
export async function GET(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') || getCurrentMonth()

    const metadata = user.user_metadata || {}
    const categories = metadata.categories || []
    const budgetItems = metadata.budget_items || []
    const recurringIncome = metadata.recurring_income || []

    // Calculate expected income
    const expectedIncome = recurringIncome.reduce((total: number, income: any) => {
      if (!income.active) return total
      return total + (income.amountCents / 100)
    }, 0)

    // Calculate target needs
    const calculation = calculateTargetNeeds(categories, budgetItems, month, expectedIncome)

    return NextResponse.json({
      success: true,
      month,
      calculation,
      expectedIncome
    })

  } catch (error) {
    console.error('Error calculating targets:', error)
    return NextResponse.json(
      { error: 'Failed to calculate targets' },
      { status: 500 }
    )
  }
}

// Update category target
export async function POST(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = UpdateTargetSchema.parse(body)

    const metadata = user.user_metadata || {}
    const categories = metadata.categories || []

    // Find and update the category
    const categoryIndex = categories.findIndex((cat: any) => cat.id === validatedData.categoryId)
    if (categoryIndex === -1) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Update category with target data
    categories[categoryIndex] = {
      ...categories[categoryIndex],
      targetEnabled: validatedData.targetEnabled,
      targetType: validatedData.targetType || 'none',
      targetAmount: validatedData.targetAmount || 0,
      targetDate: validatedData.targetDate,
      targetCadence: validatedData.targetCadence || 'monthly',
      snoozedUntil: validatedData.snoozedUntil,
      updatedAt: new Date().toISOString()
    }

    // Save to user metadata
    const result = await updateUserMetadata({
      ...metadata,
      categories
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      category: categories[categoryIndex]
    })

  } catch (error) {
    console.error('Error updating target:', error)
    return NextResponse.json(
      { error: 'Failed to update target' },
      { status: 500 }
    )
  }
}

// Snooze target
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { categoryId } = await request.json()

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID required' }, { status: 400 })
    }

    const metadata = user.user_metadata || {}
    const categories = metadata.categories || []

    // Find and update the category
    const categoryIndex = categories.findIndex((cat: any) => cat.id === categoryId)
    if (categoryIndex === -1) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Snooze until end of current month
    const endOfMonth = new Date()
    endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0)

    categories[categoryIndex] = {
      ...categories[categoryIndex],
      snoozedUntil: endOfMonth.toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Save to user metadata
    const result = await updateUserMetadata({
      ...metadata,
      categories
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      category: categories[categoryIndex],
      snoozedUntil: endOfMonth.toISOString()
    })

  } catch (error) {
    console.error('Error snoozing target:', error)
    return NextResponse.json(
      { error: 'Failed to snooze target' },
      { status: 500 }
    )
  }
}

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
