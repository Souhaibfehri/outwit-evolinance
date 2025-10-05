import { NextRequest, NextResponse } from 'next/server'
import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'
import { 
  generateNotifications,
  cleanupExpiredNotifications,
  NotificationContext,
  getDefaultRules
} from '@/lib/notifications/engine'
import { getCurrentMonth } from '@/lib/types/budget-v2'

// Get user notifications
export async function GET(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeRead = searchParams.get('includeRead') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')

    const metadata = user.user_metadata || {}
    let notifications = metadata.notifications_v2 || []

    // Clean up expired notifications
    notifications = cleanupExpiredNotifications(notifications)

    // Filter unread if requested
    if (!includeRead) {
      notifications = notifications.filter((n: any) => !n.seenAt)
    }

    // Sort by creation date (newest first) and limit
    const sortedNotifications = notifications
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)

    return NextResponse.json({
      success: true,
      notifications: sortedNotifications,
      unreadCount: notifications.filter((n: any) => !n.seenAt).length,
      totalCount: notifications.length
    })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// Generate new notifications
export async function POST(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const metadata = user.user_metadata || {}
    const currentMonth = getCurrentMonth()
    const today = new Date().toISOString().split('T')[0]

    // Build notification context
    const context: NotificationContext = {
      bills: metadata.bills || [],
      budgetItems: metadata.budget_items || [],
      categories: metadata.categories || [],
      transactions: metadata.transactions_v2 || [],
      goals: metadata.goals_v2 || [],
      recurringIncome: metadata.recurring_income || [],
      currentMonth,
      today
    }

    const existingNotifications = metadata.notifications_v2 || []
    const notificationRules = metadata.notification_rules || getDefaultRules()

    // Generate new notifications
    const newNotifications = generateNotifications(context, existingNotifications, notificationRules)

    if (newNotifications.length > 0) {
      const allNotifications = [...existingNotifications, ...newNotifications]
      
      // Clean up old notifications (keep last 50)
      const trimmedNotifications = allNotifications
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50)

      const result = await updateUserMetadata({
        ...metadata,
        notifications_v2: trimmedNotifications
      })

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      generated: newNotifications.length,
      notifications: newNotifications
    })

  } catch (error) {
    console.error('Error generating notifications:', error)
    return NextResponse.json(
      { error: 'Failed to generate notifications' },
      { status: 500 }
    )
  }
}