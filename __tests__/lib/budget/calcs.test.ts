import { 
  calcMonthlyIncome, 
  calcCarryOver, 
  calcMonthSummary, 
  validateAssignment,
  sortCategories,
  formatCurrency,
  calcProgress
} from '@/lib/budget/calcs'

describe('Budget Calculations', () => {
  describe('calcMonthlyIncome', () => {
    it('should calculate monthly income from recurring sources', () => {
      const recurringIncome = [
        { amountCents: 200000, schedule: 'MONTHLY', active: true }, // $2000
        { amountCents: 100000, schedule: 'BIWEEKLY', active: true }, // $1000 bi-weekly = $2170/month
        { amountCents: 50000, schedule: 'WEEKLY', active: false }, // Inactive, should be ignored
      ]
      const oneOffIncome: Array<{ amountCents: number; date: string }> = []
      
      const result = calcMonthlyIncome(recurringIncome, oneOffIncome, '2024-01')
      
      // $2000 + ($1000 * 2.17) = $2000 + $2170 = $4170
      expect(result).toBeCloseTo(4170, 0)
    })

    it('should include one-off income for target month', () => {
      const recurringIncome = [
        { amountCents: 200000, schedule: 'MONTHLY', active: true } // $2000
      ]
      const oneOffIncome = [
        { amountCents: 50000, date: '2024-01-15' }, // $500 in target month
        { amountCents: 30000, date: '2024-02-15' }, // $300 in different month, should be ignored
      ]
      
      const result = calcMonthlyIncome(recurringIncome, oneOffIncome, '2024-01')
      
      expect(result).toBe(2500) // $2000 + $500
    })

    it('should handle irregular income', () => {
      const recurringIncome = [
        { amountCents: 300000, schedule: 'IRREGULAR', active: true } // $3000 assumed monthly
      ]
      const oneOffIncome: Array<{ amountCents: number; date: string }> = []
      
      const result = calcMonthlyIncome(recurringIncome, oneOffIncome, '2024-01')
      
      expect(result).toBe(3000)
    })
  })

  describe('calcCarryOver', () => {
    it('should calculate rollover for categories with leftover amounts', () => {
      const prevMonthCategories = [
        {
          categoryId: 'cat1',
          categoryName: 'Groceries',
          assigned: 500,
          spent: 400,
          leftoverFromPrev: 0,
          left: 100,
          priority: 3,
          rollover: true,
          groupId: 'group1'
        },
        {
          categoryId: 'cat2',
          categoryName: 'Gas',
          assigned: 200,
          spent: 250, // Overspent
          leftoverFromPrev: 0,
          left: -50,
          priority: 3,
          rollover: true,
          groupId: 'group1'
        },
        {
          categoryId: 'cat3',
          categoryName: 'Entertainment',
          assigned: 300,
          spent: 200,
          leftoverFromPrev: 0,
          left: 100,
          priority: 3,
          rollover: false, // No rollover
          groupId: 'group1'
        }
      ]
      
      const result = calcCarryOver(prevMonthCategories, '2024-02', 'user1')
      
      expect(result).toEqual([
        { categoryId: 'cat1', leftoverAmount: 100 } // Only positive rollover categories
      ])
    })

    it('should return empty array when no rollover categories have leftovers', () => {
      const prevMonthCategories = [
        {
          categoryId: 'cat1',
          categoryName: 'Groceries',
          assigned: 500,
          spent: 500, // No leftover
          leftoverFromPrev: 0,
          left: 0,
          priority: 3,
          rollover: true,
          groupId: 'group1'
        }
      ]
      
      const result = calcCarryOver(prevMonthCategories, '2024-02', 'user1')
      
      expect(result).toEqual([])
    })
  })

  describe('calcMonthSummary', () => {
    it('should calculate RTA and summary correctly', () => {
      const budgetData = {
        month: '2024-01',
        userId: 'user1',
        expectedIncome: 5000,
        allowOverAssign: false,
        categories: [
          {
            categoryId: 'cat1',
            categoryName: 'Groceries',
            assigned: 500,
            spent: 400,
            leftoverFromPrev: 50,
            left: 100,
            priority: 3,
            rollover: true,
            groupId: 'group1'
          },
          {
            categoryId: 'cat2',
            categoryName: 'Gas',
            assigned: 200,
            spent: 180,
            leftoverFromPrev: 0,
            left: 20,
            priority: 3,
            rollover: false,
            groupId: 'group1'
          }
        ],
        recurringIncome: [
          { amountCents: 500000, schedule: 'MONTHLY', active: true }
        ],
        oneOffIncome: []
      }
      
      const result = calcMonthSummary(budgetData)
      
      expect(result).toEqual({
        rta: 4350, // 5000 + 50 - 700
        expectedIncome: 5000,
        assignedTotal: 700,
        spentTotal: 580,
        leftoverTotal: 50,
        isOverAssigned: false
      })
    })

    it('should detect over-assignment', () => {
      const budgetData = {
        month: '2024-01',
        userId: 'user1',
        expectedIncome: 1000,
        allowOverAssign: false,
        categories: [
          {
            categoryId: 'cat1',
            categoryName: 'Groceries',
            assigned: 800,
            spent: 0,
            leftoverFromPrev: 0,
            left: 800,
            priority: 3,
            rollover: true,
            groupId: 'group1'
          },
          {
            categoryId: 'cat2',
            categoryName: 'Gas',
            assigned: 500,
            spent: 0,
            leftoverFromPrev: 0,
            left: 500,
            priority: 3,
            rollover: false,
            groupId: 'group1'
          }
        ],
        recurringIncome: [],
        oneOffIncome: []
      }
      
      const result = calcMonthSummary(budgetData)
      
      expect(result.isOverAssigned).toBe(true)
      expect(result.rta).toBe(-300) // 1000 - 1300
    })
  })

  describe('validateAssignment', () => {
    const mockSummary = {
      rta: 1000,
      expectedIncome: 5000,
      assignedTotal: 4000,
      spentTotal: 2000,
      leftoverTotal: 0,
      isOverAssigned: false
    }

    it('should allow assignment within RTA when over-assign is disabled', () => {
      const result = validateAssignment(100, 500, 'cat1', mockSummary, false)
      
      expect(result.isValid).toBe(true)
      expect(result.newRTA).toBe(600) // 1000 - (500 - 100)
    })

    it('should reject assignment exceeding RTA when over-assign is disabled', () => {
      const result = validateAssignment(100, 1500, 'cat1', mockSummary, false)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('exceed your Ready to Assign')
      expect(result.newRTA).toBe(-400) // 1000 - (1500 - 100)
    })

    it('should allow assignment exceeding RTA when over-assign is enabled', () => {
      const result = validateAssignment(100, 1500, 'cat1', mockSummary, true)
      
      expect(result.isValid).toBe(true)
      expect(result.newRTA).toBe(-400)
    })
  })

  describe('sortCategories', () => {
    const categories = [
      {
        categoryId: 'cat1',
        categoryName: 'Zebra',
        assigned: 100,
        spent: 50,
        leftoverFromPrev: 0,
        left: 50,
        priority: 5,
        rollover: true,
        groupId: 'group1'
      },
      {
        categoryId: 'cat2',
        categoryName: 'Alpha',
        assigned: 200,
        spent: 150,
        leftoverFromPrev: 0,
        left: 50,
        priority: 1,
        rollover: false,
        groupId: 'group1'
      },
      {
        categoryId: 'cat3',
        categoryName: 'Beta',
        assigned: 300,
        spent: 100,
        leftoverFromPrev: 0,
        left: 200,
        priority: 3,
        rollover: true,
        groupId: 'group1'
      }
    ]

    it('should sort by priority', () => {
      const result = sortCategories(categories, 'priority')
      
      expect(result[0].categoryName).toBe('Alpha') // Priority 1
      expect(result[1].categoryName).toBe('Beta')  // Priority 3
      expect(result[2].categoryName).toBe('Zebra') // Priority 5
    })

    it('should sort by assigned amount (descending)', () => {
      const result = sortCategories(categories, 'assigned')
      
      expect(result[0].assigned).toBe(300)
      expect(result[1].assigned).toBe(200)
      expect(result[2].assigned).toBe(100)
    })

    it('should sort alphabetically', () => {
      const result = sortCategories(categories, 'alphabetical')
      
      expect(result[0].categoryName).toBe('Alpha')
      expect(result[1].categoryName).toBe('Beta')
      expect(result[2].categoryName).toBe('Zebra')
    })
  })

  describe('formatCurrency', () => {
    it('should format positive amounts', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
    })

    it('should format negative amounts', () => {
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56')
    })

    it('should format zero', () => {
      expect(formatCurrency(0)).toBe('$0.00')
    })
  })

  describe('calcProgress', () => {
    it('should calculate progress percentage', () => {
      expect(calcProgress(250, 1000)).toBe(25)
    })

    it('should cap at 100%', () => {
      expect(calcProgress(1200, 1000)).toBe(100)
    })

    it('should handle zero assigned', () => {
      expect(calcProgress(100, 0)).toBe(0)
    })
  })
})
