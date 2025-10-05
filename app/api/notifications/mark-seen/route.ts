import { NextRequest, NextResponse } from 'next/server'
import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'
import { markNotificationAsSeen } from '@/lib/notifications/engine'
import { z } from 'zod'

const MarkSeenSchema = z.object({
  notificationId: z.string()
})

// Mark single notification as seen
export async function POST(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationId } = MarkSeenSchema.parse(body)

    const metadata = user.user_metadata || {}
    const notifications = metadata.notifications_v2 || []

    const updatedNotifications = markNotificationAsSeen(notificationId, notifications)

    const result = await updateUserMetadata({
      ...metadata,
      notifications_v2: updatedNotifications
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      notificationId
    })

  } catch (error) {
    console.error('Error marking notification as seen:', error)
    return NextResponse.json(
      { error: 'Failed to mark notification as seen' },
      { status: 500 }
    )
  }
}
