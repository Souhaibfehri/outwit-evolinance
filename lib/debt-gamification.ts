// Debt gamification system with badges and achievements

export interface DebtBadge {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  category: 'progress' | 'strategy' | 'milestone' | 'education'
  unlockRule: {
    type: 'debt_paid_off' | 'interest_saved' | 'simulation_run' | 'method_used' | 'payment_streak' | 'balance_reduction'
    threshold?: number
    metadata?: Record<string, any>
  }
  points: number
  celebrationMessage: string
}

export const DEBT_BADGES: DebtBadge[] = [
  // Progress Badges
  {
    id: 'first_payment',
    name: 'First Step',
    description: 'Made your first debt payment',
    icon: '👣',
    rarity: 'common',
    category: 'progress',
    unlockRule: { type: 'debt_paid_off', threshold: 1 },
    points: 50,
    celebrationMessage: 'Every journey begins with a single step! 🎉'
  },
  {
    id: 'debt_destroyer',
    name: 'Debt Destroyer',
    description: 'Paid off your first debt completely',
    icon: '🔨',
    rarity: 'rare',
    category: 'milestone',
    unlockRule: { type: 'debt_paid_off', threshold: 1 },
    points: 200,
    celebrationMessage: 'One down, freedom ahead! You\'re unstoppable! 💪'
  },
  {
    id: 'debt_slayer',
    name: 'Debt Slayer',
    description: 'Paid off 3 debts completely',
    icon: '⚔️',
    rarity: 'epic',
    category: 'milestone',
    unlockRule: { type: 'debt_paid_off', threshold: 3 },
    points: 500,
    celebrationMessage: 'You\'re a debt-slaying legend! Three victories and counting! 🏆'
  },
  {
    id: 'debt_free',
    name: 'Debt-Free Warrior',
    description: 'Completely eliminated all debt',
    icon: '🏆',
    rarity: 'legendary',
    category: 'milestone',
    unlockRule: { type: 'debt_paid_off', threshold: 999 }, // Special handling needed
    points: 1000,
    celebrationMessage: 'DEBT-FREE! You\'ve achieved financial freedom! 🎊🎉🚀'
  },

  // Strategy Badges
  {
    id: 'avalanche_master',
    name: 'Avalanche Master',
    description: 'Used the Debt Avalanche method effectively',
    icon: '🏔️',
    rarity: 'rare',
    category: 'strategy',
    unlockRule: { type: 'method_used', metadata: { method: 'avalanche', months: 6 } },
    points: 150,
    celebrationMessage: 'Mathematical precision! You\'re saving maximum interest! 🧮'
  },
  {
    id: 'snowball_champion',
    name: 'Snowball Champion',
    description: 'Used the Debt Snowball method to build momentum',
    icon: '⛄',
    rarity: 'rare',
    category: 'strategy',
    unlockRule: { type: 'method_used', metadata: { method: 'snowball', months: 6 } },
    points: 150,
    celebrationMessage: 'Momentum master! Your snowball is growing stronger! 📈'
  },
  {
    id: 'interest_saver',
    name: 'Interest Saver',
    description: 'Saved $1,000+ in interest through strategic payments',
    icon: '💰',
    rarity: 'epic',
    category: 'strategy',
    unlockRule: { type: 'interest_saved', threshold: 1000 },
    points: 300,
    celebrationMessage: 'Smart money moves! You\'ve saved $1,000+ in interest! 🤑'
  },
  {
    id: 'interest_ninja',
    name: 'Interest Ninja',
    description: 'Saved $5,000+ in interest through strategic payments',
    icon: '🥷',
    rarity: 'legendary',
    category: 'strategy',
    unlockRule: { type: 'interest_saved', threshold: 5000 },
    points: 750,
    celebrationMessage: 'Interest ninja mode activated! $5,000+ saved! 🥷💨'
  },

  // Education Badges
  {
    id: 'debt_student',
    name: 'Debt Student',
    description: 'Ran your first debt payoff simulation',
    icon: '🎓',
    rarity: 'common',
    category: 'education',
    unlockRule: { type: 'simulation_run', threshold: 1 },
    points: 25,
    celebrationMessage: 'Knowledge is power! You\'re learning the ropes! 📚'
  },
  {
    id: 'simulation_expert',
    name: 'Simulation Expert',
    description: 'Ran 10+ debt payoff simulations',
    icon: '🧪',
    rarity: 'rare',
    category: 'education',
    unlockRule: { type: 'simulation_run', threshold: 10 },
    points: 100,
    celebrationMessage: 'Experimentation expert! You\'ve mastered the what-ifs! 🔬'
  },

  // Consistency Badges
  {
    id: 'consistent_payer',
    name: 'Consistent Payer',
    description: 'Made payments 3 months in a row',
    icon: '🔥',
    rarity: 'rare',
    category: 'progress',
    unlockRule: { type: 'payment_streak', threshold: 3 },
    points: 200,
    celebrationMessage: 'Consistency is key! Your payment streak is on fire! 🔥'
  },
  {
    id: 'debt_discipline',
    name: 'Debt Discipline',
    description: 'Made payments 12 months in a row',
    icon: '🎯',
    rarity: 'epic',
    category: 'progress',
    unlockRule: { type: 'payment_streak', threshold: 12 },
    points: 500,
    celebrationMessage: 'Discipline champion! A full year of consistent payments! 🎯'
  },

  // Reduction Badges
  {
    id: 'ten_percent_down',
    name: '10% Down',
    description: 'Reduced total debt by 10%',
    icon: '📉',
    rarity: 'common',
    category: 'progress',
    unlockRule: { type: 'balance_reduction', threshold: 10 },
    points: 75,
    celebrationMessage: '10% progress! You\'re making real headway! 📊'
  },
  {
    id: 'quarter_crusher',
    name: 'Quarter Crusher',
    description: 'Reduced total debt by 25%',
    icon: '💪',
    rarity: 'rare',
    category: 'progress',
    unlockRule: { type: 'balance_reduction', threshold: 25 },
    points: 150,
    celebrationMessage: 'Quarter way there! Your debt is shrinking fast! 💪'
  },
  {
    id: 'halfway_hero',
    name: 'Halfway Hero',
    description: 'Reduced total debt by 50%',
    icon: '🦸',
    rarity: 'epic',
    category: 'progress',
    unlockRule: { type: 'balance_reduction', threshold: 50 },
    points: 300,
    celebrationMessage: 'Halfway hero! You\'ve conquered half your debt mountain! 🦸‍♂️'
  },
  {
    id: 'final_stretch',
    name: 'Final Stretch',
    description: 'Reduced total debt by 75%',
    icon: '🏃‍♂️',
    rarity: 'epic',
    category: 'progress',
    unlockRule: { type: 'balance_reduction', threshold: 75 },
    points: 400,
    celebrationMessage: 'Final stretch! You can see the debt-free finish line! 🏃‍♂️💨'
  }
]

export interface DebtAchievement {
  id: string
  userId: string
  badgeId: string
  unlockedAt: string
  progress?: number
  metadata?: Record<string, any>
}

export interface DebtStreak {
  userId: string
  type: 'payment' | 'simulation' | 'balance_reduction'
  currentStreak: number
  longestStreak: number
  lastActivity: string
}

/**
 * Check for newly unlocked badges based on user activity
 */
export function checkBadgeUnlocks(
  userActivity: {
    totalDebtsPaidOff: number
    totalInterestSaved: number
    simulationsRun: number
    currentPaymentStreak: number
    debtReductionPercentage: number
    activeMethod?: 'avalanche' | 'snowball'
    methodUsageMonths?: number
  },
  currentBadges: string[]
): DebtBadge[] {
  const newBadges: DebtBadge[] = []

  for (const badge of DEBT_BADGES) {
    // Skip if already unlocked
    if (currentBadges.includes(badge.id)) continue

    let shouldUnlock = false

    switch (badge.unlockRule.type) {
      case 'debt_paid_off':
        if (badge.id === 'debt_free') {
          // Special case: all debts paid off (would need debt count check)
          shouldUnlock = userActivity.totalDebtsPaidOff > 0 && userActivity.debtReductionPercentage >= 100
        } else {
          shouldUnlock = userActivity.totalDebtsPaidOff >= (badge.unlockRule.threshold || 0)
        }
        break

      case 'interest_saved':
        shouldUnlock = userActivity.totalInterestSaved >= (badge.unlockRule.threshold || 0)
        break

      case 'simulation_run':
        shouldUnlock = userActivity.simulationsRun >= (badge.unlockRule.threshold || 0)
        break

      case 'payment_streak':
        shouldUnlock = userActivity.currentPaymentStreak >= (badge.unlockRule.threshold || 0)
        break

      case 'balance_reduction':
        shouldUnlock = userActivity.debtReductionPercentage >= (badge.unlockRule.threshold || 0)
        break

      case 'method_used':
        const requiredMethod = badge.unlockRule.metadata?.method
        const requiredMonths = badge.unlockRule.metadata?.months || 1
        shouldUnlock = userActivity.activeMethod === requiredMethod && 
                      (userActivity.methodUsageMonths || 0) >= requiredMonths
        break
    }

    if (shouldUnlock) {
      newBadges.push(badge)
    }
  }

  return newBadges
}

/**
 * Calculate badge rarity score for display ordering
 */
export function getBadgeRarityScore(rarity: DebtBadge['rarity']): number {
  switch (rarity) {
    case 'common': return 1
    case 'rare': return 2
    case 'epic': return 3
    case 'legendary': return 4
    default: return 0
  }
}

/**
 * Get badge rarity color for UI
 */
export function getBadgeRarityColor(rarity: DebtBadge['rarity']): string {
  switch (rarity) {
    case 'common': return 'text-gray-600 border-gray-300'
    case 'rare': return 'text-blue-600 border-blue-300'
    case 'epic': return 'text-purple-600 border-purple-300'
    case 'legendary': return 'text-yellow-600 border-yellow-300'
    default: return 'text-gray-600 border-gray-300'
  }
}

/**
 * Generate motivational messages based on progress
 */
export function generateMotivationalMessage(
  debtReductionPercentage: number,
  paymentStreak: number,
  interestSaved: number
): string {
  const messages = []

  if (debtReductionPercentage >= 75) {
    messages.push("🏃‍♂️ You're in the final stretch! Debt freedom is within reach!")
  } else if (debtReductionPercentage >= 50) {
    messages.push("🦸‍♂️ Halfway there! You've conquered half your debt mountain!")
  } else if (debtReductionPercentage >= 25) {
    messages.push("💪 Quarter way down! Your debt is shrinking fast!")
  } else if (debtReductionPercentage >= 10) {
    messages.push("📊 Great progress! Every payment gets you closer to freedom!")
  }

  if (paymentStreak >= 12) {
    messages.push("🎯 Amazing discipline! A full year of consistent payments!")
  } else if (paymentStreak >= 6) {
    messages.push("🔥 Your payment streak is on fire! Keep it going!")
  } else if (paymentStreak >= 3) {
    messages.push("⭐ Consistency is key! You're building great habits!")
  }

  if (interestSaved >= 5000) {
    messages.push("🥷 Interest ninja! You've saved $5,000+ with smart strategies!")
  } else if (interestSaved >= 1000) {
    messages.push("💰 Smart money moves! You've saved $1,000+ in interest!")
  } else if (interestSaved >= 100) {
    messages.push("🤑 Every dollar saved is a dollar earned! Keep it up!")
  }

  return messages.length > 0 
    ? messages[Math.floor(Math.random() * messages.length)]
    : "🌟 Every payment brings you closer to financial freedom!"
}

/**
 * Calculate debt elimination score for leaderboard/progress tracking
 */
export function calculateDebtScore(
  debtReductionPercentage: number,
  paymentStreak: number,
  interestSaved: number,
  badgePoints: number,
  simulationsRun: number
): number {
  const reductionScore = debtReductionPercentage * 10 // Max 1000 points
  const streakScore = Math.min(paymentStreak * 25, 500) // Max 500 points
  const savingsScore = Math.min(interestSaved / 10, 1000) // Max 1000 points for $10k saved
  const educationScore = Math.min(simulationsRun * 10, 100) // Max 100 points
  
  return Math.round(reductionScore + streakScore + savingsScore + badgePoints + educationScore)
}
