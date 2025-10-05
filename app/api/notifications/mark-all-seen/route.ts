import { NextRequest, NextResponse } from 'next/server'
import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'

// Mark all notifications as seen
export async function POST(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const metadata = user.user_metadata || {}
    const notifications = metadata.notifications_v2 || []

    const updatedNotifications = notifications.map((notification: any) => ({
      ...notification,
      seenAt: notification.seenAt || new Date().toISOString()
    }))

    const result = await updateUserMetadata({
      ...metadata,
      notifications_v2: updatedNotifications
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      markedCount: notifications.filter((n: any) => !n.seenAt).length
    })

  } catch (error) {
    console.error('Error marking all notifications as seen:', error)
    return NextResponse.json(
      { error: 'Failed to mark all notifications as seen' },
      { status: 500 }
    )
  }
}
