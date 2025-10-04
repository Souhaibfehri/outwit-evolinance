// Goals data model with contributions, planning, and notifications

export type GoalStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED'

export type ContributionSource = 
  | 'RTA'           // From Ready-to-Assign (creates expense)
  | 'TRANSFER'      // Transfer from account (no expense)
  | 'ONE_OFF'       // One-off income allocation
  | 'ROUND_UP'      // Round-up accumulation
  | 'QUICK_CATCH_UP' // Quick catch-up contribution

export interface Goal {
  id: string
  userId: string
  name: string
  priority: number // 1-5 (5 = highest)
  targetAmount: number
  currency: string // ISO-4217
  targetDate?: string // ISO date
  categoryId?: string // Budget category for tracking
  fundingAccountId?: string // Default funding account
  notifyEnabled: boolean
  notifyRules?: {
    daysBefore?: number[] // [30, 7, 1]
    offPace?: boolean
    milestone?: number[] // [25, 50, 75, 100]
  }
  status: GoalStatus
  createdAt: string
  updatedAt: string
}

export interface GoalContribution {
  id: string
  goalId: string
  userId: string
  date: string // ISO date
  amount: number // Native currency
  amountBase?: number // Base currency if multi-currency
  fxRateUsed?: number // Exchange rate used
  source: ContributionSource
  accountId?: string // Source account
  transactionId?: string // Linked transaction
  note?: string
  createdAt: string
}

export interface GoalPlan {
  id: string
  goalId: string
  month: string // 'YYYY-MM'
  planned: number // Planned contribution amount
  createdAt: string
}

export interface GoalMilestone {
  id: string
  goalId: string
  percent: number // 25, 50, 75, 100
  reachedAt: string
}

// Computed properties for UI
export interface GoalWithProgress extends Goal {
  savedAmount: number
  progressPercent: number
  eta?: string // Estimated completion date
  isOnPace: boolean
  monthsRemaining?: number
  contributions: GoalContribution[]
  milestones: GoalMilestone[]
  plannedThisMonth?: number
}

export interface GoalKPIs {
  totalGoals: number
  activeGoals: number
  completedGoals: number
  totalSaved: number
  totalTarget: number
  overallProgress: number
  thisMonthPlanned: number
  thisMonthContributed: number
  topGoal?: {
    id: string
    name: string
    progress: number
    eta?: string
  }
}

// Form interfaces
export interface CreateGoalRequest {
  name: string
  priority: number
  targetAmount: number
  currency?: string
  targetDate?: string
  categoryId?: string
  fundingAccountId?: string
  notifyEnabled?: boolean
  notifyRules?: Goal['notifyRules']
  plannedMonthlyAmount?: number // Optional initial plan
}

export interface UpdateGoalRequest {
  name?: string
  priority?: number
  targetAmount?: number
  targetDate?: string
  categoryId?: string
  fundingAccountId?: string
  notifyEnabled?: boolean
  notifyRules?: Goal['notifyRules']
  status?: GoalStatus
}

export interface ContributeToGoalRequest {
  goalId: string
  amount: number
  date?: string
  source: ContributionSource
  accountId?: string
  assignToMonth?: 'current' | 'next'
  note?: string
}

export interface GoalAllocationStrategy {
  type: 'priority' | 'time_to_target' | 'even_split' | 'custom'
  customAllocations?: Record<string, number> // goalId -> amount
}

export interface AllocateRTARequest {
  strategy: GoalAllocationStrategy
  totalAmount: number
  fundNow?: boolean // Create contributions immediately
}

// Notification types
export interface GoalNotification {
  id: string
  userId: string
  goalId: string
  type: 'milestone' | 'off_pace' | 'target_approaching' | 'goal_completed'
  title: string
  message: string
  data: Record<string, any>
  read: boolean
  createdAt: string
}

// Helper functions
export function calculateGoalProgress(
  goal: Goal,
  contributions: GoalContribution[]
): {
  savedAmount: number
  progressPercent: number
  eta?: string
  isOnPace: boolean
  monthsRemaining?: number
} {
  const savedAmount = contributions.reduce((sum, contrib) => sum + contrib.amount, 0)
  const progressPercent = goal.targetAmount > 0 ? (savedAmount / goal.targetAmount) * 100 : 0
  
  let eta: string | undefined
  let isOnPace = true
  let monthsRemaining: number | undefined

  if (goal.targetDate && goal.targetAmount > savedAmount) {
    const targetDate = new Date(goal.targetDate)
    const today = new Date()
    const monthsToTarget = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30))
    
    if (monthsToTarget > 0) {
      const remaining = goal.targetAmount - savedAmount
      const requiredMonthly = remaining / monthsToTarget
      
      // Estimate based on recent contribution rate
      const recentContributions = contributions
        .filter(c => new Date(c.date) >= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
      
      const avgMonthly = recentContributions.length > 0
        ? recentContributions.reduce((sum, c) => sum + c.amount, 0) / 3
        : 0

      if (avgMonthly > 0) {
        const estimatedMonths = remaining / avgMonthly
        eta = new Date(Date.now() + estimatedMonths * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        isOnPace = estimatedMonths <= monthsToTarget
        monthsRemaining = Math.ceil(estimatedMonths)
      } else {
        // No recent contributions, use target timeline
        eta = goal.targetDate
        isOnPace = false
        monthsRemaining = monthsToTarget
      }
    }
  }

  return {
    savedAmount,
    progressPercent: Math.min(100, progressPercent),
    eta,
    isOnPace,
    monthsRemaining
  }
}

export function getPriorityLabel(priority: number): string {
  switch (priority) {
    case 5: return 'Critical'
    case 4: return 'High'
    case 3: return 'Medium'
    case 2: return 'Low'
    case 1: return 'Someday'
    default: return 'Medium'
  }
}

export function getPriorityColor(priority: number): string {
  switch (priority) {
    case 5: return 'text-red-600 bg-red-100 border-red-200'
    case 4: return 'text-orange-600 bg-orange-100 border-orange-200'
    case 3: return 'text-blue-600 bg-blue-100 border-blue-200'
    case 2: return 'text-green-600 bg-green-100 border-green-200'
    case 1: return 'text-gray-600 bg-gray-100 border-gray-200'
    default: return 'text-blue-600 bg-blue-100 border-blue-200'
  }
}

export function getContributionSourceLabel(source: ContributionSource): string {
  switch (source) {
    case 'RTA': return 'Ready-to-Assign'
    case 'TRANSFER': return 'Account Transfer'
    case 'ONE_OFF': return 'One-off Income'
    case 'ROUND_UP': return 'Round-up'
    case 'QUICK_CATCH_UP': return 'Quick Catch-up'
    default: return source
  }
}

export function shouldTriggerMilestone(
  previousPercent: number,
  currentPercent: number,
  milestonePercent: number
): boolean {
  return previousPercent < milestonePercent && currentPercent >= milestonePercent
}

export function generateGoalNotifications(
  goals: GoalWithProgress[],
  currentDate: Date = new Date()
): GoalNotification[] {
  const notifications: GoalNotification[] = []

  goals.forEach(goal => {
    if (!goal.notifyEnabled) return

    // Off pace notifications
    if (goal.notifyRules?.offPace && !goal.isOnPace && goal.targetDate) {
      const targetDate = new Date(goal.targetDate)
      const daysUntilTarget = Math.ceil((targetDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysUntilTarget > 0 && daysUntilTarget <= 30) {
        notifications.push({
          id: `notif_${Date.now()}_${goal.id}_off_pace`,
          userId: goal.userId,
          goalId: goal.id,
          type: 'off_pace',
          title: 'Goal Behind Schedule',
          message: `${goal.name} is behind pace. You need $${((goal.targetAmount - goal.savedAmount) / (daysUntilTarget / 30)).toFixed(0)}/month to reach your target.`,
          data: {
            goalName: goal.name,
            remaining: goal.targetAmount - goal.savedAmount,
            daysLeft: daysUntilTarget,
            requiredMonthly: (goal.targetAmount - goal.savedAmount) / (daysUntilTarget / 30)
          },
          read: false,
          createdAt: new Date().toISOString()
        })
      }
    }

    // Target approaching notifications
    if (goal.notifyRules?.daysBefore && goal.targetDate) {
      const targetDate = new Date(goal.targetDate)
      const daysUntilTarget = Math.ceil((targetDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
      
      goal.notifyRules.daysBefore.forEach(daysBefore => {
        if (daysUntilTarget === daysBefore && goal.savedAmount < goal.targetAmount) {
          notifications.push({
            id: `notif_${Date.now()}_${goal.id}_approaching_${daysBefore}`,
            userId: goal.userId,
            goalId: goal.id,
            type: 'target_approaching',
            title: `Goal Deadline Approaching`,
            message: `${goal.name} target date is in ${daysBefore} days. You're ${goal.progressPercent.toFixed(1)}% complete.`,
            data: {
              goalName: goal.name,
              daysLeft: daysBefore,
              progress: goal.progressPercent,
              remaining: goal.targetAmount - goal.savedAmount
            },
            read: false,
            createdAt: new Date().toISOString()
          })
        }
      })
    }
  })

  return notifications
}
