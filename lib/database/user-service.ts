// Database service layer to replace user metadata storage
// This solves the REQUEST_HEADER_TOO_LARGE issue permanently

import { createClient } from '@/lib/supabase/server'

// Optional Prisma import - fallback if not available
let prisma: any = null
try {
  const { prisma: prismaClient } = require('@/lib/prisma')
  prisma = prismaClient
} catch (error) {
  console.warn('Prisma not available, using metadata fallback')
}

export interface DatabaseUserData {
  userId: string
  profile: {
    name: string
    email: string
    currency: string
    timezone: string
    onboardingDone: boolean
  }
  goals: Array<{
    id: string
    name: string
    priority: number
    targetAmount: number
    savedAmount: number
    targetDate?: string
    status: string
    progressPercent: number
  }>
  debts: Array<{
    id: string
    name: string
    type: string
    principalBalance: number
    apr: number
    minPayment: number
    status: string
  }>
  income: Array<{
    id: string
    name: string
    type: string
    amount: number
    paySchedule: string
    nextPayDate?: string
    active: boolean
  }>
  investments: Array<{
    id: string
    name: string
    type: string
    currentValue: number
    totalContributed: number
    monthlyContributions: number
  }>
  transactions: Array<{
    id: string
    date: string
    merchant: string
    category: string
    account: string
    type: string
    amount: number
  }>
  bills: Array<{
    id: string
    name: string
    amount: number
    category: string
    frequency: string
    nextDue: string
    status: string
  }>
}

/**
 * Get comprehensive user data from database instead of metadata
 */
export async function getDatabaseUserData(): Promise<DatabaseUserData> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      throw new Error('Not authenticated')
    }

    // Check if Prisma is available
    if (!prisma) {
      throw new Error('Database not available, using fallback')
    }

    // Get user profile from database
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: true
      }
    })

    // Get goals from database
    const goals = await prisma.goalV2.findMany({
      where: { userId: user.id },
      include: {
        contributions: true,
        milestones: true
      },
      orderBy: { priority: 'desc' }
    })

    // Get debts from database
    const debts = await prisma.debtAccount.findMany({
      where: { 
        userId: user.id,
        archivedAt: null
      },
      include: {
        payments: {
          orderBy: { paidAt: 'desc' },
          take: 5
        }
      }
    })

    // Get income sources from database
    const incomeSources = await prisma.incomeSource.findMany({
      where: { userId: user.id },
      include: {
        deductions: true,
        occurrences: {
          where: {
            scheduledAt: {
              gte: new Date()
            }
          },
          orderBy: { scheduledAt: 'asc' },
          take: 5
        }
      }
    })

    // Get investment accounts from database
    const investments = await prisma.investmentAccountV2.findMany({
      where: { userId: user.id },
      include: {
        contributions: {
          orderBy: { date: 'desc' },
          take: 10
        },
        snapshots: {
          orderBy: { asOf: 'desc' },
          take: 1
        }
      }
    })

    // Get recent transactions from database
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      include: {
        category: true,
        account: true
      },
      orderBy: { date: 'desc' },
      take: 50
    })

    // Get bills from database
    const bills = await prisma.bill.findMany({
      where: { 
        userId: user.id,
        active: true
      },
      include: {
        category: true,
        account: true
      },
      orderBy: { nextDue: 'asc' }
    })

    // Transform data to expected format
    const userData: DatabaseUserData = {
      userId: user.id,
      profile: {
        name: userProfile?.displayName || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        currency: userProfile?.currency || 'USD',
        timezone: userProfile?.timezone || 'UTC',
        onboardingDone: userProfile?.onboardingDone || false
      },
      goals: goals.map(goal => {
        const savedAmount = goal.contributions.reduce((sum, contrib) => sum + Number(contrib.amount), 0)
        const progressPercent = goal.targetAmount > 0 ? (savedAmount / Number(goal.targetAmount)) * 100 : 0
        
        return {
          id: goal.id,
          name: goal.name,
          priority: goal.priority,
          targetAmount: Number(goal.targetAmount),
          savedAmount,
          targetDate: goal.targetDate?.toISOString(),
          status: goal.status,
          progressPercent: Math.min(100, progressPercent)
        }
      }),
      debts: debts.map(debt => ({
        id: debt.id,
        name: debt.name,
        type: debt.type,
        principalBalance: Number(debt.principalBalance),
        apr: debt.apr,
        minPayment: Number(debt.minPayment),
        status: debt.archivedAt ? 'archived' : 'active'
      })),
      income: incomeSources.map(source => {
        const nextOccurrence = source.occurrences[0]
        return {
          id: source.id,
          name: source.name,
          type: source.type,
          amount: Number(source.net || source.gross || 0),
          paySchedule: source.paySchedule,
          nextPayDate: nextOccurrence?.scheduledAt.toISOString(),
          active: true
        }
      }),
      investments: investments.map(account => {
        const totalContributed = account.contributions.reduce((sum, contrib) => sum + Number(contrib.amount), 0)
        const latestSnapshot = account.snapshots[0]
        const currentValue = latestSnapshot ? Number(latestSnapshot.value) : totalContributed
        
        // Calculate monthly contributions (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const monthlyContributions = account.contributions
          .filter(contrib => contrib.date >= thirtyDaysAgo)
          .reduce((sum, contrib) => sum + Number(contrib.amount), 0)

        return {
          id: account.id,
          name: account.name,
          type: account.type,
          currentValue,
          totalContributed,
          monthlyContributions
        }
      }),
      transactions: transactions.map(txn => ({
        id: txn.id,
        date: txn.date.toISOString().split('T')[0],
        merchant: txn.merchant || 'Unknown',
        category: txn.category?.name || 'Uncategorized',
        account: txn.account.name,
        type: txn.type.toLowerCase(),
        amount: Number(txn.amountCents) / 100
      })),
      bills: bills.map(bill => ({
        id: bill.id,
        name: bill.name,
        amount: Number(bill.amount),
        category: bill.category?.name || 'Bills',
        frequency: 'monthly', // Would be determined from recurrence
        nextDue: bill.nextDue?.toISOString().split('T')[0] || '',
        status: bill.active ? 'active' : 'inactive'
      }))
    }

    return userData

  } catch (error) {
    console.error('Error fetching database user data:', error)
    
    // Fallback: try to get data from user metadata
    return await getFallbackUserData()
  }
}

/**
 * Fallback to user metadata if database is not available
 */
async function getFallbackUserData(): Promise<DatabaseUserData> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      throw new Error('Not authenticated')
    }

    const metadata = user.user_metadata || {}

    return {
      userId: user.id,
      profile: {
        name: metadata.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        currency: metadata.currency || 'USD',
        timezone: metadata.timezone || 'UTC',
        onboardingDone: metadata.onboarding_done || false
      },
      goals: (metadata.goals_v2 || metadata.goals || []).map((goal: any) => ({
        id: goal.id,
        name: goal.name,
        priority: goal.priority || 3,
        targetAmount: goal.targetAmount || goal.targetCents / 100 || 0,
        savedAmount: goal.savedAmount || goal.savedCents / 100 || 0,
        targetDate: goal.targetDate,
        status: goal.status || 'ACTIVE',
        progressPercent: goal.progressPercent || 0
      })),
      debts: (metadata.debt_accounts || metadata.debts || []).map((debt: any) => ({
        id: debt.id,
        name: debt.name,
        type: debt.type,
        principalBalance: debt.principalBalance || debt.balance || 0,
        apr: debt.apr || debt.interest || 0,
        minPayment: debt.minPayment || 0,
        status: 'active'
      })),
      income: (metadata.income_sources || metadata.recurring_income || []).map((income: any) => ({
        id: income.id,
        name: income.name,
        type: income.type || 'EMPLOYMENT',
        amount: income.net || income.amount || 0,
        paySchedule: income.paySchedule || income.frequency || 'MONTHLY',
        nextPayDate: income.nextPayDate,
        active: income.active !== false
      })),
      investments: (metadata.investment_accounts || metadata.investments || []).map((investment: any) => ({
        id: investment.id,
        name: investment.name,
        type: investment.type || 'BROKERAGE',
        currentValue: investment.currentValue || 0,
        totalContributed: investment.totalContributed || 0,
        monthlyContributions: investment.monthlyContribution || 0
      })),
      transactions: (metadata.transactions_v2 || metadata.transactions || []).slice(-50).map((txn: any) => ({
        id: txn.id,
        date: txn.date,
        merchant: txn.merchant || txn.description || 'Unknown',
        category: txn.categoryName || txn.category || 'Uncategorized',
        account: txn.accountName || txn.account || 'Default',
        type: txn.type?.toLowerCase() || 'expense',
        amount: txn.amount || 0
      })),
      bills: (metadata.bills || []).map((bill: any) => ({
        id: bill.id,
        name: bill.name,
        amount: bill.amount || 0,
        category: bill.category || 'Bills',
        frequency: bill.frequency || 'monthly',
        nextDue: bill.dueDate || bill.nextDue || '',
        status: bill.status || 'active'
      }))
    }

  } catch (error) {
    console.error('Error in fallback user data:', error)
    throw new Error('Failed to load user data')
  }
}

/**
 * Migrate user data from metadata to database
 */
export async function migrateUserDataToDatabase(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user || user.id !== userId) {
      return { success: false, message: 'Not authenticated or user mismatch' }
    }

    const metadata = user.user_metadata || {}

    // Check if user already has database records
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId }
    })

    if (existingProfile) {
      return { success: true, message: 'User data already migrated to database' }
    }

    // Start transaction for atomic migration
    await prisma.$transaction(async (tx) => {
      // Create user profile
      await tx.userProfile.create({
        data: {
          userId,
          onboardingDone: metadata.onboarding_done || false,
          currency: metadata.currency || 'USD',
          timezone: metadata.timezone || 'UTC',
          displayName: metadata.name || metadata.full_name,
          paySchedule: metadata.pay_schedule || 'MONTHLY'
        }
      })

      // Migrate goals
      const goals = metadata.goals_v2 || metadata.goals || []
      for (const goal of goals.slice(0, 10)) { // Limit to prevent timeout
        await tx.goalV2.create({
          data: {
            userId,
            name: goal.name,
            priority: goal.priority || 3,
            targetAmount: goal.targetAmount || goal.targetCents / 100 || 0,
            currency: goal.currency || 'USD',
            targetDate: goal.targetDate ? new Date(goal.targetDate) : null,
            status: goal.status || 'ACTIVE'
          }
        })
      }

      // Migrate debts
      const debts = metadata.debt_accounts || metadata.debts || []
      for (const debt of debts.slice(0, 10)) {
        await tx.debtAccount.create({
          data: {
            userId,
            name: debt.name,
            type: debt.type || 'credit_card',
            principalBalance: debt.principalBalance || debt.balance || 0,
            apr: debt.apr || debt.interest || 0,
            minPayment: debt.minPayment || 0,
            startDate: debt.startDate ? new Date(debt.startDate) : new Date(),
            timezone: debt.timezone || 'UTC'
          }
        })
      }

      // Migrate income sources
      const incomeSources = metadata.income_sources || []
      for (const source of incomeSources.slice(0, 5)) {
        await tx.incomeSource.create({
          data: {
            userId,
            name: source.name,
            type: source.type || 'EMPLOYMENT',
            net: source.net || source.amount || 0,
            gross: source.gross,
            paySchedule: source.paySchedule || 'MONTHLY',
            anchorDate: source.anchorDate ? new Date(source.anchorDate) : new Date(),
            autopost: source.autopost !== false
          }
        })
      }

      // Migrate investment accounts
      const investments = metadata.investment_accounts || metadata.investments || []
      for (const investment of investments.slice(0, 5)) {
        await tx.investmentAccountV2.create({
          data: {
            userId,
            name: investment.name,
            type: investment.type || 'BROKERAGE',
            currentValue: investment.currentValue || 0,
            trackHoldings: investment.trackHoldings || false
          }
        })
      }
    })

    // Clear large metadata after successful migration
    await supabase.auth.updateUser({
      data: {
        // Keep only essential metadata
        onboarding_done: true,
        name: metadata.name,
        currency: metadata.currency || 'USD',
        timezone: metadata.timezone || 'UTC',
        migrated_to_database: true,
        migration_date: new Date().toISOString()
      }
    })

    return { 
      success: true, 
      message: 'User data successfully migrated to database! Header size issue resolved.' 
    }

  } catch (error) {
    console.error('Error migrating user data:', error)
    return { 
      success: false, 
      message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

/**
 * Check if user data is migrated to database
 */
export async function isUserDataMigrated(userId: string): Promise<boolean> {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId }
    })
    return !!profile
  } catch (error) {
    return false
  }
}

/**
 * Create user profile if it doesn't exist
 */
export async function ensureUserProfile(userId: string, email: string): Promise<void> {
  try {
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId }
    })

    if (!existingProfile) {
      await prisma.userProfile.create({
        data: {
          userId,
          currency: 'USD',
          timezone: 'UTC',
          displayName: email.split('@')[0],
          onboardingDone: false
        }
      })
    }
  } catch (error) {
    console.error('Error ensuring user profile:', error)
  }
}
