// Explicit data contracts for server → client communication

export interface DashboardKpis {
  readyToAssign: number
  incomeThisMonth: number
  totalSpentThisMonth: number
  totalIncome: number
  debtOutstanding: number
  savingsRate: number
  budgetUtilization: number
}

export interface RecentTransaction {
  id: string
  date: string
  merchant: string
  category: string
  account: string
  type: 'income' | 'expense' | 'transfer'
  amount: number
  note?: string
}

export interface UpcomingBill {
  id: string
  name: string
  amount: number
  dueDate: string
  status: 'upcoming' | 'due_today' | 'overdue'
  daysUntilDue: number
  category: string
}

export interface GoalProgress {
  id: string
  name: string
  targetAmount: number
  savedAmount: number
  percentage: number
  priority: number
  targetDate?: string
}

export interface DashboardData {
  kpis: DashboardKpis
  recentTransactions: RecentTransaction[]
  upcomingBills: UpcomingBill[]
  goalProgress: GoalProgress[]
  userId: string
  isDemoAccount: boolean
}

export interface OnboardingStatus {
  userId: string
  completed: boolean
  currentStep: number
  steps: {
    profile: boolean
    income: boolean
    bills: boolean
    debts: boolean
    goals: boolean
    investments: boolean
    review: boolean
  }
  startedAt: string
  completedAt?: string
}

export interface UserFinancialData {
  userId: string
  isDemoAccount: boolean
  profile: {
    name: string
    currency: string
    timezone: string
  }
  income: Array<{
    id: string
    name: string
    amount: number
    frequency: string
    nextDate: string
    active: boolean
  }>
  bills: Array<{
    id: string
    name: string
    amount: number
    frequency: string
    dueDate: string
    category: string
    isUtility: boolean
    status: 'active' | 'overdue' | 'paid'
  }>
  debts: Array<{
    id: string
    name: string
    balance: number
    interest: number
    minPayment: number
    type: string
  }>
  goals: Array<{
    id: string
    name: string
    targetCents: number
    savedCents: number
    targetDate: string
    priority: number
  }>
  investments: Array<{
    id: string
    name: string
    monthlyContribution: number
    expectedAPR: number
    currentValue: number
    autoInvest: boolean
  }>
  transactions: Array<{
    id: string
    date: string
    merchant: string
    description?: string
    category: string
    categoryName?: string
    account: string
    accountName?: string
    type: 'income' | 'expense' | 'transfer'
    amount: number
  }>
}
