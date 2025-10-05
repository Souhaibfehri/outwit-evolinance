import { NextRequest, NextResponse } from 'next/server'
import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'
import { 
  generateAllocationSuggestions, 
  calculateSpendingTrends,
  AllocationSuggestion,
  AllocationLog
} from '@/lib/auto-assign/engine'
import { calculateTargetNeeds } from '@/lib/targets/engine'
import { z } from 'zod'

const AutoAssignRequestSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  availableRTA: z.number(),
  lockedCategories: z.array(z.string()).optional().default([])
})

const ApproveAssignmentSchema = z.object({
  suggestions: z.array(z.object({
    categoryId: z.string(),
    categoryName: z.string(),
    currentAssigned: z.number(),
    suggestedAmount: z.number(),
    reason: z.string(),
    priority: z.number(),
    confidence: z.enum(['high', 'medium', 'low']),
    isLocked: z.boolean().optional()
  })),
  action: z.enum(['approve', 'approve_lock', 'reject']),
  month: z.string()
})

// Generate auto-assign suggestions
export async function POST(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = AutoAssignRequestSchema.parse(body)

    const metadata = user.user_metadata || {}
    const categories = metadata.categories || []
    const budgetItems = metadata.budget_items || []
    const transactions = metadata.transactions_v2 || []
    const bills = metadata.bills || []
    const recurringIncome = metadata.recurring_income || []
    const allocationLogs = metadata.allocation_logs || []

    // Calculate expected income
    const expectedIncome = recurringIncome.reduce((total: number, income: any) => {
      if (!income.active) return total
      return total + (income.amountCents / 100)
    }, 0)

    // Calculate target needs
    const targetCalculations = calculateTargetNeeds(
      categories, 
      budgetItems, 
      validatedData.month, 
      expectedIncome
    )

    // Calculate spending trends
    const categoryIds = categories.map((cat: any) => cat.id)
    const spendingTrends = calculateSpendingTrends(transactions, categoryIds)

    // Get locked categories from recent logs
    const recentLogs = allocationLogs.filter((log: any) => 
      log.month === validatedData.month && 
      log.action === 'approve_lock'
    )
    const lockedFromLogs = recentLogs.flatMap((log: any) => 
      log.suggestions.filter((s: any) => s.isLocked).map((s: any) => s.categoryId)
    )
    const allLockedCategories = [...validatedData.lockedCategories, ...lockedFromLogs]

    // Generate suggestions
    const suggestions = generateAllocationSuggestions(
      validatedData.availableRTA,
      targetCalculations.categories,
      spendingTrends,
      budgetItems,
      bills,
      allLockedCategories,
      validatedData.month
    )

    return NextResponse.json({
      success: true,
      suggestions,
      targetCalculations: targetCalculations.categories,
      spendingTrends,
      lockedCategories: allLockedCategories
    })

  } catch (error) {
    console.error('Error generating auto-assign suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    )
  }
}

// Apply auto-assign suggestions
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = ApproveAssignmentSchema.parse(body)

    const metadata = user.user_metadata || {}
    let budgetItems = metadata.budget_items || []
    let budgetMonths = metadata.budget_months || []
    const allocationLogs = metadata.allocation_logs || []

    if (validatedData.action === 'reject') {
      // Log the rejection
      const rejectionLog: AllocationLog = {
        id: `allocation_log_${Date.now()}`,
        userId: user.id,
        month: validatedData.month,
        timestamp: new Date().toISOString(),
        action: 'reject',
        suggestions: validatedData.suggestions,
        totalAmount: 0,
        strategy: 'user_rejected'
      }

      allocationLogs.push(rejectionLog)

      const result = await updateUserMetadata({
        ...metadata,
        allocation_logs: allocationLogs
      })

      return NextResponse.json({
        success: true,
        action: 'rejected',
        log: rejectionLog
      })
    }

    // Apply the suggestions
    const totalAmount = validatedData.suggestions.reduce((sum, s) => sum + s.suggestedAmount, 0)
    const updatedCategories: string[] = []

    for (const suggestion of validatedData.suggestions) {
      if (suggestion.suggestedAmount <= 0) continue

      // Find or create budget item
      const existingItemIndex = budgetItems.findIndex(
        (item: any) => item.categoryId === suggestion.categoryId && item.month === validatedData.month
      )

      if (existingItemIndex >= 0) {
        // Update existing item
        budgetItems[existingItemIndex] = {
          ...budgetItems[existingItemIndex],
          assigned: (budgetItems[existingItemIndex].assigned || 0) + suggestion.suggestedAmount,
          updatedAt: new Date().toISOString()
        }
      } else {
        // Create new item
        budgetItems.push({
          id: `budget_item_${Date.now()}_${suggestion.categoryId}`,
          userId: user.id,
          month: validatedData.month,
          categoryId: suggestion.categoryId,
          assigned: suggestion.suggestedAmount,
          spent: 0,
          leftoverFromPrev: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }

      updatedCategories.push(suggestion.categoryId)
    }

    // Log the approval
    const approvalLog: AllocationLog = {
      id: `allocation_log_${Date.now()}`,
      userId: user.id,
      month: validatedData.month,
      timestamp: new Date().toISOString(),
      action: validatedData.action,
      suggestions: validatedData.suggestions,
      totalAmount,
      strategy: 'auto_assign_approved'
    }

    allocationLogs.push(approvalLog)

    // Keep only last 50 logs to prevent metadata bloat
    const trimmedLogs = allocationLogs.slice(-50)

    const result = await updateUserMetadata({
      ...metadata,
      budget_items: budgetItems,
      allocation_logs: trimmedLogs
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      action: validatedData.action,
      totalAmount,
      updatedCategories,
      log: approvalLog
    })

  } catch (error) {
    console.error('Error applying auto-assign suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to apply suggestions' },
      { status: 500 }
    )
  }
}

// Undo last auto-assign action
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')

    if (!month) {
      return NextResponse.json({ error: 'Month parameter required' }, { status: 400 })
    }

    const metadata = user.user_metadata || {}
    let budgetItems = metadata.budget_items || []
    let allocationLogs = metadata.allocation_logs || []

    // Find the last approval log for this month
    const lastApprovalLog = allocationLogs
      .filter((log: any) => 
        log.month === month && 
        (log.action === 'approve' || log.action === 'approve_lock')
      )
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]

    if (!lastApprovalLog) {
      return NextResponse.json({ error: 'No recent allocation to undo' }, { status: 404 })
    }

    // Reverse the allocations
    for (const suggestion of lastApprovalLog.suggestions) {
      const budgetItemIndex = budgetItems.findIndex(
        (item: any) => item.categoryId === suggestion.categoryId && item.month === month
      )

      if (budgetItemIndex >= 0) {
        const currentAssigned = budgetItems[budgetItemIndex].assigned || 0
        const newAssigned = Math.max(0, currentAssigned - suggestion.suggestedAmount)

        if (newAssigned === 0) {
          // Remove the budget item if assigned becomes 0
          budgetItems.splice(budgetItemIndex, 1)
        } else {
          // Update the assigned amount
          budgetItems[budgetItemIndex] = {
            ...budgetItems[budgetItemIndex],
            assigned: newAssigned,
            updatedAt: new Date().toISOString()
          }
        }
      }
    }

    // Log the undo action
    const undoLog: AllocationLog = {
      id: `allocation_log_${Date.now()}`,
      userId: user.id,
      month,
      timestamp: new Date().toISOString(),
      action: 'undo',
      suggestions: lastApprovalLog.suggestions,
      totalAmount: -lastApprovalLog.totalAmount,
      strategy: 'undo_auto_assign'
    }

    allocationLogs.push(undoLog)

    const result = await updateUserMetadata({
      ...metadata,
      budget_items: budgetItems,
      allocation_logs: allocationLogs
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      undoneAmount: lastApprovalLog.totalAmount,
      undoneCategories: lastApprovalLog.suggestions.map(s => s.categoryId),
      log: undoLog
    })

  } catch (error) {
    console.error('Error undoing auto-assign:', error)
    return NextResponse.json(
      { error: 'Failed to undo allocation' },
      { status: 500 }
    )
  }
}
