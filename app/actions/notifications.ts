'use server'

import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'
import { calculateMonthlyIncome } from '@/lib/income-utils'

export interface Notification {
  id: string
  type: 'budget_warning' | 'goal_milestone' | 'bill_reminder' | 'debt_alert' | 'income_reminder'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high'
  read: boolean
  actionUrl?: string
  actionText?: string
  createdAt: string
}

export async function generateNotifications() {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const notifications: Notification[] = []
    const onboardingData = user.user_metadata?.onboarding_data || {}
    const budgetEntries = user.user_metadata?.budget_entries || []
    const budgetCategories = user.user_metadata?.budget_categories || []
    const recurringIncome = user.user_metadata?.recurring_income || []
    const oneOffIncome = user.user_metadata?.oneoff_income || []
    const notificationSettings = user.user_metadata?.notification_settings || {}
    
    const goals = onboardingData.goals || []
    const debts = onboardingData.debts || []
    const bills = onboardingData.bills || []

    // Current month/year
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    // 1. Budget Warnings
    if (notificationSettings.budgetAlerts !== false) {
      const warningThreshold = notificationSettings.budgetWarningPercent || 80
      
      budgetEntries
        .filter((entry: any) => entry.month === currentMonth && entry.year === currentYear)
        .forEach((entry: any) => {
          const category = budgetCategories.find((cat: any) => cat.id === entry.categoryId)
          if (category && entry.assignedCents > 0) {
            const percentSpent = (entry.spentCents / entry.assignedCents) * 100
            
            if (percentSpent >= warningThreshold && percentSpent < 100) {
              notifications.push({
                id: `budget_warning_${entry.categoryId}`,
                type: 'budget_warning',
                title: `Budget Warning: ${category.name}`,
                message: `You've spent ${percentSpent.toFixed(1)}% of your ${category.name} budget this month.`,
                priority: 'medium',
                read: false,
                actionUrl: '/app/budget',
                actionText: 'View Budget',
                createdAt: new Date().toISOString(),
              })
            } else if (percentSpent >= 100) {
              notifications.push({
                id: `budget_exceeded_${entry.categoryId}`,
                type: 'budget_warning',
                title: `Budget Exceeded: ${category.name}`,
                message: `You've exceeded your ${category.name} budget by ${(percentSpent - 100).toFixed(1)}%.`,
                priority: 'high',
                read: false,
                actionUrl: '/app/budget',
                actionText: 'Adjust Budget',
                createdAt: new Date().toISOString(),
              })
            }
          }
        })
    }

    // 2. Goal Milestones
    if (notificationSettings.goalMilestones !== false) {
      goals.forEach((goal: any, index: number) => {
        const currentSaved = goal.saved || 0
        const progress = (currentSaved / goal.target) * 100
        
        // Milestone notifications at 25%, 50%, 75%, 100%
        const milestones = [25, 50, 75, 100]
        milestones.forEach(milestone => {
          if (progress >= milestone && progress < milestone + 10) { // Small buffer to avoid spam
            notifications.push({
              id: `goal_milestone_${index}_${milestone}`,
              type: 'goal_milestone',
              title: `Goal Milestone: ${goal.name}`,
              message: `Congratulations! You've reached ${milestone}% of your ${goal.name} goal.`,
              priority: milestone === 100 ? 'high' : 'medium',
              read: false,
              actionUrl: '/app/goals',
              actionText: 'View Goals',
              createdAt: new Date().toISOString(),
            })
          }
        })
      })
    }

    // 3. Bill Reminders
    if (notificationSettings.billReminders !== false) {
      bills.forEach((bill: any, index: number) => {
        // For demo, create reminders for bills due "soon"
        notifications.push({
          id: `bill_reminder_${index}`,
          type: 'bill_reminder',
          title: `Bill Reminder: ${bill.name}`,
          message: `Your ${bill.name} bill of ${(bill.amount / 100).toFixed(2)} is coming up soon.`,
          priority: 'medium',
          read: false,
          actionUrl: '/app/budget',
          actionText: 'View Budget',
          createdAt: new Date().toISOString(),
        })
      })
    }

    // 4. Debt Alerts
    debts.forEach((debt: any, index: number) => {
      const monthlyInterest = Math.round((debt.balance * debt.interest / 100) / 12)
      
      if (debt.interest > 20) { // High interest debt
        notifications.push({
          id: `debt_alert_${index}`,
          type: 'debt_alert',
          title: `High Interest Debt: ${debt.name}`,
          message: `Your ${debt.name} has a ${debt.interest}% interest rate, costing you ~$${(monthlyInterest / 100).toFixed(2)}/month in interest.`,
          priority: 'high',
          read: false,
          actionUrl: '/app/debts',
          actionText: 'View Payoff Plan',
          createdAt: new Date().toISOString(),
        })
      }
    })

    // 5. Income Reminders
    recurringIncome.forEach((income: any, index: number) => {
      const nextDate = new Date(income.nextDate)
      const today = new Date()
      const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysUntil <= 3 && daysUntil >= 0) {
        notifications.push({
          id: `income_reminder_${index}`,
          type: 'income_reminder',
          title: `Income Due: ${income.name}`,
          message: `Your ${income.name} payment of $${(income.amountCents / 100).toFixed(2)} is due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}.`,
          priority: 'low',
          read: false,
          actionUrl: '/app/income',
          actionText: 'View Income',
          createdAt: new Date().toISOString(),
        })
      }
    })

    // Save notifications to user metadata
    const result = await updateUserMetadata({
      notifications: notifications.slice(0, 20), // Limit to 20 most recent
      last_notification_check: new Date().toISOString(),
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { 
      success: true, 
      notifications: notifications.slice(0, 10), // Return first 10 for display
      total: notifications.length
    }
  } catch (error) {
    console.error('Error generating notifications:', error)
    return { success: false, error: 'Failed to generate notifications' }
  }
}

export async function markNotificationAsRead(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const notificationId = formData.get('id') as string
    const existingNotifications = user.user_metadata?.notifications || []
    
    const updatedNotifications = existingNotifications.map((notification: any) =>
      notification.id === notificationId
        ? { ...notification, read: true, readAt: new Date().toISOString() }
        : notification
    )

    const result = await updateUserMetadata({
      notifications: updatedNotifications,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, message: 'Notification marked as read' }
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return { success: false, error: 'Failed to mark notification as read' }
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const existingNotifications = user.user_metadata?.notifications || []
    
    const updatedNotifications = existingNotifications.map((notification: any) => ({
      ...notification,
      read: true,
      readAt: new Date().toISOString(),
    }))

    const result = await updateUserMetadata({
      notifications: updatedNotifications,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, message: 'All notifications marked as read' }
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return { success: false, error: 'Failed to mark all notifications as read' }
  }
}

export async function deleteNotification(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const notificationId = formData.get('id') as string
    const existingNotifications = user.user_metadata?.notifications || []
    
    const updatedNotifications = existingNotifications.filter((notification: any) =>
      notification.id !== notificationId
    )

    const result = await updateUserMetadata({
      notifications: updatedNotifications,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, message: 'Notification deleted' }
  } catch (error) {
    console.error('Error deleting notification:', error)
    return { success: false, error: 'Failed to delete notification' }
  }
}
