import { NextRequest, NextResponse } from 'next/server'
import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'
import { recomputeAll } from '@/lib/recompute'
import { createRecurrence } from '@/lib/recurrence'
import { z } from 'zod'

// Onboarding data types (normalized)
const OnbIncomeSchema = z.object({
  streams: z.array(z.object({
    name: z.string(),
    amount: z.number(),
    frequency: z.enum(['weekly', 'bi-weekly', 'monthly', 'quarterly', 'annual']),
    nextPayDate: z.string(),
    active: z.boolean()
  })),
  otherMonthly: z.number().optional()
})

const OnbBillSchema = z.object({
  name: z.string(),
  amount: z.number(),
  cadence: z.enum(['recurring', 'one-off', 'annual', 'semi-annual', 'quarterly', 'monthly', 'weekly']),
  nextDue: z.string().optional(),
  categoryHint: z.string().optional()
})

const OnbDebtSchema = z.object({
  name: z.string(),
  balance: z.number(),
  apr: z.number(),
  paymentType: z.enum(['minimum', 'fixed']),
  minOrFixedAmount: z.number()
})

const OnbGoalSchema = z.object({
  name: z.string(),
  target: z.number(),
  current: z.number().optional(),
  priority: z.number().min(1).max(5),
  notify: z.boolean(),
  targetDate: z.string().optional()
})

const OnbCategorySetupSchema = z.object({
  groups: z.array(z.object({
    name: z.string(),
    isSystem: z.boolean().optional(),
    sort: z.number().optional()
  })),
  categories: z.array(z.object({
    name: z.string(),
    groupName: z.string(),
    rollover: z.boolean().optional(),
    priority: z.number().optional(),
    sort: z.number().optional()
  }))
})

const OnbInvestmentSchema = z.object({
  name: z.string(),
  amount: z.number(),
  frequency: z.enum(['weekly', 'bi-weekly', 'monthly', 'quarterly', 'annual']),
  expectedAPR: z.number(),
  nextDate: z.string()
})

const OnboardingProfileSchema = z.object({
  income: OnbIncomeSchema,
  bills: z.array(OnbBillSchema),
  debts: z.array(OnbDebtSchema),
  goals: z.array(OnbGoalSchema),
  categories: OnbCategorySetupSchema,
  investments: z.array(OnbInvestmentSchema).optional(),
  userPrefs: z.object({
    currency: z.string().default('USD'),
    timezone: z.string().default('UTC'),
    theme: z.string().default('system'),
    softBudgetLimit: z.boolean().default(true),
    allowRolloverDefault: z.boolean().default(true)
  })
})

export async function POST(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = OnboardingProfileSchema.parse(body)

    // Create onboarding snapshot
    const onboardingProfile = {
      id: Date.now().toString(),
      userId: user.id,
      completedAt: new Date().toISOString(),
      income: validatedData.income,
      bills: validatedData.bills,
      debts: validatedData.debts,
      goals: validatedData.goals,
      categories: validatedData.categories,
      investments: validatedData.investments || [],
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Create user preferences
    const userPrefs = {
      id: Date.now().toString(),
      userId: user.id,
      currency: validatedData.userPrefs.currency,
      timezone: validatedData.userPrefs.timezone,
      theme: validatedData.userPrefs.theme,
      softBudgetLimit: validatedData.userPrefs.softBudgetLimit,
      allowRolloverDefault: validatedData.userPrefs.allowRolloverDefault,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Seed the app with real records
    const seedResult = await seedAppFromOnboarding(user.id, validatedData)
    
    if (!seedResult.success) {
      return NextResponse.json({ success: false, error: seedResult.error }, { status: 500 })
    }

    // Save onboarding profile and user prefs
    const metadata = user.user_metadata || {}
    const updateResult = await updateUserMetadata({
      ...metadata,
      onboarding_profile: onboardingProfile,
      user_prefs: userPrefs,
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString()
    })

    if (!updateResult.success) {
      return NextResponse.json({ success: false, error: updateResult.error }, { status: 500 })
    }

    // Trigger full recompute
    await recomputeAll(user.id)

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      seedResults: seedResult,
      trialEndsAt: onboardingProfile.trialEndsAt
    })

  } catch (error) {
    console.error('Error completing onboarding:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid onboarding data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to complete onboarding'
    }, { status: 500 })
  }
}

/**
 * Seed the app with real records from onboarding data
 */
async function seedAppFromOnboarding(userId: string, data: z.infer<typeof OnboardingProfileSchema>) {
  try {
    const metadata = await getUserMetadata(userId)
    
    // Create category groups and categories
    const categoryGroups = await createCategoryGroups(userId, data.categories, metadata)
    const categories = await createCategories(userId, data.categories, categoryGroups, metadata)

    // Create recurring income
    const recurringIncome = await createRecurringIncome(userId, data.income, metadata)

    // Create bills with recurrence
    const bills = await createBills(userId, data.bills, categories, metadata)

    // Create debts
    const debts = await createDebts(userId, data.debts, metadata)

    // Create goals
    const goals = await createGoals(userId, data.goals, metadata)

    // Create investments
    const investments = data.investments ? await createInvestments(userId, data.investments, metadata) : []

    // Initialize current month budget
    const budgetMonth = await initializeBudgetMonth(userId, data.income, metadata)
    const budgetItems = await initializeBudgetItems(userId, categories, budgetMonth.month, metadata)

    // Update user metadata with all seeded data
    const result = await updateUserMetadata({
      category_groups: categoryGroups,
      categories,
      recurring_income: recurringIncome,
      bills,
      debts,
      goals,
      investments,
      budget_months: [budgetMonth],
      budget_items: budgetItems
    })

    return {
      success: result.success,
      error: result.error,
      seeded: {
        categoryGroups: categoryGroups.length,
        categories: categories.length,
        recurringIncome: recurringIncome.length,
        bills: bills.length,
        debts: debts.length,
        goals: goals.length,
        investments: investments.length
      }
    }
  } catch (error) {
    console.error('Error seeding app from onboarding:', error)
    return { success: false, error: 'Failed to seed app data' }
  }
}

// Helper functions for seeding
async function getUserMetadata(userId: string) {
  const user = await getUserAndEnsure()
  return user?.user_metadata || {}
}

async function createCategoryGroups(userId: string, categorySetup: any, metadata: any) {
  const existingGroups = metadata.category_groups || []
  
  // If no groups specified, create system defaults
  const groupsToCreate = categorySetup.groups.length > 0 ? categorySetup.groups : [
    { name: 'Essentials', isSystem: true, sort: 0 },
    { name: 'Lifestyle', isSystem: true, sort: 1 },
    { name: 'Savings', isSystem: true, sort: 2 },
    { name: 'Income Offsets', isSystem: true, sort: 3 },
    { name: 'Investments', isSystem: true, sort: 4 }
  ]

  const newGroups = groupsToCreate.map((group: any, index: number) => ({
    id: `group_${Date.now()}_${index}`,
    userId,
    name: group.name,
    icon: getGroupIcon(group.name),
    sortOrder: group.sort || index,
    isDefault: group.isSystem || false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }))

  return [...existingGroups, ...newGroups]
}

async function createCategories(userId: string, categorySetup: any, categoryGroups: any[], metadata: any) {
  const existingCategories = metadata.categories || []
  
  const categoriesToCreate = categorySetup.categories.length > 0 ? categorySetup.categories : [
    { name: 'Groceries', groupName: 'Essentials', rollover: false, priority: 1 },
    { name: 'Utilities', groupName: 'Essentials', rollover: false, priority: 1 },
    { name: 'Rent/Mortgage', groupName: 'Essentials', rollover: false, priority: 1 },
    { name: 'Entertainment', groupName: 'Lifestyle', rollover: true, priority: 3 },
    { name: 'Emergency Fund', groupName: 'Savings', rollover: true, priority: 1 }
  ]

  const newCategories = categoriesToCreate.map((cat: any, index: number) => {
    const group = categoryGroups.find((g: any) => g.name === cat.groupName)
    
    return {
      id: `cat_${Date.now()}_${index}`,
      userId,
      name: cat.name,
      groupId: group?.id,
      groupName: cat.groupName,
      priority: cat.priority || 3,
      rollover: cat.rollover || false,
      sortOrder: cat.sort || index,
      archived: false,
      type: 'expense',
      monthlyBudgetCents: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  })

  return [...existingCategories, ...newCategories]
}

async function createRecurringIncome(userId: string, incomeData: any, metadata: any) {
  const existingIncome = metadata.recurring_income || []
  
  const newIncome = incomeData.streams.map((stream: any, index: number) => ({
    id: `income_${Date.now()}_${index}`,
    userId,
    name: stream.name,
    amountCents: Math.round(stream.amount * 100),
    schedule: stream.frequency.toUpperCase().replace('-', ''),
    nextDate: stream.nextPayDate,
    active: stream.active,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }))

  // Add "Other Monthly" if specified
  if (incomeData.otherMonthly && incomeData.otherMonthly > 0) {
    newIncome.push({
      id: `income_other_${Date.now()}`,
      userId,
      name: 'Other Monthly',
      amountCents: Math.round(incomeData.otherMonthly * 100),
      schedule: 'MONTHLY',
      nextDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }

  return [...existingIncome, ...newIncome]
}

async function createBills(userId: string, billsData: any[], categories: any[], metadata: any) {
  const existingBills = metadata.bills || []
  
  const newBills = billsData.map((bill: any, index: number) => {
    // Find matching category
    const category = categories.find((c: any) => 
      c.name.toLowerCase().includes(bill.categoryHint?.toLowerCase() || bill.name.toLowerCase())
    )

    return {
      id: `bill_${Date.now()}_${index}`,
      userId,
      name: bill.name,
      amount: bill.amount,
      categoryId: category?.id,
      nextDue: bill.nextDue || new Date().toISOString(),
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  })

  return [...existingBills, ...newBills]
}

async function createDebts(userId: string, debtsData: any[], metadata: any) {
  const existingDebts = metadata.debts || []
  
  const newDebts = debtsData.map((debt: any, index: number) => ({
    id: `debt_${Date.now()}_${index}`,
    userId,
    name: debt.name,
    balance: debt.balance,
    rate: debt.apr,
    minPayment: debt.paymentType === 'minimum' ? debt.minOrFixedAmount : undefined,
    fixedPayment: debt.paymentType === 'fixed' ? debt.minOrFixedAmount : undefined,
    paymentType: debt.paymentType,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }))

  return [...existingDebts, ...newDebts]
}

async function createGoals(userId: string, goalsData: any[], metadata: any) {
  const existingGoals = metadata.goals || []
  
  const newGoals = goalsData.map((goal: any, index: number) => ({
    id: `goal_${Date.now()}_${index}`,
    userId,
    name: goal.name,
    target: Math.round(goal.target * 100), // Store in cents
    saved: Math.round((goal.current || 0) * 100),
    priority: goal.priority,
    notify: goal.notify,
    targetDate: goal.targetDate,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }))

  return [...existingGoals, ...newGoals]
}

async function createInvestments(userId: string, investmentsData: any[], metadata: any) {
  const existingInvestments = metadata.investments || []
  
  const newInvestments = investmentsData.map((investment: any, index: number) => ({
    id: `investment_${Date.now()}_${index}`,
    userId,
    name: investment.name,
    amount: investment.amount,
    expectedAPR: investment.expectedAPR,
    nextDate: investment.nextDate,
    frequency: investment.frequency,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }))

  return [...existingInvestments, ...newInvestments]
}

async function initializeBudgetMonth(userId: string, incomeData: any, metadata: any) {
  const currentMonth = getCurrentMonth()
  const existingBudgetMonths = metadata.budget_months || []
  
  // Calculate expected income
  const expectedIncome = incomeData.streams.reduce((total: number, stream: any) => {
    if (!stream.active) return total
    
    switch (stream.frequency) {
      case 'weekly': return total + (stream.amount * 4.33)
      case 'bi-weekly': return total + (stream.amount * 2.17)
      case 'monthly': return total + stream.amount
      case 'quarterly': return total + (stream.amount / 3)
      case 'annual': return total + (stream.amount / 12)
      default: return total + stream.amount
    }
  }, 0) + (incomeData.otherMonthly || 0)

  const budgetMonth = {
    id: `budget_month_${Date.now()}`,
    userId,
    month: currentMonth,
    expectedIncome,
    allowOverAssign: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  return budgetMonth
}

async function initializeBudgetItems(userId: string, categories: any[], month: string, metadata: any) {
  const existingBudgetItems = metadata.budget_items || []
  
  const newBudgetItems = categories.map((category: any) => ({
    id: `budget_item_${Date.now()}_${category.id}`,
    userId,
    month,
    categoryId: category.id,
    assigned: 0,
    spent: 0,
    leftoverFromPrev: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }))

  return [...existingBudgetItems, ...newBudgetItems]
}

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getGroupIcon(groupName: string): string {
  const iconMap: Record<string, string> = {
    'Essentials': '🏠',
    'Lifestyle': '☕',
    'Savings': '💰',
    'Income Offsets': '📊',
    'Investments': '📈'
  }
  return iconMap[groupName] || '📂'
}
