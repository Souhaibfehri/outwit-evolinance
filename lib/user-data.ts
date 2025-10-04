// Real user data service - fetches from Supabase user metadata instead of mock data

import { createClient } from '@/lib/supabase/client'
import { UserFinancialData, DashboardKpis } from '@/lib/types/dashboard'
import { getDatabaseUserData, isUserDataMigrated } from '@/lib/database/user-service'

// Demo account detection
export function isDemoAccount(userEmail?: string): boolean {
  const demoEmails = [
    'demo@outwitbudget.com',
    'test@outwitbudget.com',
    'sample@outwitbudget.com'
  ]
  return userEmail ? demoEmails.includes(userEmail.toLowerCase()) : false
}

export interface UserData {
  // Financial data
  income: Array<{
    id: string
    name: string
    amount: number
    frequency: 'weekly' | 'biweekly' | 'monthly' | 'semimonthly'
    nextDate: string
    active: boolean
  }>
  
  transactions: Array<{
    id: string
    amount: number
    description: string
    category: string
    categoryName: string
    date: string
    type: 'income' | 'expense' | 'transfer'
    account: string
    accountName: string
    merchant: string
  }>
  
  bills: Array<{
    id: string
    name: string
    amount: number
    dueDate: string
    category: string
    frequency: 'monthly' | 'quarterly' | 'yearly'
    autoPay: boolean
    status: 'upcoming' | 'paid' | 'overdue'
  }>
  
  debts: Array<{
    id: string
    name: string
    balance: number
    interest: number
    minPayment: number
    type: 'credit_card' | 'loan' | 'other'
  }>
  
  goals: Array<{
    id: string
    name: string
    targetCents: number
    savedCents: number
    targetDate?: string
    priority: number
    category: string
  }>
  
  investments: Array<{
    id: string
    name: string
    monthlyContribution: number
    currentValue: number
    expectedAPR: number
    autoInvest: boolean
    accountType: string
  }>
  
  categories: Array<{
    id: string
    name: string
    group: string
    budgetAmount: number
    spent: number
    rollover: boolean
  }>
  
  budgetMonth: {
    month: string
    expectedIncome: number
    readyToAssign: number
    totalAssigned: number
    totalSpent: number
  }
}

// Default empty data structure
const getEmptyUserData = (): UserData => ({
  income: [],
  transactions: [],
  bills: [],
  debts: [],
  goals: [],
  investments: [],
  categories: [],
  budgetMonth: {
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
    expectedIncome: 0,
    readyToAssign: 0,
    totalAssigned: 0,
    totalSpent: 0
  }
})

// Fetch real user data from Supabase metadata
export async function getUserData(): Promise<UserData & { isDemoAccount: boolean }> {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      console.warn('No authenticated user found, returning empty data')
      return { ...getEmptyUserData(), isDemoAccount: false }
    }

    const metadata = user.user_metadata || {}
    const isDemo = isDemoAccount(user.email)
    
    // KILL MOCK DATA: Only return demo data if this is a demo account
    if (!isDemo && process.env.NODE_ENV === 'production') {
      // In production, non-demo accounts get only their real data
      console.log('Production mode: returning real user data only')
    }
    
    // Extract data from user metadata with fallbacks
    const userData: UserData = {
      income: metadata.recurring_income || [],
      transactions: metadata.transactions || [],
      bills: metadata.bills || [],
      debts: metadata.debts || [],
      goals: metadata.goals || [],
      investments: metadata.investments || [],
      categories: metadata.categories || [],
      budgetMonth: metadata.budget_months?.[0] || getEmptyUserData().budgetMonth
    }

    return { ...userData, isDemoAccount: isDemo }
  } catch (error) {
    console.error('Error fetching user data:', error)
    return { ...getEmptyUserData(), isDemoAccount: false }
  }
}

// Update user data in Supabase metadata
export async function updateUserData(updates: Partial<UserData>): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data: { user }, error: getUserError } = await supabase.auth.getUser()
    
    if (getUserError || !user) {
      console.error('No authenticated user found')
      return false
    }

    const currentMetadata = user.user_metadata || {}
    const updatedMetadata = { ...currentMetadata }

    // Update specific data sections
    if (updates.income) updatedMetadata.recurring_income = updates.income
    if (updates.transactions) updatedMetadata.transactions = updates.transactions
    if (updates.bills) updatedMetadata.bills = updates.bills
    if (updates.debts) updatedMetadata.debts = updates.debts
    if (updates.goals) updatedMetadata.goals = updates.goals
    if (updates.investments) updatedMetadata.investments = updates.investments
    if (updates.categories) updatedMetadata.categories = updates.categories
    if (updates.budgetMonth) {
      updatedMetadata.budget_months = [updates.budgetMonth]
    }

    const { error } = await supabase.auth.updateUser({
      data: updatedMetadata
    })

    if (error) {
      console.error('Error updating user data:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating user data:', error)
    return false
  }
}

// Helper functions for specific data operations
export async function addTransaction(transaction: Omit<UserData['transactions'][0], 'id'>) {
  const userData = await getUserData()
  const newTransaction = {
    ...transaction,
    id: Date.now().toString()
  }
  
  userData.transactions.push(newTransaction)
  return await updateUserData({ transactions: userData.transactions })
}

export async function addBill(bill: Omit<UserData['bills'][0], 'id'>) {
  const userData = await getUserData()
  const newBill = {
    ...bill,
    id: Date.now().toString()
  }
  
  userData.bills.push(newBill)
  return await updateUserData({ bills: userData.bills })
}

export async function addGoal(goal: Omit<UserData['goals'][0], 'id'>) {
  const userData = await getUserData()
  const newGoal = {
    ...goal,
    id: Date.now().toString()
  }
  
  userData.goals.push(newGoal)
  return await updateUserData({ goals: userData.goals })
}

export async function updateGoal(goalId: string, updates: Partial<UserData['goals'][0]>) {
  const userData = await getUserData()
  const goalIndex = userData.goals.findIndex(g => g.id === goalId)
  
  if (goalIndex === -1) return false
  
  userData.goals[goalIndex] = { ...userData.goals[goalIndex], ...updates }
  return await updateUserData({ goals: userData.goals })
}

// Calculate derived metrics
export function calculateMetrics(userData: UserData & { isDemoAccount: boolean }): DashboardKpis {
  const totalIncome = userData.income
    .filter(inc => inc.active)
    .reduce((sum, inc) => {
      // Convert to monthly amount
      const multiplier = {
        weekly: 52/12,
        biweekly: 26/12, 
        semimonthly: 2,
        monthly: 1
      }[inc.frequency]
      return sum + (inc.amount * multiplier)
    }, 0)

  const totalExpenses = userData.transactions
    .filter(txn => txn.type === 'expense')
    .reduce((sum, txn) => sum + Math.abs(txn.amount), 0)

  const totalDebt = userData.debts.reduce((sum, debt) => sum + debt.balance, 0)
  
  const totalGoalTarget = userData.goals.reduce((sum, goal) => sum + goal.targetCents, 0) / 100
  const totalGoalSaved = userData.goals.reduce((sum, goal) => sum + goal.savedCents, 0) / 100

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

  return {
    readyToAssign: 0, // Would be calculated from budget data
    incomeThisMonth: thisMonthIncome,
    totalSpentThisMonth: thisMonthExpenses,
    totalIncome,
    debtOutstanding: totalDebt,
    savingsRate,
    budgetUtilization: 0 // Would be calculated from budget utilization
  }
}
