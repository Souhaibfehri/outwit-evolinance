import { NextRequest, NextResponse } from 'next/server'
import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'
import { 
  analyzeOverspending, 
  applyRebalanceMoves, 
  reverseReassignment,
  RebalanceMove 
} from '@/lib/rebalance/engine'
import { z } from 'zod'

const RebalanceAnalysisSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format')
})

const ApplyMovesSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  moves: z.array(z.object({
    fromCategoryId: z.string(),
    fromCategoryName: z.string(),
    toCategoryId: z.string(),
    toCategoryName: z.string(),
    amount: z.number(),
    reason: z.string(),
    impact: z.enum(['low', 'medium', 'high'])
  })),
  reason: z.string().optional().default('Cover overspending')
})

const UndoReassignmentSchema = z.object({
  reassignmentId: z.string()
})

// Analyze overspending and get rebalancing suggestions
export async function POST(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = RebalanceAnalysisSchema.parse(body)

    const metadata = user.user_metadata || {}
    const categories = metadata.categories || []
    const budgetItems = metadata.budget_items || []
    const transactions = metadata.transactions_v2 || []
    const bills = metadata.bills || []
    const forecastOverrides = metadata.forecast_overrides || []

    // Get forecast data for future impact analysis
    let forecastData = []
    try {
      const forecastResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/forecast`, {
        headers: {
          'Authorization': `Bearer ${user.id}` // Simple auth for internal calls
        }
      })
      if (forecastResponse.ok) {
        const forecast = await forecastResponse.json()
        forecastData = forecast.forecast || []
      }
    } catch (error) {
      console.warn('Could not fetch forecast data for impact analysis:', error)
    }

    // Analyze overspending
    const rebalanceResult = analyzeOverspending(
      categories,
      budgetItems,
      transactions,
      bills,
      validatedData.month,
      forecastData
    )

    return NextResponse.json({
      success: true,
      month: validatedData.month,
      result: rebalanceResult
    })

  } catch (error) {
    console.error('Error analyzing overspending:', error)
    return NextResponse.json(
      { error: 'Failed to analyze overspending' },
      { status: 500 }
    )
  }
}

// Apply rebalancing moves
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = ApplyMovesSchema.parse(body)

    const metadata = user.user_metadata || {}
    const budgetItems = metadata.budget_items || []
    const reassignmentRecords = metadata.reassignment_records || []

    // Apply the moves
    const { updatedBudgetItems, reassignmentRecord } = applyRebalanceMoves(
      validatedData.moves,
      budgetItems,
      validatedData.month,
      user.id,
      validatedData.reason
    )

    // Add reassignment record
    reassignmentRecords.push(reassignmentRecord)

    // Keep only last 20 reassignment records
    const trimmedRecords = reassignmentRecords.slice(-20)

    const result = await updateUserMetadata({
      ...metadata,
      budget_items: updatedBudgetItems,
      reassignment_records: trimmedRecords
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      reassignmentRecord,
      totalAmount: reassignmentRecord.totalAmount,
      affectedCategories: validatedData.moves.length * 2 // from + to categories
    })

  } catch (error) {
    console.error('Error applying rebalance moves:', error)
    return NextResponse.json(
      { error: 'Failed to apply moves' },
      { status: 500 }
    )
  }
}

// Undo a reassignment
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = UndoReassignmentSchema.parse(body)

    const metadata = user.user_metadata || {}
    const budgetItems = metadata.budget_items || []
    const reassignmentRecords = metadata.reassignment_records || []

    // Find the reassignment record
    const recordIndex = reassignmentRecords.findIndex(
      (record: any) => record.id === validatedData.reassignmentId
    )

    if (recordIndex === -1) {
      return NextResponse.json({ error: 'Reassignment record not found' }, { status: 404 })
    }

    const originalRecord = reassignmentRecords[recordIndex]

    if (!originalRecord.isReversible) {
      return NextResponse.json({ error: 'This reassignment cannot be reversed' }, { status: 400 })
    }

    if (originalRecord.reversedAt) {
      return NextResponse.json({ error: 'This reassignment has already been reversed' }, { status: 400 })
    }

    // Reverse the reassignment
    const { updatedBudgetItems, reversalRecord } = reverseReassignment(
      originalRecord,
      budgetItems,
      user.id
    )

    // Mark original record as reversed
    reassignmentRecords[recordIndex] = {
      ...originalRecord,
      reversedAt: new Date().toISOString(),
      reversedBy: user.id
    }

    // Add reversal record
    reassignmentRecords.push(reversalRecord)

    const result = await updateUserMetadata({
      ...metadata,
      budget_items: updatedBudgetItems,
      reassignment_records: reassignmentRecords
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      reversalRecord,
      originalRecord: reassignmentRecords[recordIndex],
      totalAmount: reversalRecord.totalAmount
    })

  } catch (error) {
    console.error('Error undoing reassignment:', error)
    return NextResponse.json(
      { error: 'Failed to undo reassignment' },
      { status: 500 }
    )
  }
}
