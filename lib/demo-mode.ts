// Demo mode and data integrity utilities

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
export const SEED_DEMO_DATA = process.env.SEED_DEMO_DATA === 'true'

// Demo data flags for different modules
export const DEMO_FLAGS = {
  showFakeTransactions: DEMO_MODE,
  showFakeNotifications: DEMO_MODE,
  showWelcomeCards: DEMO_MODE,
  allowSampleData: DEMO_MODE,
  enableSeeding: SEED_DEMO_DATA
} as const

// Check if user is in demo/sandbox mode
export function isUserInDemoMode(userId?: string): boolean {
  if (!userId) return DEMO_MODE
  
  // In production, you might check user preferences or account type
  // For now, use environment variable
  return DEMO_MODE
}

// Get empty state messaging based on demo mode
export function getEmptyStateMessage(module: string, isDemoUser: boolean = false) {
  const messages = {
    transactions: {
      demo: "Try adding some sample transactions to see how tracking works!",
      real: "Start by adding your first transaction or importing from CSV."
    },
    goals: {
      demo: "Create a sample goal to see progress tracking in action!",
      real: "Set your first savings goal and start building your future."
    },
    bills: {
      demo: "Add some sample bills to see payment tracking!",
      real: "Add your recurring bills to never miss a payment."
    },
    debts: {
      demo: "Try our debt simulator with sample scenarios!",
      real: "Add your debts to create a personalized payoff strategy."
    },
    investments: {
      demo: "Explore investment planning with sample data!",
      real: "Start investing for your future with automated contributions."
    },
    notifications: {
      demo: "This is where you'll see helpful reminders and alerts!",
      real: "You're all caught up! No notifications at this time."
    }
  }

  const moduleMessages = messages[module as keyof typeof messages]
  if (!moduleMessages) return "Get started by adding your first item."
  
  return isDemoUser ? moduleMessages.demo : moduleMessages.real
}

// Sample data generators (only used when DEMO_MODE is true)
export const SAMPLE_DATA = {
  transactions: [
    {
      id: 'demo-1',
      date: new Date().toISOString().split('T')[0],
      merchant: 'Sample Grocery Store',
      category: 'Groceries',
      account: 'Checking',
      type: 'EXPENSE',
      amount: -127.50,
      note: 'Weekly shopping (demo data)',
      isDemo: true
    },
    {
      id: 'demo-2',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      merchant: 'Salary Deposit',
      category: 'Income',
      account: 'Checking',
      type: 'INCOME',
      amount: 3000.00,
      note: 'Monthly salary (demo data)',
      isDemo: true
    }
  ],
  
  notifications: [
    {
      id: 'demo-notif-1',
      type: 'info',
      title: 'Welcome to Outwit Budget!',
      message: 'This is a sample notification. Real notifications will appear here.',
      timestamp: new Date().toISOString(),
      isDemo: true
    },
    {
      id: 'demo-notif-2',
      type: 'warning',
      title: 'Budget Alert (Demo)',
      message: 'You\'ve spent 80% of your Groceries budget this month.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isDemo: true
    }
  ],

  goals: [
    {
      id: 'demo-goal-1',
      name: 'Emergency Fund (Demo)',
      targetCents: 500000,
      savedCents: 275000,
      targetDate: '2024-12-31',
      notify: true,
      priority: 1,
      isDemo: true
    }
  ],

  bills: [
    {
      id: 'demo-bill-1',
      name: 'Electric Bill (Demo)',
      amount: 125.00,
      category: 'Utilities',
      nextDue: '2024-02-01',
      frequency: 'Monthly',
      active: true,
      isDemo: true
    }
  ]
} as const

// Filter out demo data for real users
export function filterDemoData<T extends { isDemo?: boolean }>(
  data: T[], 
  userIsDemoMode: boolean
): T[] {
  if (userIsDemoMode) return data
  return data.filter(item => !item.isDemo)
}

// Add demo data banner component props
export function getDemoBannerProps(userIsDemoMode: boolean) {
  if (!userIsDemoMode) return null
  
  return {
    title: "Demo Mode",
    message: "You're viewing sample data. Real data will replace this when you add your own information.",
    variant: "info" as const,
    dismissible: true,
    storageKey: "demo-banner-dismissed"
  }
}

// Environment validation
export function validateEnvironment() {
  const warnings: string[] = []
  
  if (DEMO_MODE && process.env.NODE_ENV === 'production') {
    warnings.push("DEMO_MODE is enabled in production - this should only be used for demos")
  }
  
  if (SEED_DEMO_DATA && process.env.NODE_ENV === 'production') {
    warnings.push("SEED_DEMO_DATA is enabled in production - this could overwrite real user data")
  }
  
  return warnings
}

// User preferences for demo data
export interface UserDemoPreferences {
  allowSampleData: boolean
  showDemoTips: boolean
  hideWelcomeCards: boolean
}

export const DEFAULT_DEMO_PREFERENCES: UserDemoPreferences = {
  allowSampleData: false,
  showDemoTips: true,
  hideWelcomeCards: false
}
