import { NextRequest, NextResponse } from 'next/server'
import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'
import { z } from 'zod'

const ForecastSnapshotSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  baseMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Base month must be in YYYY-MM format'),
  data: z.any() // ForecastMonth[] - complex validation would be too verbose
})

// Get user's forecast snapshots
export async function GET(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const metadata = user.user_metadata || {}
    const snapshots = metadata.forecast_snapshots || []

    return NextResponse.json({
      success: true,
      snapshots
    })

  } catch (error) {
    console.error('Error fetching forecast snapshots:', error)
    return NextResponse.json(
      { error: 'Failed to fetch snapshots' },
      { status: 500 }
    )
  }
}

// Create new forecast snapshot
export async function POST(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = ForecastSnapshotSchema.parse(body)

    const metadata = user.user_metadata || {}
    const snapshots = metadata.forecast_snapshots || []

    const newSnapshot = {
      id: `forecast_snapshot_${Date.now()}`,
      userId: user.id,
      ...validatedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    snapshots.push(newSnapshot)

    // Keep only the last 10 snapshots to prevent metadata bloat
    const trimmedSnapshots = snapshots.slice(-10)

    // Save to user metadata
    const result = await updateUserMetadata({
      ...metadata,
      forecast_snapshots: trimmedSnapshots
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      snapshot: newSnapshot
    })

  } catch (error) {
    console.error('Error creating forecast snapshot:', error)
    return NextResponse.json(
      { error: 'Failed to create snapshot' },
      { status: 500 }
    )
  }
}

// Delete forecast snapshot
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const snapshotId = searchParams.get('id')

    if (!snapshotId) {
      return NextResponse.json({ error: 'Snapshot ID required' }, { status: 400 })
    }

    const metadata = user.user_metadata || {}
    const snapshots = metadata.forecast_snapshots || []

    const filteredSnapshots = snapshots.filter((s: any) => s.id !== snapshotId)

    if (filteredSnapshots.length === snapshots.length) {
      return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 })
    }

    // Save to user metadata
    const result = await updateUserMetadata({
      ...metadata,
      forecast_snapshots: filteredSnapshots
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Snapshot deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting forecast snapshot:', error)
    return NextResponse.json(
      { error: 'Failed to delete snapshot' },
      { status: 500 }
    )
  }
}
