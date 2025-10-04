// Real notification system with triggers and scheduling

import { getUserAndEnsure, updateUserMetadata } from './ensureUser'
import { nextOccurrence } from './recurrence'

export type NotificationType = 
  | 'bill_due_soon'
  | 'bill_overdue'
  | 'budget_over_allocated'
  | 'goal_milestone'
  | 'goal_inactive'
  | 'large_transaction'
  | 'monthly_summary'
  | 'trial_ending'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  actionUrl?: string
  actionLabel?: string
  priority: 'low' | 'medium' | 'high'
  read: boolean
  dismissed: boolean
  metadata?: Record<string, any>
  createdAt: string
  expiresAt?: string
}

export interface NotificationTrigger {
  type: NotificationType
  enabled: boolean
  settings?: Record<string, any>
}

/**
 * Generate notifications based on current user data
 */
export async function generateNotifications(): Promise<{ success: boolean; generated: number; error?: string }> {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found', generated: 0 }
    }

    const metadata = user.user_metadata || {}
    const notifications = metadata.notifications || []
    const triggers = metadata.notification_triggers || getDefaultTriggers()
    
    const newNotifications: Notification[] = []

    // Check for bill notifications
    const billNotifications = await generateBillNotifications(metadata, triggers)
    newNotifications.push(...billNotifications)

    // Check for budget notifications
    const budgetNotifications = await generateBudgetNotifications(metadata, triggers)
    newNotifications.push(...budgetNotifications)

    // Check for goal notifications
    const goalNotifications = await generateGoalNotifications(metadata, triggers)
    newNotifications.push(...goalNotifications)

    // Check for transaction notifications
    const transactionNotifications = await generateTransactionNotifications(metadata, triggers)
    newNotifications.push(...transactionNotifications)

    // Check for trial notifications
    const trialNotifications = await generateTrialNotifications(metadata, triggers)
    newNotifications.push(...trialNotifications)

    // Remove duplicates and expired notifications
    const cleanedNotifications = removeDuplicateNotifications([...notifications, ...newNotifications])
    const activeNotifications = removeExpiredNotifications(cleanedNotifications)

    const result = await updateUserMetadata({
      ...metadata,
      notifications: activeNotifications
    })

    if (!result.success) {
      return { success: false, error: result.error, generated: 0 }
    }

    return { success: true, generated: newNotifications.length }
  } catch (error) {
    console.error('Error generating notifications:', error)
    return { success: false, error: 'Failed to generate notifications', generated: 0 }
  }
}

/**
 * Generate bill-related notifications
 */
async function generateBillNotifications(metadata: any, triggers: NotificationTrigger[]): Promise<Notification[]> {
  const billTrigger = triggers.find(t => t.type === 'bill_due_soon')
  const overdueTrigger = triggers.find(t => t.type === 'bill_overdue')
  
  if (!billTrigger?.enabled && !overdueTrigger?.enabled) return []

  const bills = metadata.bills || []
  const notifications: Notification[] = []
  const today = new Date()

  for (const bill of bills) {
    if (!bill.active || !bill.nextDue) continue

    const dueDate = new Date(bill.nextDue)
    const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    // Bill due soon (3 days before)
    if (billTrigger?.enabled && daysUntil <= 3 && daysUntil > 0) {
      notifications.push({
        id: `bill_due_${bill.id}_${bill.nextDue}`,
        userId: metadata.userId,
        type: 'bill_due_soon',
        title: `Bill Due ${daysUntil === 1 ? 'Tomorrow' : `in ${daysUntil} days`}`,
        message: `${bill.name} ($${bill.amount}) is due ${formatDueDate(daysUntil)}`,
        actionUrl: '/bills',
        actionLabel: 'Pay Bill',
        priority: daysUntil === 1 ? 'high' : 'medium',
        read: false,
        dismissed: false,
        metadata: { billId: bill.id, amount: bill.amount },
        createdAt: new Date().toISOString(),
        expiresAt: dueDate.toISOString()
      })
    }

    // Bill overdue
    if (overdueTrigger?.enabled && daysUntil < 0) {
      notifications.push({
        id: `bill_overdue_${bill.id}_${bill.nextDue}`,
        userId: metadata.userId,
        type: 'bill_overdue',
        title: 'Overdue Bill',
        message: `${bill.name} ($${bill.amount}) was due ${Math.abs(daysUntil)} days ago`,
        actionUrl: '/bills',
        actionLabel: 'Pay Now',
        priority: 'high',
        read: false,
        dismissed: false,
        metadata: { billId: bill.id, amount: bill.amount, daysOverdue: Math.abs(daysUntil) },
        createdAt: new Date().toISOString()
      })
    }
  }

  return notifications
}

/**
 * Generate budget-related notifications
 */
async function generateBudgetNotifications(metadata: any, triggers: NotificationTrigger[]): Promise<Notification[]> {
  const trigger = triggers.find(t => t.type === 'budget_over_allocated')
  if (!trigger?.enabled) return []

  const notifications: Notification[] = []
  const currentMonth = getCurrentMonth()
  const budgetMonths = metadata.budget_months || []
  const budgetItems = metadata.budget_items || []

  const budgetMonth = budgetMonths.find((bm: any) => bm.month === currentMonth)
  if (!budgetMonth) return notifications

  const monthItems = budgetItems.filter((item: any) => item.month === currentMonth)
  const totalAssigned = monthItems.reduce((sum: number, item: any) => sum + parseFloat(item.assigned || 0), 0)
  const readyToAssign = budgetMonth.expectedIncome - totalAssigned

  if (readyToAssign < 0) {
    notifications.push({
      id: `budget_over_allocated_${currentMonth}`,
      userId: metadata.userId,
      type: 'budget_over_allocated',
      title: 'Budget Over-Allocated',
      message: `You've assigned $${Math.abs(readyToAssign).toFixed(2)} more than you have available this month`,
      actionUrl: '/budget',
      actionLabel: 'Review Budget',
      priority: 'high',
      read: false,
      dismissed: false,
      metadata: { month: currentMonth, overAmount: Math.abs(readyToAssign) },
      createdAt: new Date().toISOString(),
      expiresAt: getEndOfMonth(currentMonth).toISOString()
    })
  }

  return notifications
}

/**
 * Generate goal-related notifications
 */
async function generateGoalNotifications(metadata: any, triggers: NotificationTrigger[]): Promise<Notification[]> {
  const milestoneTrigger = triggers.find(t => t.type === 'goal_milestone')
  const inactiveTrigger = triggers.find(t => t.type === 'goal_inactive')
  
  if (!milestoneTrigger?.enabled && !inactiveTrigger?.enabled) return []

  const goals = metadata.goals || []
  const notifications: Notification[] = []
  const today = new Date()

  for (const goal of goals) {
    const target = goal.target || 0
    const current = goal.saved || 0
    const progress = target > 0 ? (current / target) * 100 : 0

    // Milestone notifications (50%, 75%, 100%)
    if (milestoneTrigger?.enabled && goal.notify) {
      const milestones = [50, 75, 100]
      for (const milestone of milestones) {
        if (progress >= milestone && !goal[`milestone_${milestone}_notified`]) {
          notifications.push({
            id: `goal_milestone_${goal.id}_${milestone}`,
            userId: metadata.userId,
            type: 'goal_milestone',
            title: milestone === 100 ? 'Goal Achieved! 🎉' : `${milestone}% Progress!`,
            message: milestone === 100 
              ? `Congratulations! You've reached your ${goal.name} goal of $${target.toFixed(2)}`
              : `You're ${milestone}% of the way to your ${goal.name} goal ($${current.toFixed(2)} of $${target.toFixed(2)})`,
            actionUrl: '/goals',
            actionLabel: milestone === 100 ? 'View Goals' : 'Add More',
            priority: milestone === 100 ? 'high' : 'medium',
            read: false,
            dismissed: false,
            metadata: { goalId: goal.id, milestone, progress },
            createdAt: new Date().toISOString()
          })
        }
      }
    }

    // Inactive goal notifications (no contribution in 30 days)
    if (inactiveTrigger?.enabled && goal.notify && goal.lastContribution) {
      const daysSinceContribution = Math.floor((today.getTime() - new Date(goal.lastContribution).getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysSinceContribution >= 30) {
        notifications.push({
          id: `goal_inactive_${goal.id}_${daysSinceContribution}`,
          userId: metadata.userId,
          type: 'goal_inactive',
          title: 'Goal Needs Attention',
          message: `It's been ${daysSinceContribution} days since your last contribution to ${goal.name}. Keep the momentum going!`,
          actionUrl: '/goals',
          actionLabel: 'Add Money',
          priority: 'medium',
          read: false,
          dismissed: false,
          metadata: { goalId: goal.id, daysSinceContribution },
          createdAt: new Date().toISOString()
        })
      }
    }
  }

  return notifications
}

/**
 * Generate transaction-related notifications
 */
async function generateTransactionNotifications(metadata: any, triggers: NotificationTrigger[]): Promise<Notification[]> {
  const trigger = triggers.find(t => t.type === 'large_transaction')
  if (!trigger?.enabled) return []

  const transactions = metadata.transactions || []
  const notifications: Notification[] = []
  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Calculate 90th percentile for large transaction detection
  const recentTransactions = transactions.filter((txn: any) => 
    new Date(txn.date) >= thirtyDaysAgo && txn.type === 'EXPENSE'
  )
  
  if (recentTransactions.length < 10) return notifications

  const amounts = recentTransactions.map((txn: any) => Math.abs(txn.amountCents / 100)).sort((a, b) => a - b)
  const percentile90 = amounts[Math.floor(amounts.length * 0.9)]

  // Check recent transactions for unusually large amounts
  const yesterdayTransactions = transactions.filter((txn: any) => {
    const txnDate = new Date(txn.date)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    return txnDate.toDateString() === yesterday.toDateString()
  })

  for (const txn of yesterdayTransactions) {
    const amount = Math.abs(txn.amountCents / 100)
    if (amount >= percentile90 && amount >= 100) { // At least $100 and above 90th percentile
      notifications.push({
        id: `large_transaction_${txn.id}`,
        userId: metadata.userId,
        type: 'large_transaction',
        title: 'Large Transaction Detected',
        message: `You spent $${amount.toFixed(2)} at ${txn.merchant || 'Unknown'} yesterday`,
        actionUrl: '/transactions',
        actionLabel: 'Review',
        priority: 'medium',
        read: false,
        dismissed: false,
        metadata: { transactionId: txn.id, amount },
        createdAt: new Date().toISOString(),
        expiresAt: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
    }
  }

  return notifications
}

/**
 * Generate trial-related notifications
 */
async function generateTrialNotifications(metadata: any, triggers: NotificationTrigger[]): Promise<Notification[]> {
  const trigger = triggers.find(t => t.type === 'trial_ending')
  if (!trigger?.enabled) return []

  const onboardingProfile = metadata.onboarding_profile
  if (!onboardingProfile?.trialEndsAt) return []

  const notifications: Notification[] = []
  const today = new Date()
  const trialEndDate = new Date(onboardingProfile.trialEndsAt)
  const daysUntilEnd = Math.ceil((trialEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (daysUntilEnd <= 3 && daysUntilEnd > 0) {
    notifications.push({
      id: `trial_ending_${daysUntilEnd}`,
      userId: metadata.userId,
      type: 'trial_ending',
      title: `Trial ends ${daysUntilEnd === 1 ? 'tomorrow' : `in ${daysUntilEnd} days`}`,
      message: `Your free trial ends soon. Choose a plan to continue using Outwit Budget.`,
      actionUrl: '/pricing',
      actionLabel: 'View Plans',
      priority: 'high',
      read: false,
      dismissed: false,
      metadata: { daysUntilEnd },
      createdAt: new Date().toISOString(),
      expiresAt: trialEndDate.toISOString()
    })
  }

  return notifications
}

/**
 * Remove duplicate notifications
 */
function removeDuplicateNotifications(notifications: Notification[]): Notification[] {
  const seen = new Set<string>()
  return notifications.filter(notification => {
    if (seen.has(notification.id)) {
      return false
    }
    seen.add(notification.id)
    return true
  })
}

/**
 * Remove expired notifications
 */
function removeExpiredNotifications(notifications: Notification[]): Notification[] {
  const now = new Date()
  return notifications.filter(notification => {
    if (!notification.expiresAt) return true
    return new Date(notification.expiresAt) > now
  })
}

/**
 * Get default notification triggers
 */
function getDefaultTriggers(): NotificationTrigger[] {
  return [
    { type: 'bill_due_soon', enabled: true, settings: { daysBefore: 3 } },
    { type: 'bill_overdue', enabled: true },
    { type: 'budget_over_allocated', enabled: true },
    { type: 'goal_milestone', enabled: true, settings: { milestones: [50, 75, 100] } },
    { type: 'goal_inactive', enabled: true, settings: { daysThreshold: 30 } },
    { type: 'large_transaction', enabled: true, settings: { percentile: 90, minimumAmount: 100 } },
    { type: 'trial_ending', enabled: true, settings: { daysBefore: 3 } }
  ]
}

/**
 * Utility functions
 */
function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getEndOfMonth(monthStr: string): Date {
  const [year, month] = monthStr.split('-').map(Number)
  return new Date(year, month, 0) // Last day of the month
}

function formatDueDate(days: number): string {
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  return `in ${days} days`
}
