import { NextRequest, NextResponse } from 'next/server'
import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'
import { z } from 'zod'

const ForecastOverrideSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  categoryId: z.string().nullable(), // null for income overrides
  deltaAmount: z.number(),
  note: z.string().optional()
})

const UpdateOverrideSchema = z.object({
  id: z.string(),
  deltaAmount: z.number().optional(),
  note: z.string().optional()
})

// Get user's forecast overrides
export async function GET(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')

    const metadata = user.user_metadata || {}
    let overrides = metadata.forecast_overrides || []

    // Filter by month if specified
    if (month) {
      overrides = overrides.filter((o: any) => o.month === month)
    }

    return NextResponse.json({
      success: true,
      overrides
    })

  } catch (error) {
    console.error('Error fetching forecast overrides:', error)
    return NextResponse.json(
      { error: 'Failed to fetch overrides' },
      { status: 500 }
    )
  }
}

// Create new forecast override
export async function POST(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = ForecastOverrideSchema.parse(body)

    const metadata = user.user_metadata || {}
    const overrides = metadata.forecast_overrides || []

    // Check if override already exists for this month/category
    const existingIndex = overrides.findIndex((o: any) => 
      o.month === validatedData.month && 
      o.categoryId === validatedData.categoryId
    )

    const newOverride = {
      id: `forecast_override_${Date.now()}`,
      userId: user.id,
      ...validatedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    if (existingIndex >= 0) {
      // Update existing override
      overrides[existingIndex] = {
        ...overrides[existingIndex],
        deltaAmount: validatedData.deltaAmount,
        note: validatedData.note,
        updatedAt: new Date().toISOString()
      }
    } else {
      // Add new override
      overrides.push(newOverride)
    }

    // Save to user metadata
    const result = await updateUserMetadata({
      ...metadata,
      forecast_overrides: overrides
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      override: existingIndex >= 0 ? overrides[existingIndex] : newOverride
    })

  } catch (error) {
    console.error('Error creating forecast override:', error)
    return NextResponse.json(
      { error: 'Failed to create override' },
      { status: 500 }
    )
  }
}

// Update existing forecast override
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = UpdateOverrideSchema.parse(body)

    const metadata = user.user_metadata || {}
    const overrides = metadata.forecast_overrides || []

    const overrideIndex = overrides.findIndex((o: any) => o.id === validatedData.id)
    if (overrideIndex === -1) {
      return NextResponse.json({ error: 'Override not found' }, { status: 404 })
    }

    // Update the override
    overrides[overrideIndex] = {
      ...overrides[overrideIndex],
      ...validatedData,
      updatedAt: new Date().toISOString()
    }

    // Save to user metadata
    const result = await updateUserMetadata({
      ...metadata,
      forecast_overrides: overrides
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      override: overrides[overrideIndex]
    })

  } catch (error) {
    console.error('Error updating forecast override:', error)
    return NextResponse.json(
      { error: 'Failed to update override' },
      { status: 500 }
    )
  }
}

// Delete forecast override
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const overrideId = searchParams.get('id')

    if (!overrideId) {
      return NextResponse.json({ error: 'Override ID required' }, { status: 400 })
    }

    const metadata = user.user_metadata || {}
    const overrides = metadata.forecast_overrides || []

    const filteredOverrides = overrides.filter((o: any) => o.id !== overrideId)

    if (filteredOverrides.length === overrides.length) {
      return NextResponse.json({ error: 'Override not found' }, { status: 404 })
    }

    // Save to user metadata
    const result = await updateUserMetadata({
      ...metadata,
      forecast_overrides: filteredOverrides
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Override deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting forecast override:', error)
    return NextResponse.json(
      { error: 'Failed to delete override' },
      { status: 500 }
    )
  }
}
