import { NextRequest, NextResponse } from 'next/server'
import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'
import { generateNotifications } from '@/lib/notifications'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeRead = searchParams.get('include_read') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Generate new notifications
    await generateNotifications()

    const metadata = user.user_metadata || {}
    let notifications = metadata.notifications || []

    // Filter by read status if requested
    if (!includeRead) {
      notifications = notifications.filter((notif: any) => !notif.read && !notif.dismissed)
    }

    // Sort by priority and creation date
    notifications.sort((a: any, b: any) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority // Higher priority first
      }
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() // Newer first
    })

    // Limit results
    notifications = notifications.slice(0, limit)

    // Calculate counts
    const unreadCount = (metadata.notifications || []).filter((notif: any) => !notif.read && !notif.dismissed).length
    const highPriorityCount = (metadata.notifications || []).filter((notif: any) => 
      !notif.read && !notif.dismissed && notif.priority === 'high'
    ).length

    return NextResponse.json({
      success: true,
      notifications,
      counts: {
        total: notifications.length,
        unread: unreadCount,
        highPriority: highPriorityCount
      }
    })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch notifications'
    }, { status: 500 })
  }
}

const UpdateNotificationSchema = z.object({
  read: z.boolean().optional(),
  dismissed: z.boolean().optional()
})

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')
    
    if (!notificationId) {
      return NextResponse.json({ success: false, error: 'Notification ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = UpdateNotificationSchema.parse(body)

    const metadata = user.user_metadata || {}
    let notifications = metadata.notifications || []

    const notificationIndex = notifications.findIndex((notif: any) => notif.id === notificationId)
    if (notificationIndex === -1) {
      return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 })
    }

    // Update notification
    notifications[notificationIndex] = {
      ...notifications[notificationIndex],
      ...validatedData,
      updatedAt: new Date().toISOString()
    }

    const result = await updateUserMetadata({
      ...metadata,
      notifications
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      notification: notifications[notificationIndex],
      message: 'Notification updated successfully'
    })

  } catch (error) {
    console.error('Error updating notification:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid notification data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to update notification'
    }, { status: 500 })
  }
}

// Mark all notifications as read
export async function POST(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
    }

    const metadata = user.user_metadata || {}
    let notifications = metadata.notifications || []

    // Mark all as read
    notifications = notifications.map((notif: any) => ({
      ...notif,
      read: true,
      updatedAt: new Date().toISOString()
    }))

    const result = await updateUserMetadata({
      ...metadata,
      notifications
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read',
      updated: notifications.length
    })

  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to mark notifications as read'
    }, { status: 500 })
  }
}
