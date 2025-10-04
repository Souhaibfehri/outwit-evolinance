// Interactive tutorial configurations for each page

export interface TutorialStep {
  target: string // CSS selector or element ID
  content: string
  title: string
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  disableBeacon?: boolean
  hideCloseButton?: boolean
  hideFooter?: boolean
  showProgress?: boolean
  showSkipButton?: boolean
}

export interface QuizQuestion {
  question: string
  options: string[]
  answer: string
  explanation?: string
}

export interface TutorialConfig {
  page: string
  title: string
  description: string
  steps: TutorialStep[]
  quiz: QuizQuestion[]
  badge: {
    id: string
    name: string
    description: string
    icon: string
  }
  youtubeVideo?: string
}

export const TUTORIAL_CONFIGS: Record<string, TutorialConfig> = {
  dashboard: {
    page: 'dashboard',
    title: 'Dashboard Mastery',
    description: 'Learn to navigate your financial cockpit',
    steps: [
      {
        target: '[data-coach-anchor="dashboard-kpis"], .dashboard-kpis, [data-testid="dashboard-kpis"]',
        title: 'Your Financial Overview',
        content: 'This is your financial cockpit! 🚀 These 4 key metrics show your monthly income, Ready to Assign (unallocated money), total spending, and debt balance. In zero-based budgeting, Ready to Assign should be $0.',
        placement: 'bottom',
        showProgress: true
      },
      {
        target: '[data-testid="recent-activity"], .recent-activity-card',
        title: 'Recent Activity Feed',
        content: 'Track your latest transactions here. Use the category filter to find specific spending patterns. Click any transaction to edit or categorize it properly.',
        placement: 'left'
      },
      {
        target: '[data-testid="upcoming-bills"], [data-testid="upcoming-items"], .upcoming-bills-card',
        title: 'Bills Due Soon',
        content: 'Never miss a payment! This shows bills due in the next 7 days. Red badges indicate overdue bills. Click "Mark as Paid" to record payments.',
        placement: 'left'
      },
      {
        target: '[data-testid="quick-actions"], .quick-actions-card',
        title: 'Quick Actions Hub',
        content: 'Speed up your workflow! Add transactions, bills, or goals with one click. The "Add Transaction" button opens a smart form that can categorize expenses automatically.',
        placement: 'top'
      },
      {
        target: 'button:has-text("Add Transaction"), [data-testid="add-transaction-btn"], .add-transaction-button',
        title: 'Add Transaction Button',
        content: 'Click this button to add new transactions. The form will help you categorize expenses and track your spending accurately.',
        placement: 'bottom'
      },
      {
        target: 'button:has-text("Add Bill"), [data-testid="add-bill-btn"], .add-bill-button',
        title: 'Add Bill Button', 
        content: 'Set up recurring bills here to never miss a payment. Bills integrate with your budget categories automatically.',
        placement: 'bottom'
      }
    ],
    quiz: [
      {
        question: 'What does "Ready to Assign" mean in zero-based budgeting?',
        options: [
          'Money you haven\'t spent yet',
          'Money you\'ve received but haven\'t assigned to categories',
          'Your total monthly income',
          'Money in your savings account'
        ],
        answer: 'Money you\'ve received but haven\'t assigned to categories',
        explanation: 'In zero-based budgeting, every dollar should have a job. Ready to Assign shows unassigned money that needs to be allocated to categories.'
      },
      {
        question: 'Where can you see your upcoming bill due dates?',
        options: ['Recent Activity', 'Upcoming Bills', 'Quick Actions', 'KPI Cards'],
        answer: 'Upcoming Bills',
        explanation: 'The Upcoming Bills section shows bills due in the next few days with payment options.'
      },
      {
        question: 'What\'s the fastest way to add a new transaction?',
        options: ['Go to Transactions page', 'Use Quick Actions', 'Go to Budget page', 'Use Reports'],
        answer: 'Use Quick Actions',
        explanation: 'Quick Actions provide one-click access to common tasks like adding transactions, bills, and goals.'
      }
    ],
    badge: {
      id: 'dashboard_master',
      name: 'Dashboard Master',
      description: 'Mastered the financial overview dashboard',
      icon: '📊'
    },
    youtubeVideo: 'https://youtube.com/watch?v=dashboard-tutorial'
  },

  budget: {
    page: 'budget',
    title: 'Budget Boss',
    description: 'Master zero-based budgeting like a pro',
    steps: [
      {
        target: '[data-coach-anchor="ready-to-assign"]',
        title: 'Ready to Assign - The Heart of Zero-Based Budgeting',
        content: 'This is your unassigned money. In zero-based budgeting, every dollar needs a job! Your goal is to assign all money until this reaches $0. This ensures every dollar is intentionally allocated.',
        placement: 'bottom'
      },
      {
        target: '[data-testid="category-list"]',
        title: 'Budget Categories - Your Money\'s Jobs',
        content: 'These are your spending categories (groceries, rent, entertainment). Click "Set" next to any category to assign money from Ready to Assign. Start with essentials like rent and groceries first.',
        placement: 'right'
      },
      {
        target: 'button[class*="btn-primary"]',
        title: 'Quick Setup with Default Categories',
        content: 'New to budgeting? Look for the "Create Default Categories" button to set up common categories like Housing, Food, Transportation, and Entertainment. You can always customize them later.',
        placement: 'top'
      },
      {
        target: 'button:has([class*="Settings"])',
        title: 'Organize with Category Groups',
        content: 'Click the "Manage Groups" button (with the settings icon) to organize your categories into groups like "Essential Bills", "Lifestyle", etc. This makes your budget easier to navigate.',
        placement: 'top'
      },
      {
        target: '[data-testid="rollover-toggle"]',
        title: 'Rollover vs Fresh Start',
        content: 'Enable rollover to carry unspent category money to next month (good for irregular expenses). Disable to return unspent money to Ready to Assign each month (stricter budgeting).',
        placement: 'top'
      }
    ],
    quiz: [
      {
        question: 'In zero-based budgeting, Ready to Assign should be:',
        options: ['As high as possible', '$0.00', 'Equal to your income', 'At least $100'],
        answer: '$0.00',
        explanation: 'Every dollar should have a job! Assign all money to categories until Ready to Assign is $0.'
      },
      {
        question: 'What happens when rollover is enabled for a category?',
        options: [
          'Unspent money disappears',
          'Unspent money returns to Ready to Assign',
          'Unspent money carries over to next month',
          'You get charged a fee'
        ],
        answer: 'Unspent money carries over to next month',
        explanation: 'Rollover lets you save unspent category money for next month instead of returning it to Ready to Assign.'
      }
    ],
    badge: {
      id: 'budget_boss',
      name: 'Budget Boss',
      description: 'Conquered zero-based budgeting',
      icon: '💰'
    },
    youtubeVideo: 'https://youtube.com/watch?v=budget-tutorial'
  },

  income: {
    page: 'income',
    title: 'Income Pro',
    description: 'Track all your income sources like a professional',
    steps: [
      {
        target: '[data-testid="income-tabs"]',
        title: 'Two Types of Income to Track',
        content: 'Recurring income (salary, freelance contracts, rental income) vs One-off income (bonuses, tax refunds, gifts). Each serves a different purpose in your budget planning.',
        placement: 'bottom'
      },
      {
        target: '[data-testid="add-recurring-income"]',
        title: 'Set Up Your Recurring Income',
        content: 'This is your predictable income. Fill out the form with your income source name, amount, and frequency. This automatically feeds your Ready to Assign budget each period.',
        placement: 'right'
      },
      {
        target: '[data-testid="frequency-selector"]',
        title: 'Payment Frequency Matters',
        content: 'Choose how often you get paid: weekly, bi-weekly, semi-monthly, or monthly. This helps predict your cash flow and plan your budget timing accurately.',
        placement: 'top'
      },
      {
        target: 'input[name="amount"]',
        title: 'Enter Your Net Amount',
        content: 'Enter your take-home pay (after taxes and deductions). This is the actual amount that hits your bank account and becomes available for budgeting.',
        placement: 'top'
      },
      {
        target: 'button:has-text("Add Recurring Income")',
        title: 'Save Your Income Source',
        content: 'Click this button to save your income source. You can add multiple income sources if you have various jobs, freelance work, or other regular income.',
        placement: 'top'
      }
    ],
    quiz: [
      {
        question: 'What\'s the difference between recurring and one-off income?',
        options: [
          'Recurring is higher amounts',
          'Recurring happens regularly, one-off is irregular',
          'One-off is taxed differently',
          'There\'s no difference'
        ],
        answer: 'Recurring happens regularly, one-off is irregular',
        explanation: 'Recurring income (salary) happens on a schedule, while one-off income (bonuses) happens irregularly.'
      }
    ],
    badge: {
      id: 'income_pro',
      name: 'Income Pro',
      description: 'Expert at tracking income sources',
      icon: '💵'
    }
  },

  bills: {
    page: 'bills',
    title: 'Bills Master',
    description: 'Never miss a payment again',
    steps: [
      {
        target: '[data-testid="bills-kpis"]',
        title: 'Bills Overview Dashboard',
        content: 'Your bills command center! See monthly total, upcoming bills (next 7 days), overdue payments that need attention, and average bill amount. Red numbers indicate urgent action needed.',
        placement: 'bottom'
      },
      {
        target: '[data-testid="add-bill-btn"]',
        title: 'Add Your Bills',
        content: 'Click here to add recurring bills like rent, utilities, subscriptions. Include the amount, due date, and frequency. This creates automatic reminders and helps with cash flow planning.',
        placement: 'top'
      },
      {
        target: '[data-coach-anchor="quick-catch-up-btn"]',
        title: 'Quick Catch-Up for Missing Time',
        content: 'Been away or missed tracking for a while? Quick Catch-Up helps estimate your spending over a period and distribute it across budget categories automatically.',
        placement: 'top'
      },
      {
        target: '[data-testid="bills-list"]',
        title: 'Bills List and Actions',
        content: 'View all your bills with due dates, amounts, and status. Use "Mark as Paid" to record payments and update your budget. Bills integrate with your budget categories automatically.',
        placement: 'left'
      },
      {
        target: 'button:has-text("Export CSV")',
        title: 'Export Your Bills Data',
        content: 'Export your bills to CSV for record-keeping, tax preparation, or analysis in other tools. Great for annual budgeting reviews and financial planning.',
        placement: 'top'
      }
    ],
    quiz: [
      {
        question: 'What\'s the best way to handle irregular spending when you\'ve been inactive?',
        options: ['Ignore it', 'Use Quick Catch-Up', 'Delete old data', 'Start over'],
        answer: 'Use Quick Catch-Up',
        explanation: 'Quick Catch-Up lets you estimate spending for inactive periods and distribute it across categories.'
      }
    ],
    badge: {
      id: 'bills_master',
      name: 'Bills Master',
      description: 'Never misses a payment',
      icon: '📋'
    }
  },

  transactions: {
    page: 'transactions',
    title: 'Transaction Tracker',
    description: 'Master your transaction management and categorization',
    steps: [
      {
        target: '[data-testid="transaction-kpis"]',
        title: 'Transaction Overview',
        content: 'See your total transactions, this month\'s spending, income received, and net cash flow. This gives you a quick pulse on your financial activity.',
        placement: 'bottom'
      },
      {
        target: '[data-testid="add-transaction-btn"]',
        title: 'Add New Transactions',
        content: 'Click here to manually add transactions. Include amount, description, category, and date. This is perfect for cash purchases or when you need to record something immediately.',
        placement: 'top'
      },
      {
        target: '[data-testid="transaction-filters"]',
        title: 'Filter and Search',
        content: 'Use filters to find specific transactions by category, date range, or amount. The search box helps you find transactions by description or payee name.',
        placement: 'right'
      },
      {
        target: '[data-testid="import-csv-btn"]',
        title: 'Import Bank Data',
        content: 'Import transactions from your bank\'s CSV export. This saves time and ensures you don\'t miss any transactions. The system will help categorize them automatically.',
        placement: 'top'
      },
      {
        target: '[data-testid="transaction-list"]',
        title: 'Transaction List Management',
        content: 'View, edit, and categorize your transactions. Click any transaction to modify it. Proper categorization is crucial for accurate budget tracking.',
        placement: 'left'
      },
      {
        target: 'button:has-text("Export CSV")',
        title: 'Export Your Data',
        content: 'Export transactions to CSV for analysis, tax preparation, or backup. You can filter first, then export only the transactions you need.',
        placement: 'top'
      }
    ],
    quiz: [
      {
        question: 'What\'s the most efficient way to add many transactions at once?',
        options: [
          'Add them one by one manually',
          'Import CSV from your bank',
          'Use voice recording',
          'Take photos of receipts'
        ],
        answer: 'Import CSV from your bank',
        explanation: 'CSV import from your bank is the fastest way to add multiple transactions and ensures you don\'t miss any.'
      },
      {
        question: 'Why is proper transaction categorization important?',
        options: [
          'It makes the app look pretty',
          'It\'s required by law',
          'It enables accurate budget tracking and spending analysis',
          'It doesn\'t matter'
        ],
        answer: 'It enables accurate budget tracking and spending analysis',
        explanation: 'Proper categorization lets you see exactly where your money goes and whether you\'re staying within budget limits.'
      }
    ],
    badge: {
      id: 'transaction_tracker',
      name: 'Transaction Tracker',
      description: 'Expert at managing transactions',
      icon: '🧾'
    }
  },

  debts: {
    page: 'debts',
    title: 'Debt Destroyer',
    description: 'Master debt payoff strategies',
    steps: [
      {
        target: '[data-testid="debt-kpis"]',
        title: 'Debt Overview',
        content: 'Track total debt, minimum payments, average interest rates, and number of accounts.',
        placement: 'bottom'
      },
      {
        target: '.data-coach-anchor-debt-simulator',
        title: 'Debt Simulator',
        content: 'Compare Snowball vs Avalanche payoff methods. See which saves more money and time!',
        placement: 'right'
      },
      {
        target: '[data-testid="debt-education"]',
        title: 'Debt Education',
        content: 'Learn about APR, payoff strategies, and which method works best for your situation.',
        placement: 'left'
      }
    ],
    quiz: [
      {
        question: 'What\'s the difference between Snowball and Avalanche debt payoff methods?',
        options: [
          'Snowball pays highest balance first, Avalanche pays lowest',
          'Snowball pays lowest balance first, Avalanche pays highest interest rate first',
          'They\'re the same method',
          'Avalanche is always better'
        ],
        answer: 'Snowball pays lowest balance first, Avalanche pays highest interest rate first',
        explanation: 'Snowball focuses on quick wins (smallest balances), while Avalanche saves the most money (highest interest rates first).'
      },
      {
        question: 'What does APR stand for?',
        options: ['Annual Payment Rate', 'Annual Percentage Rate', 'Average Payment Ratio', 'Annual Principal Rate'],
        answer: 'Annual Percentage Rate',
        explanation: 'APR is the yearly cost of borrowing money, expressed as a percentage.'
      }
    ],
    badge: {
      id: 'debt_destroyer',
      name: 'Debt Destroyer',
      description: 'Master of debt elimination strategies',
      icon: '⚔️'
    }
  },

  goals: {
    page: 'goals',
    title: 'Goal Getter',
    description: 'Achieve your financial dreams',
    steps: [
      {
        target: '[data-testid="goals-kpis"]',
        title: 'Goals Progress',
        content: 'Track your total targets, saved amounts, completed goals, and average progress across all goals.',
        placement: 'bottom'
      },
      {
        target: '[data-testid="add-goal-btn"]',
        title: 'Create Goals',
        content: 'Set specific, measurable financial goals with target amounts and dates. Priority levels help you focus.',
        placement: 'top'
      },
      {
        target: '[data-testid="add-money-btn"]',
        title: 'Fund Your Goals',
        content: 'Add money to goals from your Ready to Assign or transfer from other categories.',
        placement: 'left'
      }
    ],
    quiz: [
      {
        question: 'What makes a good financial goal?',
        options: [
          'Vague and flexible',
          'Specific amount and target date',
          'Only short-term goals',
          'Goals don\'t matter'
        ],
        answer: 'Specific amount and target date',
        explanation: 'SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound) are most effective for financial success.'
      }
    ],
    badge: {
      id: 'goal_getter',
      name: 'Goal Getter',
      description: 'Sets and achieves financial goals',
      icon: '🎯'
    }
  },

  reports: {
    page: 'reports',
    title: 'Analytics Ace',
    description: 'Understand your financial patterns',
    steps: [
      {
        target: '[data-testid="reports-kpis"], .reports-kpis, [data-coach-anchor="reports-overview"]',
        title: 'Financial Health Metrics',
        content: 'Monitor your savings rate, spending on essentials, net cash flow, and average transaction size. These KPIs help you understand your financial health at a glance.',
        placement: 'bottom'
      },
      {
        target: '[data-testid="spending-breakdown"], .spending-breakdown, .category-breakdown',
        title: 'Spending Analysis',
        content: 'See where your money goes with category breakdowns and identify areas for improvement. The pie chart shows your spending distribution visually.',
        placement: 'right'
      },
      {
        target: '[data-testid="trends-analysis"], .trends-analysis, [data-coach-anchor="spending-trends"]',
        title: 'Spending Trends',
        content: 'Track how your spending patterns change over time. Green trends show decreasing spending, red shows increases. Use this to spot lifestyle inflation.',
        placement: 'left'
      },
      {
        target: '[data-testid="export-reports"], .export-controls, button:has-text("Export")',
        title: 'Export & Share Data',
        content: 'Export your financial data as CSV or generate PDF reports for sharing or record-keeping. Perfect for tax season or financial advisor meetings.',
        placement: 'top'
      }
    ],
    quiz: [
      {
        question: 'What\'s a healthy savings rate?',
        options: ['5%', '10%', '20% or more', '50%'],
        answer: '20% or more',
        explanation: 'Financial experts typically recommend saving 20% or more of your income for long-term financial health.'
      }
    ],
    badge: {
      id: 'analytics_ace',
      name: 'Analytics Ace',
      description: 'Understands financial patterns and trends',
      icon: '📈'
    }
  },

  investments: {
    page: 'investments',
    title: 'Investment Guru',
    description: 'Build wealth through smart investing',
    steps: [
      {
        target: '[data-testid="investment-kpis"], .investment-kpis, [data-coach-anchor="portfolio-overview"]',
        title: 'Portfolio Overview',
        content: 'Track your total portfolio value, monthly contributions, expected returns, and automated investment plans. Monitor your wealth building progress here.',
        placement: 'bottom'
      },
      {
        target: '[data-testid="smart-investment-calculator"], .smart-investment-calculator',
        title: 'Smart Investment Calculator',
        content: 'This practical calculator helps you plan for retirement with realistic scenarios. Choose your investment strategy and see exactly what you need to reach your goals.',
        placement: 'right'
      },
      {
        target: 'input[type="number"], .investment-strategy',
        title: 'Investment Strategy Selection',
        content: 'Choose from 5 realistic investment strategies based on your risk tolerance. Each shows real-world examples and expected returns.',
        placement: 'top'
      },
      {
        target: '.retirement-analysis, [data-testid="retirement-results"]',
        title: 'Retirement Analysis',
        content: 'See your projected retirement income using the 4% withdrawal rule. This shows what your investments will actually provide in retirement.',
        placement: 'left'
      },
      {
        target: '[data-testid="add-investment"], button:has-text("Create Investment Plan")',
        title: 'Create Investment Plans',
        content: 'Set up recurring investment contributions to build wealth automatically over time. Consistency is key to long-term wealth building!',
        placement: 'top'
      }
    ],
    quiz: [
      {
        question: 'What is compound interest?',
        options: [
          'Interest on your original investment only',
          'Interest on both your investment and previously earned interest',
          'A type of bank account',
          'A government tax'
        ],
        answer: 'Interest on both your investment and previously earned interest',
        explanation: 'Compound interest is the foundation of wealth building - you earn returns on your returns!'
      }
    ],
    badge: {
      id: 'investment_guru',
      name: 'Investment Guru',
      description: 'Understands the power of compound growth',
      icon: '📊'
    }
  }
}

export function getTutorialConfig(page: string): TutorialConfig | null {
  return TUTORIAL_CONFIGS[page] || null
}

export function getAllTutorialPages(): string[] {
  return Object.keys(TUTORIAL_CONFIGS)
}

export function getTutorialProgress(completedPages: string[]): number {
  const totalPages = Object.keys(TUTORIAL_CONFIGS).length
  return Math.floor((completedPages.length / totalPages) * 100)
}
