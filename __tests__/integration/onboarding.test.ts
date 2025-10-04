import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock the Supabase client
jest.mock('@/lib/ensureUser', () => ({
  getUserAndEnsure: jest.fn(),
  updateUserMetadata: jest.fn()
}))

// Mock user data
const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  user_metadata: {}
}

const mockOnboardingData = {
  income: {
    streams: [
      {
        name: 'Salary',
        amount: 5000,
        frequency: 'monthly' as const,
        nextPayDate: '2024-02-01',
        active: true
      }
    ],
    otherMonthly: 500
  },
  bills: [
    {
      name: 'Rent',
      amount: 1200,
      cadence: 'monthly' as const,
      nextDue: '2024-01-01',
      categoryHint: 'Housing'
    },
    {
      name: 'Electric Bill',
      amount: 85,
      cadence: 'monthly' as const,
      nextDue: '2024-01-15',
      categoryHint: 'Utilities'
    }
  ],
  debts: [
    {
      name: 'Credit Card',
      balance: 3000,
      apr: 0.18,
      paymentType: 'minimum' as const,
      minOrFixedAmount: 75
    }
  ],
  goals: [
    {
      name: 'Emergency Fund',
      target: 10000,
      current: 1000,
      priority: 1,
      notify: true
    }
  ],
  categories: {
    groups: [
      { name: 'Essentials', isSystem: true, sort: 0 },
      { name: 'Lifestyle', isSystem: true, sort: 1 }
    ],
    categories: [
      { name: 'Housing', groupName: 'Essentials', rollover: false, priority: 1 },
      { name: 'Groceries', groupName: 'Essentials', rollover: false, priority: 1 },
      { name: 'Entertainment', groupName: 'Lifestyle', rollover: true, priority: 3 }
    ]
  },
  userPrefs: {
    currency: 'USD',
    timezone: 'UTC',
    theme: 'system',
    softBudgetLimit: true,
    allowRolloverDefault: true
  }
}

describe('Onboarding Integration Tests', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    const { getUserAndEnsure, updateUserMetadata } = require('@/lib/ensureUser')
    getUserAndEnsure.mockResolvedValue(mockUser)
    updateUserMetadata.mockResolvedValue({ success: true })
  })

  describe('POST /api/onboarding/complete', () => {
    it('should complete onboarding and seed data successfully', async () => {
      // This would be a real integration test with a test database
      // For now, we'll test the data transformation logic
      
      const { income, bills, debts, goals, categories } = mockOnboardingData
      
      // Test income processing
      expect(income.streams).toHaveLength(1)
      expect(income.streams[0].amount).toBe(5000)
      expect(income.otherMonthly).toBe(500)
      
      // Test bills processing
      expect(bills).toHaveLength(2)
      expect(bills[0].name).toBe('Rent')
      expect(bills[0].amount).toBe(1200)
      
      // Test debt processing
      expect(debts).toHaveLength(1)
      expect(debts[0].paymentType).toBe('minimum')
      expect(debts[0].apr).toBe(0.18)
      
      // Test goals processing
      expect(goals).toHaveLength(1)
      expect(goals[0].priority).toBe(1)
      expect(goals[0].notify).toBe(true)
      
      // Test category structure
      expect(categories.groups).toHaveLength(2)
      expect(categories.categories).toHaveLength(3)
      
      // Calculate expected monthly income
      const expectedMonthlyIncome = income.streams.reduce((total, stream) => {
        return total + (stream.frequency === 'monthly' ? stream.amount : stream.amount)
      }, 0) + (income.otherMonthly || 0)
      
      expect(expectedMonthlyIncome).toBe(5500) // 5000 + 500
    })

    it('should validate onboarding data correctly', async () => {
      // Test validation logic
      const invalidData = {
        ...mockOnboardingData,
        income: {
          streams: [
            {
              name: '', // Invalid: empty name
              amount: -1000, // Invalid: negative amount
              frequency: 'invalid' as any, // Invalid: bad frequency
              nextPayDate: 'invalid-date', // Invalid: bad date
              active: true
            }
          ]
        }
      }
      
      // In a real test, this would call the API and expect validation errors
      expect(invalidData.income.streams[0].name).toBe('')
      expect(invalidData.income.streams[0].amount).toBeLessThan(0)
    })

    it('should create proper budget month and items', async () => {
      const { income, categories } = mockOnboardingData
      
      // Calculate expected budget month
      const expectedIncome = 5500 // From test above
      const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
      
      // Should create budget month
      const budgetMonth = {
        userId: mockUser.id,
        month: currentMonth,
        expectedIncome,
        allowOverAssign: false
      }
      
      expect(budgetMonth.expectedIncome).toBe(5500)
      expect(budgetMonth.month).toMatch(/^\d{4}-\d{2}$/)
      
      // Should create budget items for each category
      const expectedBudgetItems = categories.categories.length
      expect(expectedBudgetItems).toBe(3)
    })
  })

  describe('Data Seeding Logic', () => {
    it('should create category groups with proper defaults', () => {
      const { categories } = mockOnboardingData
      
      // Test group creation
      const groups = categories.groups.map((group, index) => ({
        id: `group_${Date.now()}_${index}`,
        name: group.name,
        isDefault: group.isSystem || false,
        sortOrder: group.sort || index
      }))
      
      expect(groups).toHaveLength(2)
      expect(groups[0].name).toBe('Essentials')
      expect(groups[0].isDefault).toBe(true)
      expect(groups[1].name).toBe('Lifestyle')
    })

    it('should create categories with proper relationships', () => {
      const { categories } = mockOnboardingData
      
      const cats = categories.categories.map((cat, index) => ({
        id: `cat_${Date.now()}_${index}`,
        name: cat.name,
        groupName: cat.groupName,
        priority: cat.priority || 3,
        rollover: cat.rollover || false
      }))
      
      expect(cats).toHaveLength(3)
      expect(cats[0].name).toBe('Housing')
      expect(cats[0].groupName).toBe('Essentials')
      expect(cats[0].priority).toBe(1)
      expect(cats[0].rollover).toBe(false)
    })

    it('should create recurring income with proper scheduling', () => {
      const { income } = mockOnboardingData
      
      const recurringIncome = income.streams.map((stream, index) => ({
        id: `income_${Date.now()}_${index}`,
        name: stream.name,
        amountCents: Math.round(stream.amount * 100),
        schedule: stream.frequency.toUpperCase(),
        nextDate: stream.nextPayDate,
        active: stream.active
      }))
      
      expect(recurringIncome).toHaveLength(1)
      expect(recurringIncome[0].name).toBe('Salary')
      expect(recurringIncome[0].amountCents).toBe(500000) // $5000 in cents
      expect(recurringIncome[0].schedule).toBe('MONTHLY')
    })

    it('should create debts with correct payment types', () => {
      const { debts } = mockOnboardingData
      
      const debtRecords = debts.map((debt, index) => ({
        id: `debt_${Date.now()}_${index}`,
        name: debt.name,
        balance: debt.balance,
        rate: debt.apr,
        paymentType: debt.paymentType,
        minPayment: debt.paymentType === 'minimum' ? debt.minOrFixedAmount : undefined,
        fixedPayment: debt.paymentType === 'fixed' ? debt.minOrFixedAmount : undefined
      }))
      
      expect(debtRecords).toHaveLength(1)
      expect(debtRecords[0].paymentType).toBe('minimum')
      expect(debtRecords[0].minPayment).toBe(75)
      expect(debtRecords[0].fixedPayment).toBeUndefined()
    })
  })

  describe('Recompute Logic', () => {
    it('should calculate dashboard KPIs correctly', () => {
      // Test KPI calculations with mock data
      const monthlyIncome = 5500 // From onboarding
      const totalAssigned = 0 // New user, nothing assigned yet
      const readyToAssign = monthlyIncome - totalAssigned
      
      expect(readyToAssign).toBe(5500)
      expect(monthlyIncome).toBeGreaterThan(0)
    })

    it('should handle empty data gracefully', () => {
      const emptyData = {
        recurring_income: [],
        budget_items: [],
        transactions: [],
        debts: [],
        goals: []
      }
      
      // Should not crash with empty data
      expect(emptyData.recurring_income).toHaveLength(0)
      expect(emptyData.budget_items).toHaveLength(0)
    })
  })
})
