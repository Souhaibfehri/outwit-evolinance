// Badge system configuration for Foxy AI Coach

export interface BadgeConfig {
  id: string
  title: string
  description: string
  icon: string
  category: string
  unlockRule: {
    event: string
    threshold?: number
    conditions?: any
  }
  color: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export const BADGES: BadgeConfig[] = [
  // Tutorial Badges
  {
    id: 'first_steps',
    title: 'First Steps',
    description: 'Started your financial journey with Outwit Budget',
    icon: 'Footprints',
    category: 'tutorial',
    unlockRule: {
      event: 'view_dashboard'
    },
    color: 'blue',
    rarity: 'common'
  },

  {
    id: 'budget_explorer',
    title: 'Budget Explorer',
    description: 'Learned the basics of zero-based budgeting',
    icon: 'Compass',
    category: 'budget',
    unlockRule: {
      event: 'create_category'
    },
    color: 'green',
    rarity: 'common'
  },

  {
    id: 'debt_sensei',
    title: 'Debt Sensei',
    description: 'Mastered debt payoff strategies with the simulator',
    icon: 'Zap',
    category: 'debts',
    unlockRule: {
      event: 'run_debt_sim'
    },
    color: 'purple',
    rarity: 'rare'
  },

  {
    id: 'trailblazer',
    title: 'Trailblazer',
    description: 'Completed the full Outwit Budget tutorial',
    icon: 'Trophy',
    category: 'tutorial',
    unlockRule: {
      event: 'complete_tutorial'
    },
    color: 'gold',
    rarity: 'epic'
  },

  // Activity Badges
  {
    id: 'csv_master',
    title: 'CSV Master',
    description: 'Imported or exported data like a pro',
    icon: 'FileSpreadsheet',
    category: 'data',
    unlockRule: {
      event: 'csv_operation'
    },
    color: 'orange',
    rarity: 'common'
  },

  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Stayed active for 7 days straight',
    icon: 'Flame',
    category: 'engagement',
    unlockRule: {
      event: 'daily_activity',
      threshold: 7
    },
    color: 'red',
    rarity: 'rare'
  },

  {
    id: 'goal_achiever',
    title: 'Goal Achiever',
    description: 'Reached your first savings goal',
    icon: 'Target',
    category: 'goals',
    unlockRule: {
      event: 'goal_completed'
    },
    color: 'green',
    rarity: 'rare'
  },

  {
    id: 'budget_master',
    title: 'Budget Master',
    description: 'Successfully balanced your budget for a full month',
    icon: 'Crown',
    category: 'budget',
    unlockRule: {
      event: 'month_balanced'
    },
    color: 'gold',
    rarity: 'epic'
  },

  {
    id: 'transaction_tracker',
    title: 'Transaction Tracker',
    description: 'Added 50+ transactions',
    icon: 'Activity',
    category: 'transactions',
    unlockRule: {
      event: 'add_transaction',
      threshold: 50
    },
    color: 'blue',
    rarity: 'rare'
  },

  {
    id: 'debt_destroyer',
    title: 'Debt Destroyer',
    description: 'Paid off your first debt completely',
    icon: 'Shield',
    category: 'debts',
    unlockRule: {
      event: 'debt_paid_off'
    },
    color: 'purple',
    rarity: 'epic'
  },

  {
    id: 'investment_guru',
    title: 'Investment Guru',
    description: 'Set up recurring investments for the future',
    icon: 'TrendingUp',
    category: 'investments',
    unlockRule: {
      event: 'add_investment_rule'
    },
    color: 'green',
    rarity: 'rare'
  },

  {
    id: 'notification_ninja',
    title: 'Notification Ninja',
    description: 'Configured smart notifications for bills and goals',
    icon: 'Bell',
    category: 'notifications',
    unlockRule: {
      event: 'enable_notifications'
    },
    color: 'blue',
    rarity: 'common'
  }
]

export const BADGE_CATEGORIES = [
  'tutorial',
  'budget',
  'debts',
  'goals',
  'transactions',
  'investments',
  'data',
  'engagement',
  'notifications'
] as const

export type BadgeCategoryType = typeof BADGE_CATEGORIES[number]

export const BADGE_RARITIES = {
  common: {
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    glow: 'shadow-gray-200 dark:shadow-gray-700'
  },
  rare: {
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200',
    glow: 'shadow-blue-200 dark:shadow-blue-700'
  },
  epic: {
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200',
    glow: 'shadow-purple-200 dark:shadow-purple-700'
  },
  legendary: {
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200',
    glow: 'shadow-yellow-200 dark:shadow-yellow-700'
  }
} as const
