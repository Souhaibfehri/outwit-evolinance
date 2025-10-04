// Tutorial steps configuration for Foxy AI Coach

export interface TutorialStepConfig {
  id: string
  module: string
  order: number
  title: string
  copy: string
  targetSelector?: string
  completionEvent: string
  skippable: boolean
  config?: any
}

export const TUTORIAL_STEPS: TutorialStepConfig[] = [
  // Step 1 - Dashboard Introduction
  {
    id: 'dashboard_intro',
    module: 'DASHBOARD',
    order: 1,
    title: 'Welcome to Your Financial Cockpit! 🚀',
    copy: 'This is your cockpit 🚀. You\'ll see Ready-to-Assign, total income, spending, debt, and goal progress at a glance.',
    targetSelector: '[data-coach-anchor="dashboard-kpis"]',
    completionEvent: 'view_dashboard',
    skippable: true,
    config: {
      highlightElements: ['[data-coach-anchor="dashboard-kpis"]'],
      nextAction: 'navigate_budget'
    }
  },

  // Step 2 - Budget Basics
  {
    id: 'budget_intro',
    module: 'BUDGET',
    order: 2,
    title: 'Zero-Based Budgeting Basics',
    copy: 'Zero-based budgeting means every dollar gets a job. You can set categories, assign amounts, and watch rollover (unspent funds carried forward).',
    targetSelector: '[data-coach-anchor="budget-header"]',
    completionEvent: 'create_category',
    skippable: true,
    config: {
      highlightElements: ['[data-coach-anchor="ready-to-assign"]'],
      tooltips: ['rollover']
    }
  },

  // Step 3 - Income Setup
  {
    id: 'income_intro',
    module: 'INCOME',
    order: 3,
    title: 'Track Your Income Sources',
    copy: 'Add recurring income (salary, freelance) or one-off income (bonus). This feeds Ready-to-Assign.',
    targetSelector: '[data-coach-anchor="income-tabs"]',
    completionEvent: 'add_recurring_income',
    skippable: true,
    config: {
      highlightElements: ['[data-coach-anchor="add-income-btn"]'],
      suggestions: ['enable_payday_reminders']
    }
  },

  // Step 4 - Transactions
  {
    id: 'transactions_intro',
    module: 'TRANSACTIONS',
    order: 4,
    title: 'Track Your Spending',
    copy: 'Log expenses/income quickly. If you\'re short on time, add a bulk amount—details can be categorized later.',
    targetSelector: '[data-coach-anchor="transactions-list"]',
    completionEvent: 'add_transaction',
    skippable: true,
    config: {
      highlightElements: ['[data-coach-anchor="add-transaction-btn"]', '[data-coach-anchor="quick-capture-btn"]'],
      alternatives: ['import_csv']
    }
  },

  // Step 5 - Bills & Investments
  {
    id: 'bills_intro',
    module: 'BILLS',
    order: 5,
    title: 'Manage Recurring Expenses',
    copy: 'Track monthly bills, annual items (insurance), and investments. Mark each as recurring, annual, or one-time.',
    targetSelector: '[data-coach-anchor="bills-list"]',
    completionEvent: 'add_bill',
    skippable: true,
    config: {
      highlightElements: ['[data-coach-anchor="add-bill-btn"]'],
      tooltips: ['recurring_vs_annual'],
      alternatives: ['add_investment_rule']
    }
  },

  // Step 6 - Debt Management
  {
    id: 'debts_intro',
    module: 'DEBTS',
    order: 6,
    title: 'Smart Debt Payoff',
    copy: 'Add debts with APR (yearly borrowing cost). Try Snowball vs Avalanche in the Simulator to compare payoff time & interest.',
    targetSelector: '[data-coach-anchor="debt-simulator"]',
    completionEvent: 'run_debt_sim',
    skippable: true,
    config: {
      highlightElements: ['[data-coach-anchor="debt-simulator-btn"]'],
      tooltips: ['apr', 'snowball', 'avalanche'],
      badge: 'debt_sensei'
    }
  },

  // Step 7 - Goals Setup
  {
    id: 'goals_intro',
    module: 'GOALS',
    order: 7,
    title: 'Set Financial Goals',
    copy: 'Create savings goals, set target dates, and priorities. Auto-save from Ready-to-Assign if you like.',
    targetSelector: '[data-coach-anchor="goals-list"]',
    completionEvent: 'create_goal',
    skippable: true,
    config: {
      highlightElements: ['[data-coach-anchor="add-goal-btn"]'],
      alternatives: ['enable_goal_notifications']
    }
  },

  // Step 8 - Reports & Analytics
  {
    id: 'reports_intro',
    module: 'REPORTS',
    order: 8,
    title: 'Financial Insights',
    copy: 'See trends, KPIs, and category breakdowns. Export CSV/PDF for sharing.',
    targetSelector: '[data-coach-anchor="reports-kpis"]',
    completionEvent: 'view_reports',
    skippable: true,
    config: {
      highlightElements: ['[data-coach-anchor="export-btn"]'],
      alternatives: ['export_csv']
    }
  },

  // Step 9 - Notifications & Settings
  {
    id: 'notifications_settings_intro',
    module: 'NOTIFICATIONS',
    order: 9,
    title: 'Stay Informed',
    copy: 'Enable reminders (bills due, goal milestones). If no alerts exist, you\'ll see an empty state—no noise.',
    targetSelector: '[data-coach-anchor="notification-settings"]',
    completionEvent: 'open_notification_settings',
    skippable: true,
    config: {
      highlightElements: ['[data-coach-anchor="notification-toggle"]'],
      finalStep: true,
      badge: 'trailblazer'
    }
  }
]

export const TUTORIAL_MODULES = [
  'DASHBOARD',
  'BUDGET', 
  'INCOME',
  'TRANSACTIONS',
  'BILLS',
  'DEBTS',
  'GOALS',
  'REPORTS',
  'NOTIFICATIONS',
  'SETTINGS'
] as const

export type TutorialModuleType = typeof TUTORIAL_MODULES[number]
