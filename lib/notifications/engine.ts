// In-App Notifications Engine
// Lightweight, safe notifications without external providers

export type NotificationType = 
  | 'bill_due_soon'
  | 'bill_overdue' 
  | 'overspend_today'
  | 'income_unassigned'
  | 'goal_milestone'
  | 'budget_over_allocated'
  | 'category_underfunded'

export interface NotificationRule {
  type: NotificationType
  enabled: boolean
  settings: Record<string, any>
}

export interface NotificationData {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  actionUrl?: string
  priority: 'low' | 'medium' | 'high'
  seenAt?: string
  dismissedAt?: string
  expiresAt?: string
  contextType?: string
  contextId?: string
  contextDate?: string
  createdAt: string
}

export interface NotificationContext {
  bills: any[]
  budgetItems: any[]
  categories: any[]
  transactions: any[]
  goals: any[]
  recurringIncome: any[]
  currentMonth: string
  today: string
}

/**
 * Generate notifications based on current financial data
 */
export function generateNotifications(
  context: NotificationContext,
  existingNotifications: NotificationData[] = [],
  rules: NotificationRule[] = getDefaultRules()
): NotificationData[] {
  const newNotifications: NotificationData[] = []

  for (const rule of rules) {
    if (!rule.enabled) continue

    const notifications = generateNotificationsForRule(rule, context, existingNotifications)
    newNotifications.push(...notifications)
  }

  return newNotifications
}

/**
 * Generate notifications for a specific rule
 */
function generateNotificationsForRule(
  rule: NotificationRule,
  context: NotificationContext,
  existingNotifications: NotificationData[]
): NotificationData[] {
  const notifications: NotificationData[] = []

  switch (rule.type) {
    case 'bill_due_soon':
      notifications.push(...generateBillDueSoonNotifications(context, rule.settings))
      break
    
    case 'bill_overdue':
      notifications.push(...generateBillOverdueNotifications(context, rule.settings))
      break
    
    case 'overspend_today':
      notifications.push(...generateOverspendTodayNotifications(context, rule.settings))
      break
    
    case 'income_unassigned':
      notifications.push(...generateIncomeUnassignedNotifications(context, rule.settings))
      break
    
    case 'goal_milestone':
      notifications.push(...generateGoalMilestoneNotifications(context, rule.settings))
      break
    
    case 'budget_over_allocated':
      notifications.push(...generateBudgetOverAllocatedNotifications(context, rule.settings))
      break
    
    case 'category_underfunded':
      notifications.push(...generateCategoryUnderfundedNotifications(context, rule.settings))
      break
  }

  // Filter out duplicates
  return notifications.filter(notification => 
    !isDuplicateNotification(notification, existingNotifications)
  )
}

function generateBillDueSoonNotifications(
  context: NotificationContext,
  settings: any
): NotificationData[] {
  const notifications: NotificationData[] = []
  const daysAhead = settings.daysAhead || 3
  const today = new Date()
  const cutoffDate = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000)

  const dueSoonBills = context.bills.filter((bill: any) => {
    if (bill.isPaid) return false
    const dueDate = new Date(bill.dueDate)
    return dueDate >= today && dueDate <= cutoffDate
  })

  for (const bill of dueSoonBills) {
    const dueDate = new Date(bill.dueDate)
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    notifications.push({
      id: `bill_due_${bill.id}_${context.today}`,
      userId: context.bills[0]?.userId || '', // Assuming userId is available
      type: 'bill_due_soon',
      title: 'Bill Due Soon',
      message: `${bill.name} (${formatCurrency(bill.amount)}) is due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`,
      actionUrl: `/bills?bill=${bill.id}`,
      priority: daysUntilDue <= 1 ? 'high' : 'medium',
      expiresAt: dueDate.toISOString(),
      contextType: 'bill_id',
      contextId: bill.id,
      contextDate: context.today,
      createdAt: new Date().toISOString()
    })
  }

  return notifications
}

function generateBillOverdueNotifications(
  context: NotificationContext,
  settings: any
): NotificationData[] {
  const notifications: NotificationData[] = []
  const today = new Date()

  const overdueBills = context.bills.filter((bill: any) => {
    if (bill.isPaid) return false
    const dueDate = new Date(bill.dueDate)
    return dueDate < today
  })

  for (const bill of overdueBills) {
    const dueDate = new Date(bill.dueDate)
    const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    
    notifications.push({
      id: `bill_overdue_${bill.id}_${context.today}`,
      userId: context.bills[0]?.userId || '',
      type: 'bill_overdue',
      title: 'Bill Overdue',
      message: `${bill.name} (${formatCurrency(bill.amount)}) is ${daysOverdue} day${daysOverdue === 1 ? '' : 's'} overdue`,
      actionUrl: `/bills?bill=${bill.id}&pay=true`,
      priority: 'high',
      contextType: 'bill_id',
      contextId: bill.id,
      contextDate: context.today,
      createdAt: new Date().toISOString()
    })
  }

  return notifications
}

function generateOverspendTodayNotifications(
  context: NotificationContext,
  settings: any
): NotificationData[] {
  const notifications: NotificationData[] = []
  
  // Find categories that went into the red today
  const todayTransactions = context.transactions.filter((txn: any) => 
    txn.date === context.today && txn.type === 'outflow'
  )

  for (const transaction of todayTransactions) {
    if (!transaction.categoryId) continue

    const budgetItem = context.budgetItems.find((item: any) => 
      item.categoryId === transaction.categoryId && item.month === context.currentMonth
    )

    if (!budgetItem) continue

    const assigned = parseFloat(budgetItem.assigned) || 0
    const spent = parseFloat(budgetItem.spent) || 0
    const available = assigned - spent

    // Check if this transaction caused overspending
    if (available < 0 && (available + Math.abs(transaction.amount)) >= 0) {
      const category = context.categories.find((cat: any) => cat.id === transaction.categoryId)
      
      notifications.push({
        id: `overspend_${transaction.categoryId}_${context.today}`,
        userId: transaction.userId || '',
        type: 'overspend_today',
        title: 'Category Overspent',
        message: `${category?.name || 'Category'} went over budget by ${formatCurrency(Math.abs(available))} today`,
        actionUrl: `/budget?category=${transaction.categoryId}&rebalance=true`,
        priority: 'high',
        contextType: 'category_id',
        contextId: transaction.categoryId,
        contextDate: context.today,
        createdAt: new Date().toISOString()
      })
    }
  }

  return notifications
}

function generateIncomeUnassignedNotifications(
  context: NotificationContext,
  settings: any
): NotificationData[] {
  const notifications: NotificationData[] = []
  
  // Calculate unassigned income
  const expectedIncome = context.recurringIncome.reduce((total: number, income: any) => {
    if (!income.active) return total
    return total + (income.amountCents / 100)
  }, 0)

  const currentMonthItems = context.budgetItems.filter((item: any) => item.month === context.currentMonth)
  const totalAssigned = currentMonthItems.reduce((sum: number, item: any) => 
    sum + (parseFloat(item.assigned) || 0), 0)

  const unassigned = expectedIncome - totalAssigned
  const threshold = settings.threshold || 100 // $100 threshold

  if (unassigned >= threshold) {
    notifications.push({
      id: `income_unassigned_${context.currentMonth}_${context.today}`,
      userId: context.budgetItems[0]?.userId || '',
      type: 'income_unassigned',
      title: 'Income Needs Assignment',
      message: `You have ${formatCurrency(unassigned)} in Ready to Assign that hasn't been allocated to categories`,
      actionUrl: `/budget?auto_assign=true`,
      priority: unassigned > 500 ? 'high' : 'medium',
      contextType: 'month',
      contextId: context.currentMonth,
      contextDate: context.today,
      createdAt: new Date().toISOString()
    })
  }

  return notifications
}

function generateGoalMilestoneNotifications(
  context: NotificationContext,
  settings: any
): NotificationData[] {
  const notifications: NotificationData[] = []
  const milestones = settings.milestones || [25, 50, 75, 100]

  for (const goal of context.goals) {
    if (goal.status !== 'ACTIVE') continue

    const contributions = goal.contributions || []
    const totalContributed = contributions.reduce((sum: number, c: any) => sum + c.amount, 0)
    const progress = goal.targetAmount > 0 ? (totalContributed / goal.targetAmount) * 100 : 0

    // Check if we've hit a milestone
    for (const milestone of milestones) {
      if (progress >= milestone && progress < milestone + 5) { // Within 5% of milestone
        // Check if we haven't already notified for this milestone
        const milestoneKey = `${goal.id}_${milestone}`
        
        notifications.push({
          id: `goal_milestone_${milestoneKey}_${context.today}`,
          userId: goal.userId,
          type: 'goal_milestone',
          title: 'Goal Milestone Reached!',
          message: `🎉 ${goal.name} is ${milestone}% complete! You've saved ${formatCurrency(totalContributed)} of ${formatCurrency(goal.targetAmount)}`,
          actionUrl: `/goals?goal=${goal.id}`,
          priority: milestone === 100 ? 'high' : 'medium',
          contextType: 'goal_milestone',
          contextId: milestoneKey,
          contextDate: context.today,
          createdAt: new Date().toISOString()
        })
      }
    }
  }

  return notifications
}

function generateBudgetOverAllocatedNotifications(
  context: NotificationContext,
  settings: any
): NotificationData[] {
  const notifications: NotificationData[] = []
  
  // Calculate RTA
  const expectedIncome = context.recurringIncome.reduce((total: number, income: any) => {
    if (!income.active) return total
    return total + (income.amountCents / 100)
  }, 0)

  const currentMonthItems = context.budgetItems.filter((item: any) => item.month === context.currentMonth)
  const totalAssigned = currentMonthItems.reduce((sum: number, item: any) => 
    sum + (parseFloat(item.assigned) || 0), 0)

  const rta = expectedIncome - totalAssigned

  if (rta < -10) { // Over-allocated by more than $10
    notifications.push({
      id: `budget_over_allocated_${context.currentMonth}_${context.today}`,
      userId: context.budgetItems[0]?.userId || '',
      type: 'budget_over_allocated',
      title: 'Budget Over-Allocated',
      message: `Your budget is over-allocated by ${formatCurrency(Math.abs(rta))}. You've assigned more than your expected income.`,
      actionUrl: `/budget?rebalance=true`,
      priority: 'high',
      contextType: 'month',
      contextId: context.currentMonth,
      contextDate: context.today,
      createdAt: new Date().toISOString()
    })
  }

  return notifications
}

function generateCategoryUnderfundedNotifications(
  context: NotificationContext,
  settings: any
): NotificationData[] {
  const notifications: NotificationData[] = []
  const threshold = settings.threshold || 0.8 // 80% of target

  for (const category of context.categories) {
    if (!category.targetEnabled || !category.targetAmount) continue

    const budgetItem = context.budgetItems.find((item: any) => 
      item.categoryId === category.id && item.month === context.currentMonth
    )

    const assigned = budgetItem ? parseFloat(budgetItem.assigned) || 0 : 0
    const targetAmount = parseFloat(category.targetAmount) || 0
    const fundingRatio = targetAmount > 0 ? assigned / targetAmount : 1

    if (fundingRatio < threshold) {
      const needed = targetAmount - assigned
      
      notifications.push({
        id: `category_underfunded_${category.id}_${context.currentMonth}`,
        userId: category.userId,
        type: 'category_underfunded',
        title: 'Category Underfunded',
        message: `${category.name} needs ${formatCurrency(needed)} more to reach its target of ${formatCurrency(targetAmount)}`,
        actionUrl: `/budget?fund=${category.id}&amount=${needed}`,
        priority: 'medium',
        contextType: 'category_id',
        contextId: category.id,
        contextDate: context.today,
        createdAt: new Date().toISOString()
      })
    }
  }

  return notifications
}

/**
 * Check if notification is duplicate
 */
function isDuplicateNotification(
  notification: NotificationData,
  existingNotifications: NotificationData[]
): boolean {
  return existingNotifications.some(existing => 
    existing.type === notification.type &&
    existing.contextType === notification.contextType &&
    existing.contextId === notification.contextId &&
    existing.contextDate === notification.contextDate &&
    !existing.dismissedAt // Only check non-dismissed notifications
  )
}

/**
 * Mark notification as seen
 */
export function markNotificationAsSeen(
  notificationId: string,
  notifications: NotificationData[]
): NotificationData[] {
  return notifications.map(notification =>
    notification.id === notificationId
      ? { ...notification, seenAt: new Date().toISOString() }
      : notification
  )
}

/**
 * Mark notification as dismissed
 */
export function dismissNotification(
  notificationId: string,
  notifications: NotificationData[]
): NotificationData[] {
  return notifications.map(notification =>
    notification.id === notificationId
      ? { ...notification, dismissedAt: new Date().toISOString() }
      : notification
  )
}

/**
 * Clean up expired notifications
 */
export function cleanupExpiredNotifications(notifications: NotificationData[]): NotificationData[] {
  const now = new Date()
  return notifications.filter(notification => {
    if (!notification.expiresAt) return true
    return new Date(notification.expiresAt) > now
  })
}

/**
 * Get default notification rules
 */
export function getDefaultRules(): NotificationRule[] {
  return [
    {
      type: 'bill_due_soon',
      enabled: true,
      settings: { daysAhead: 3 }
    },
    {
      type: 'bill_overdue',
      enabled: true,
      settings: {}
    },
    {
      type: 'overspend_today',
      enabled: true,
      settings: {}
    },
    {
      type: 'income_unassigned',
      enabled: true,
      settings: { threshold: 100 }
    },
    {
      type: 'goal_milestone',
      enabled: true,
      settings: { milestones: [25, 50, 75, 100] }
    },
    {
      type: 'budget_over_allocated',
      enabled: true,
      settings: {}
    },
    {
      type: 'category_underfunded',
      enabled: false, // Disabled by default to avoid spam
      settings: { threshold: 0.8 }
    }
  ]
}

/**
 * Get notification display info
 */
export function getNotificationDisplayInfo(notification: NotificationData) {
  const icons: Record<NotificationType, string> = {
    bill_due_soon: 'Calendar',
    bill_overdue: 'AlertTriangle',
    overspend_today: 'TrendingDown',
    income_unassigned: 'DollarSign',
    goal_milestone: 'Target',
    budget_over_allocated: 'AlertTriangle',
    category_underfunded: 'TrendingDown'
  }

  const colors: Record<NotificationType, string> = {
    bill_due_soon: 'text-yellow-600',
    bill_overdue: 'text-red-600',
    overspend_today: 'text-red-600',
    income_unassigned: 'text-orange-600',
    goal_milestone: 'text-green-600',
    budget_over_allocated: 'text-red-600',
    category_underfunded: 'text-yellow-600'
  }

  return {
    icon: icons[notification.type] || 'Info',
    color: colors[notification.type] || 'text-gray-600'
  }
}

// Helper function
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}
