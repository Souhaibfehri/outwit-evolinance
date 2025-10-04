'use server'

import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'
import { z } from 'zod'

// Zod schemas for validation
const ProfileSchema = z.object({
  name: z.string().min(1).max(100),
  currency: z.string().min(3).max(3),
  timezone: z.string().min(1),
})

const IncomeSchema = z.object({
  recurring: z.array(z.object({
    name: z.string().min(1),
    amount: z.number().min(0),
    frequency: z.enum(['weekly', 'biweekly', 'semimonthly', 'monthly', 'quarterly', 'annual', 'custom']),
    nextPayDate: z.string(),
    active: z.boolean().default(true)
  })),
  oneOff: z.array(z.object({
    name: z.string().min(1),
    amount: z.number().min(0),
    date: z.string()
  })),
  benefits: z.object({
    retirement401k: z.number().min(0).default(0),
    employerMatch: z.number().min(0).default(0),
    preTaxDeductions: z.number().min(0).default(0)
  }).optional()
})

const BillsSchema = z.object({
  bills: z.array(z.object({
    name: z.string().min(1),
    amount: z.number().min(0),
    frequency: z.string().default('monthly'),
    dueDate: z.string().optional(),
    category: z.string(),
    rollover: z.boolean().default(false)
  }))
})

const DebtsSchema = z.object({
  debts: z.array(z.object({
    name: z.string().min(1),
    type: z.enum(['credit_card', 'personal_loan', 'student_loan', 'auto_loan', 'mortgage', 'other']),
    balance: z.number().min(0),
    apr: z.number().min(0).max(100),
    paymentType: z.enum(['minimum_only', 'fixed_installment']),
    minPayment: z.number().min(0).optional(),
    fixedPayment: z.number().min(0).optional()
  }))
})

const GoalsSchema = z.object({
  goals: z.array(z.object({
    name: z.string().min(1),
    target: z.number().min(0),
    deadline: z.string().optional(),
    priority: z.number().min(1).max(5).default(3),
    autoSave: z.number().min(0).default(0)
  }))
})

const QuickCaptureSchema = z.object({
  total: z.number().min(0),
  method: z.enum(['smart', 'manual']),
  periodFrom: z.string().optional(),
  periodTo: z.string().optional(),
  breakdown: z.array(z.object({
    categoryId: z.string(),
    categoryName: z.string(),
    amount: z.number().min(0)
  }))
})

// Helper functions
export async function estimateNextPayDate(frequency: string, baseDate?: Date): Promise<Date> {
  const base = baseDate || new Date()
  const next = new Date(base)

  switch (frequency) {
    case 'weekly':
      next.setDate(next.getDate() + 7)
      break
    case 'biweekly':
      next.setDate(next.getDate() + 14)
      break
    case 'semimonthly':
      // 15th and last day of month logic (simplified)
      next.setDate(next.getDate() + 15)
      break
    case 'monthly':
      next.setMonth(next.getMonth() + 1)
      break
    case 'quarterly':
      next.setMonth(next.getMonth() + 3)
      break
    case 'annual':
      next.setFullYear(next.getFullYear() + 1)
      break
    default:
      // Custom - return next month as fallback
      next.setMonth(next.getMonth() + 1)
      break
  }
  
  return next
}

export async function distributeByHeuristic(amount: number, categories: string[]): Promise<Array<{categoryId: string, amount: number}>> {
  // Default heuristic distribution
  const heuristics: Record<string, number> = {
    'essentials': 0.60,
    'housing': 0.30,
    'food': 0.15,
    'transport': 0.10,
    'lifestyle': 0.25,
    'entertainment': 0.05,
    'savings': 0.10,
    'other': 0.05
  }

  const distribution: Array<{categoryId: string, amount: number}> = []
  let remainingAmount = amount
  
  categories.forEach((categoryId, index) => {
    const categoryName = categoryId.toLowerCase()
    let percentage = 0
    
    // Find matching heuristic
    for (const [key, value] of Object.entries(heuristics)) {
      if (categoryName.includes(key)) {
        percentage = value
        break
      }
    }
    
    // If no match, distribute remaining equally
    if (percentage === 0) {
      percentage = Math.max(0.05, remainingAmount / (categories.length - index))
    }
    
    const categoryAmount = Math.round(amount * percentage * 100) / 100
    distribution.push({
      categoryId,
      amount: Math.min(categoryAmount, remainingAmount)
    })
    
    remainingAmount = Math.max(0, remainingAmount - categoryAmount)
  })
  
  return distribution
}

// Server Actions
export async function upsertOnboarding(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const step = parseInt(formData.get('step') as string)
    const payload = JSON.parse(formData.get('payload') as string)

    // Get existing onboarding session
    const metadata = user.user_metadata || {}
    let onboardingSession = metadata.onboarding_session || {
      id: Date.now().toString(),
      userId: user.id,
      currentStep: 0,
      completed: false,
      stepsDone: [],
      answers: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Update session
    onboardingSession = {
      ...onboardingSession,
      currentStep: Math.max(onboardingSession.currentStep, step),
      answers: {
        ...onboardingSession.answers,
        [`step${step}`]: payload
      },
      updatedAt: new Date().toISOString()
    }

    const result = await updateUserMetadata({
      onboarding_session: onboardingSession
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, session: onboardingSession }
  } catch (error) {
    console.error('Error upserting onboarding:', error)
    return { success: false, error: 'Failed to save onboarding progress' }
  }
}

export async function markStepDone(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const stepKey = formData.get('stepKey') as string

    const metadata = user.user_metadata || {}
    let onboardingSession = metadata.onboarding_session || {}

    const stepsDone = onboardingSession.stepsDone || []
    if (!stepsDone.includes(stepKey)) {
      stepsDone.push(stepKey)
    }

    onboardingSession = {
      ...onboardingSession,
      stepsDone,
      updatedAt: new Date().toISOString()
    }

    const result = await updateUserMetadata({
      onboarding_session: onboardingSession
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, stepsDone }
  } catch (error) {
    console.error('Error marking step done:', error)
    return { success: false, error: 'Failed to mark step as done' }
  }
}

export async function completeOnboarding(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const metadata = user.user_metadata || {}
    const onboardingSession = metadata.onboarding_session || {}
    const answers = onboardingSession.answers || {}

    // Get current month
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // Calculate expected monthly income
    let expectedIncome = 0
    if (answers.step1?.recurring) {
      answers.step1.recurring.forEach((income: any) => {
        if (income.active) {
          switch (income.frequency) {
            case 'weekly':
              expectedIncome += income.amount * 4.33
              break
            case 'biweekly':
              expectedIncome += income.amount * 2.17
              break
            case 'semimonthly':
              expectedIncome += income.amount * 2
              break
            case 'monthly':
              expectedIncome += income.amount
              break
            case 'quarterly':
              expectedIncome += income.amount / 3
              break
            case 'annual':
              expectedIncome += income.amount / 12
              break
            default:
              expectedIncome += income.amount // Assume monthly for custom
          }
        }
      })
    }

    // Create default category groups if they don't exist
    const categoryGroups = metadata.category_groups || []
    const categories = metadata.categories || []

    if (categoryGroups.length === 0) {
      const defaultGroups = [
        { name: 'Essentials', icon: '🏠', sortOrder: 0, isDefault: true },
        { name: 'Lifestyle', icon: '☕', sortOrder: 1, isDefault: true },
        { name: 'Savings', icon: '💰', sortOrder: 2, isDefault: true }
      ]

      defaultGroups.forEach((group, index) => {
        const groupId = `default_group_${Date.now()}_${index}`
        categoryGroups.push({
          id: groupId,
          userId: user.id,
          name: group.name,
          icon: group.icon,
          sortOrder: group.sortOrder,
          isDefault: group.isDefault,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      })
    }

    // Create categories from bills and goals
    if (answers.step2?.bills) {
      answers.step2.bills.forEach((bill: any, index: number) => {
        const categoryId = `bill_cat_${Date.now()}_${index}`
        const groupId = categoryGroups.find((g: any) => g.name === 'Essentials')?.id || categoryGroups[0]?.id
        
        categories.push({
          id: categoryId,
          userId: user.id,
          name: bill.name,
          groupId,
          priority: 3,
          rollover: bill.rollover || false,
          sortOrder: index,
          archived: false,
          type: 'expense',
          monthlyBudgetCents: Math.round(bill.amount * 100),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      })
    }

    // Create budget month
    const budgetMonths = metadata.budget_months || []
    let budgetMonth = budgetMonths.find((bm: any) => bm.month === currentMonth)
    
    if (!budgetMonth) {
      budgetMonth = {
        id: Date.now().toString(),
        userId: user.id,
        month: currentMonth,
        expectedIncome: Math.round(expectedIncome * 100) / 100,
        allowOverAssign: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      budgetMonths.push(budgetMonth)
    }

    // Initialize budget items
    const budgetItems = metadata.budget_items || []
    categories.forEach((category: any) => {
      const existingItem = budgetItems.find(
        (bi: any) => bi.userId === user.id && bi.month === currentMonth && bi.categoryId === category.id
      )
      
      if (!existingItem) {
        budgetItems.push({
          id: `budget_item_${Date.now()}_${category.id}`,
          userId: user.id,
          month: currentMonth,
          categoryId: category.id,
          assigned: 0,
          spent: 0,
          leftoverFromPrev: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }
    })

    // Mark onboarding as complete
    const completedSession = {
      ...onboardingSession,
      completed: true,
      currentStep: 6,
      updatedAt: new Date().toISOString()
    }

    // Save all data
    const result = await updateUserMetadata({
      onboarding_session: completedSession,
      category_groups: categoryGroups,
      categories,
      budget_months: budgetMonths,
      budget_items: budgetItems,
      recurring_income: answers.step1?.recurring || [],
      one_off_income: answers.step1?.oneOff || [],
      bills: answers.step2?.bills || [],
      debts: answers.step3?.debts || [],
      goals: answers.step4?.goals || []
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { 
      success: true, 
      message: 'Onboarding completed successfully!',
      expectedIncome: Math.round(expectedIncome * 100) / 100,
      categoriesCreated: categories.length,
      groupsCreated: categoryGroups.length
    }
  } catch (error) {
    console.error('Error completing onboarding:', error)
    return { success: false, error: 'Failed to complete onboarding' }
  }
}

export async function createQuickCapture(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const data = QuickCaptureSchema.parse(JSON.parse(formData.get('data') as string))

    // Create quick capture record
    const quickCapture = {
      id: Date.now().toString(),
      userId: user.id,
      total: data.total,
      method: data.method,
      periodFrom: data.periodFrom ? new Date(data.periodFrom).toISOString() : undefined,
      periodTo: data.periodTo ? new Date(data.periodTo).toISOString() : undefined,
      breakdown: data.breakdown,
      note: `Quick estimate for ${data.method} distribution`,
      createdAt: new Date().toISOString()
    }

    // Create transactions from breakdown
    const transactions = data.breakdown.map((item, index) => ({
      id: `quick_capture_${Date.now()}_${index}`,
      date: data.periodTo || new Date().toISOString().split('T')[0],
      merchant: `${item.categoryName} (Quick estimate)`,
      categoryId: item.categoryId,
      accountId: 'default_cash', // Default cash account
      type: 'EXPENSE',
      amountCents: Math.round(item.amount * 100),
      note: 'Quick estimate transaction',
      isApproximate: true,
      source: 'quick_capture',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))

    // Update user metadata
    const metadata = user.user_metadata || {}
    const existingTransactions = metadata.transactions || []
    const existingQuickCaptures = metadata.quick_captures || []

    const result = await updateUserMetadata({
      transactions: [...existingTransactions, ...transactions],
      quick_captures: [...existingQuickCaptures, quickCapture]
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { 
      success: true, 
      message: `Created ${transactions.length} estimated transactions for $${data.total}`,
      transactionsCreated: transactions.length,
      quickCapture
    }
  } catch (error) {
    console.error('Error creating quick capture:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => e.message).join(', ') }
    }
    return { success: false, error: 'Failed to create quick capture' }
  }
}

export async function getOnboardingSession() {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const metadata = user.user_metadata || {}
    const session = metadata.onboarding_session || {
      id: Date.now().toString(),
      userId: user.id,
      currentStep: 0,
      completed: false,
      stepsDone: [],
      answers: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    return { success: true, session }
  } catch (error) {
    console.error('Error getting onboarding session:', error)
    return { success: false, error: 'Failed to get onboarding session' }
  }
}
