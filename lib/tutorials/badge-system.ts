// Badge system for tutorial gamification

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  emoji: string
  color: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  category: string
}

export const BADGES: Record<string, Badge> = {
  first_steps: {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Completed your first tutorial',
    icon: 'footprints',
    emoji: '👣',
    color: 'blue',
    rarity: 'common',
    category: 'getting-started'
  },
  dashboard_master: {
    id: 'dashboard_master',
    name: 'Dashboard Master',
    description: 'Mastered the financial overview dashboard',
    icon: 'gauge',
    emoji: '📊',
    color: 'purple',
    rarity: 'rare',
    category: 'dashboard'
  },
  budget_boss: {
    id: 'budget_boss',
    name: 'Budget Boss',
    description: 'Conquered zero-based budgeting',
    icon: 'wallet',
    emoji: '💰',
    color: 'green',
    rarity: 'epic',
    category: 'budget'
  },
  income_pro: {
    id: 'income_pro',
    name: 'Income Pro',
    description: 'Expert at tracking income sources',
    icon: 'dollar-sign',
    emoji: '💵',
    color: 'emerald',
    rarity: 'rare',
    category: 'income'
  },
  bills_master: {
    id: 'bills_master',
    name: 'Bills Master',
    description: 'Never misses a payment',
    icon: 'calendar-check',
    emoji: '📋',
    color: 'blue',
    rarity: 'rare',
    category: 'bills'
  },
  debt_sensei: {
    id: 'debt_sensei',
    name: 'Debt Sensei',
    description: 'Master of debt elimination strategies',
    icon: 'sword',
    emoji: '💳',
    color: 'red',
    rarity: 'epic',
    category: 'debts'
  },
  goal_crusher: {
    id: 'goal_crusher',
    name: 'Goal Crusher',
    description: 'Sets and achieves financial goals',
    icon: 'target',
    emoji: '🎯',
    color: 'orange',
    rarity: 'epic',
    category: 'goals'
  },
  analytics_ace: {
    id: 'analytics_ace',
    name: 'Analytics Ace',
    description: 'Understands financial patterns and trends',
    icon: 'trending-up',
    emoji: '📈',
    color: 'indigo',
    rarity: 'rare',
    category: 'reports'
  },
  investment_guru: {
    id: 'investment_guru',
    name: 'Investment Guru',
    description: 'Understands the power of compound growth',
    icon: 'line-chart',
    emoji: '📊',
    color: 'violet',
    rarity: 'epic',
    category: 'investments'
  },
  trailblazer: {
    id: 'trailblazer',
    name: 'Trailblazer',
    description: 'Completed all tutorials',
    icon: 'rocket',
    emoji: '🚀',
    color: 'gold',
    rarity: 'legendary',
    category: 'achievement'
  },
  transaction_tracker: {
    id: 'transaction_tracker',
    name: 'Transaction Tracker',
    description: 'Expert at managing transactions',
    icon: 'receipt',
    emoji: '🧾',
    color: 'cyan',
    rarity: 'rare',
    category: 'transactions'
  },
  foxy_friend: {
    id: 'foxy_friend',
    name: 'Foxy Friend',
    description: 'Had your first chat with Foxy AI',
    icon: 'message-circle',
    emoji: '🦊',
    color: 'orange',
    rarity: 'common',
    category: 'ai-coach'
  },
  quiz_champion: {
    id: 'quiz_champion',
    name: 'Quiz Champion',
    description: 'Aced 5 tutorial quizzes',
    icon: 'brain',
    emoji: '🧠',
    color: 'purple',
    rarity: 'epic',
    category: 'knowledge'
  },
  streak_master: {
    id: 'streak_master',
    name: 'Streak Master',
    description: 'Completed tutorials 3 days in a row',
    icon: 'flame',
    emoji: '🔥',
    color: 'red',
    rarity: 'rare',
    category: 'engagement'
  },
  money_saver: {
    id: 'money_saver',
    name: 'Money Saver',
    description: 'Set up your first savings goal',
    icon: 'piggy-bank',
    emoji: '🏦',
    color: 'green',
    rarity: 'common',
    category: 'goals'
  }
}

export function getBadge(badgeId: string): Badge | null {
  return BADGES[badgeId] || null
}

export function getBadgesByCategory(category: string): Badge[] {
  return Object.values(BADGES).filter(badge => badge.category === category)
}

export function getBadgesByRarity(rarity: Badge['rarity']): Badge[] {
  return Object.values(BADGES).filter(badge => badge.rarity === rarity)
}

export function calculateBadgeProgress(earnedBadges: string[]): {
  total: number
  earned: number
  percentage: number
  nextBadge?: Badge
} {
  const totalBadges = Object.keys(BADGES).length
  const earnedCount = earnedBadges.length
  const percentage = Math.floor((earnedCount / totalBadges) * 100)
  
  // Find next badge to earn (prioritize by rarity and category)
  const unearned = Object.values(BADGES).filter(badge => !earnedBadges.includes(badge.id))
  const nextBadge = unearned.sort((a, b) => {
    const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3 }
    return rarityOrder[a.rarity] - rarityOrder[b.rarity]
  })[0]

  return {
    total: totalBadges,
    earned: earnedCount,
    percentage,
    nextBadge
  }
}

export const BADGE_COLORS = {
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  green: 'bg-green-100 text-green-800 border-green-200',
  purple: 'bg-purple-100 text-purple-800 border-purple-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  orange: 'bg-orange-100 text-orange-800 border-orange-200',
  emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  violet: 'bg-violet-100 text-violet-800 border-violet-200',
  cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  gold: 'bg-yellow-100 text-yellow-800 border-yellow-200'
}

export const RARITY_COLORS = {
  common: 'text-gray-600',
  rare: 'text-blue-600',
  epic: 'text-purple-600',
  legendary: 'text-yellow-600'
}

export function getBadgeDetails(badgeId: string): Badge | undefined {
  return BADGES[badgeId]
}
