// Debt autopay system with real notifications

import { DebtAccount, DebtPayment } from '@/lib/types/debts'
import { calculatePaymentAllocation } from '@/lib/debt-payoff-engine'

export interface AutopaySchedule {
  id: string
  debtId: string
  accountId: string
  amount: number
  dueDay: number // 1-31 or -1 for last day of month
  timezone: string
  enabled: boolean
  lastProcessed?: string
  nextDue: string
  failureCount: number
  maxRetries: number
}

export interface NotificationRule {
  id: string
  userId: string
  type: 'upcoming_due' | 'autopay_success' | 'autopay_failed' | 'overdue' | 'promo_ending'
  enabled: boolean
  daysBeforeDue?: number // for upcoming_due notifications
  channels: ('in_app' | 'email' | 'push')[]
}

export interface DebtNotification {
  id: string
  userId: string
  debtId: string
  type: NotificationRule['type']
  title: string
  message: string
  data: Record<string, any>
  read: boolean
  createdAt: string
  scheduledFor?: string
}

/**
 * Process autopay for all eligible debts
 * This would typically run as a daily cron job
 */
export async function processAutopay(
  debts: DebtAccount[],
  schedules: AutopaySchedule[],
  currentDate: Date = new Date()
): Promise<{
  processed: number
  failed: number
  notifications: DebtNotification[]
}> {
  const results = {
    processed: 0,
    failed: 0,
    notifications: [] as DebtNotification[]
  }

  const today = currentDate.toISOString().split('T')[0]

  for (const schedule of schedules) {
    if (!schedule.enabled) continue

    const debt = debts.find(d => d.id === schedule.debtId)
    if (!debt || debt.archivedAt) continue

    // Check if payment is due today
    if (!isPaymentDueToday(schedule, currentDate)) continue

    // Skip if already processed today
    if (schedule.lastProcessed === today) continue

    try {
      // Attempt autopay
      const success = await executeAutopay(debt, schedule, currentDate)
      
      if (success) {
        results.processed++
        
        // Create success notification
        results.notifications.push({
          id: `notif_${Date.now()}_${schedule.id}`,
          userId: debt.userId,
          debtId: debt.id,
          type: 'autopay_success',
          title: 'Autopay Successful',
          message: `$${schedule.amount} payment processed for ${debt.name}`,
          data: {
            debtName: debt.name,
            amount: schedule.amount,
            newBalance: debt.principalBalance - calculatePaymentAllocation(debt, schedule.amount).principal
          },
          read: false,
          createdAt: new Date().toISOString()
        })
      } else {
        results.failed++
        
        // Increment failure count
        schedule.failureCount++
        
        // Create failure notification
        results.notifications.push({
          id: `notif_${Date.now()}_${schedule.id}`,
          userId: debt.userId,
          debtId: debt.id,
          type: 'autopay_failed',
          title: 'Autopay Failed',
          message: `Unable to process $${schedule.amount} payment for ${debt.name}. Please check your account balance.`,
          data: {
            debtName: debt.name,
            amount: schedule.amount,
            failureReason: 'insufficient_funds', // or other reasons
            retryCount: schedule.failureCount
          },
          read: false,
          createdAt: new Date().toISOString()
        })

        // Disable autopay after max retries
        if (schedule.failureCount >= schedule.maxRetries) {
          schedule.enabled = false
          
          results.notifications.push({
            id: `notif_${Date.now()}_${schedule.id}_disabled`,
            userId: debt.userId,
            debtId: debt.id,
            type: 'autopay_failed',
            title: 'Autopay Disabled',
            message: `Autopay has been disabled for ${debt.name} after ${schedule.maxRetries} failed attempts.`,
            data: {
              debtName: debt.name,
              maxRetries: schedule.maxRetries
            },
            read: false,
            createdAt: new Date().toISOString()
          })
        }
      }

      // Update last processed date
      schedule.lastProcessed = today

    } catch (error) {
      console.error(`Autopay error for debt ${debt.id}:`, error)
      results.failed++
    }
  }

  return results
}

/**
 * Check if payment is due today
 */
function isPaymentDueToday(schedule: AutopaySchedule, currentDate: Date): boolean {
  const today = currentDate.getDate()
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()

  if (schedule.dueDay === -1) {
    // Last day of month
    return today === lastDayOfMonth
  } else {
    // Specific day of month
    return today === schedule.dueDay || (schedule.dueDay > lastDayOfMonth && today === lastDayOfMonth)
  }
}

/**
 * Execute autopay for a specific debt
 */
async function executeAutopay(
  debt: DebtAccount,
  schedule: AutopaySchedule,
  currentDate: Date
): Promise<boolean> {
  try {
    // In a real implementation, this would:
    // 1. Check account balance
    // 2. Create payment transaction
    // 3. Update debt balance
    // 4. Create DebtPayment record
    // 5. Update budget categories

    // Simulate payment processing
    const paymentRequest = {
      debtId: debt.id,
      amount: schedule.amount,
      date: currentDate.toISOString().split('T')[0],
      accountId: schedule.accountId,
      assignToMonth: 'current' as const,
      note: 'Autopay payment'
    }

    // This would call the actual payment API
    const response = await fetch(`/api/debts/${debt.id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentRequest)
    })

    return response.ok

  } catch (error) {
    console.error('Autopay execution failed:', error)
    return false
  }
}

/**
 * Generate upcoming due notifications
 */
export function generateUpcomingDueNotifications(
  debts: DebtAccount[],
  rules: NotificationRule[],
  currentDate: Date = new Date()
): DebtNotification[] {
  const notifications: DebtNotification[] = []

  for (const debt of debts) {
    if (debt.archivedAt || debt.autopayEnabled) continue // Skip archived or autopay debts

    const rule = rules.find(r => r.type === 'upcoming_due' && r.enabled)
    if (!rule || !rule.daysBeforeDue) continue

    const dueDate = getNextDueDate(debt, currentDate)
    if (!dueDate) continue

    const daysUntilDue = Math.ceil((dueDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilDue === rule.daysBeforeDue) {
      notifications.push({
        id: `notif_${Date.now()}_${debt.id}_due`,
        userId: debt.userId,
        debtId: debt.id,
        type: 'upcoming_due',
        title: `Payment Due ${daysUntilDue === 1 ? 'Tomorrow' : `in ${daysUntilDue} days`}`,
        message: `${debt.name} payment of $${debt.minPayment} is due ${dueDate.toLocaleDateString()}`,
        data: {
          debtName: debt.name,
          amount: debt.minPayment,
          dueDate: dueDate.toISOString(),
          daysUntilDue
        },
        read: false,
        createdAt: new Date().toISOString(),
        scheduledFor: new Date().toISOString()
      })
    }
  }

  return notifications
}

/**
 * Generate overdue notifications
 */
export function generateOverdueNotifications(
  debts: DebtAccount[],
  rules: NotificationRule[],
  currentDate: Date = new Date()
): DebtNotification[] {
  const notifications: DebtNotification[] = []

  const rule = rules.find(r => r.type === 'overdue' && r.enabled)
  if (!rule) return notifications

  for (const debt of debts) {
    if (debt.archivedAt || debt.autopayEnabled) continue

    const dueDate = getNextDueDate(debt, currentDate)
    if (!dueDate) continue

    const daysOverdue = Math.floor((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysOverdue > 0) {
      notifications.push({
        id: `notif_${Date.now()}_${debt.id}_overdue`,
        userId: debt.userId,
        debtId: debt.id,
        type: 'overdue',
        title: 'Payment Overdue',
        message: `${debt.name} payment is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue. Minimum payment: $${debt.minPayment}`,
        data: {
          debtName: debt.name,
          amount: debt.minPayment,
          daysOverdue,
          dueDate: dueDate.toISOString()
        },
        read: false,
        createdAt: new Date().toISOString()
      })
    }
  }

  return notifications
}

/**
 * Generate promo ending notifications
 */
export function generatePromoEndingNotifications(
  debts: DebtAccount[],
  rules: NotificationRule[],
  currentDate: Date = new Date()
): DebtNotification[] {
  const notifications: DebtNotification[] = []

  const rule = rules.find(r => r.type === 'promo_ending' && r.enabled)
  if (!rule) return notifications

  for (const debt of debts) {
    if (debt.archivedAt || !debt.promo) continue

    const promoEndDate = new Date(debt.promo.endsOn)
    const daysUntilEnd = Math.ceil((promoEndDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))

    // Notify 45 days before promo ends
    if (daysUntilEnd === 45 || daysUntilEnd === 14 || daysUntilEnd === 3) {
      notifications.push({
        id: `notif_${Date.now()}_${debt.id}_promo`,
        userId: debt.userId,
        debtId: debt.id,
        type: 'promo_ending',
        title: 'Promotional Rate Ending Soon',
        message: `${debt.name} promotional rate (${debt.promo.rate}%) ends in ${daysUntilEnd} days. Consider paying down this balance before rates increase.`,
        data: {
          debtName: debt.name,
          currentRate: debt.promo.rate,
          regularRate: debt.apr,
          endDate: debt.promo.endsOn,
          daysRemaining: daysUntilEnd
        },
        read: false,
        createdAt: new Date().toISOString()
      })
    }
  }

  return notifications
}

/**
 * Get next due date for a debt
 */
function getNextDueDate(debt: DebtAccount, currentDate: Date): Date | null {
  if (!debt.dueDay) return null

  const today = new Date(currentDate)
  let dueDate: Date

  if (debt.dueDay === -1) {
    // Last day of month
    dueDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  } else {
    // Specific day of month
    dueDate = new Date(today.getFullYear(), today.getMonth(), debt.dueDay)
    
    // If due date has passed this month, move to next month
    if (dueDate <= today) {
      dueDate = new Date(today.getFullYear(), today.getMonth() + 1, debt.dueDay)
    }
  }

  return dueDate
}

/**
 * Create default notification rules for a user
 */
export function createDefaultNotificationRules(userId: string): NotificationRule[] {
  return [
    {
      id: `rule_${userId}_upcoming_3`,
      userId,
      type: 'upcoming_due',
      enabled: true,
      daysBeforeDue: 3,
      channels: ['in_app', 'email']
    },
    {
      id: `rule_${userId}_upcoming_7`,
      userId,
      type: 'upcoming_due',
      enabled: true,
      daysBeforeDue: 7,
      channels: ['in_app']
    },
    {
      id: `rule_${userId}_autopay_success`,
      userId,
      type: 'autopay_success',
      enabled: true,
      channels: ['in_app']
    },
    {
      id: `rule_${userId}_autopay_failed`,
      userId,
      type: 'autopay_failed',
      enabled: true,
      channels: ['in_app', 'email']
    },
    {
      id: `rule_${userId}_overdue`,
      userId,
      type: 'overdue',
      enabled: true,
      channels: ['in_app', 'email']
    },
    {
      id: `rule_${userId}_promo_ending`,
      userId,
      type: 'promo_ending',
      enabled: true,
      channels: ['in_app', 'email']
    }
  ]
}
