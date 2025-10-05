// Unit tests for Credit Card Behavior Engine

import {
  processCreditCardExpense,
  processCreditCardPayment,
  calculatePaymentCategoryStates,
  validateCreditCardTransaction,
  CreditCardAccount,
  CreditCardTransaction
} from '@/lib/credit-cards/engine'

describe('Credit Card Engine', () => {
  const mockCreditCard: CreditCardAccount = {
    id: 'card_1',
    name: 'Chase Sapphire',
    type: 'credit',
    balance: -500, // $500 owed
    paymentCategoryId: 'payment_cat_1',
    paymentStrategy: 'pay_in_full'
  }

  const mockBudgetItems = [
    {
      id: 'budget_1',
      userId: 'user_1',
      month: '2024-01',
      categoryId: 'groceries',
      assigned: 400,
      spent: 200,
      leftoverFromPrev: 0
    },
    {
      id: 'budget_2',
      userId: 'user_1',
      month: '2024-01',
      categoryId: 'payment_cat_1',
      assigned: 300,
      spent: 0,
      leftoverFromPrev: 0
    }
  ]

  describe('processCreditCardExpense', () => {
    it('should process cash expense correctly', () => {
      const transaction: CreditCardTransaction = {
        id: 'txn_1',
        accountId: 'checking_1',
        categoryId: 'groceries',
        amount: 50,
        date: '2024-01-15',
        merchant: 'Whole Foods'
      }

      const result = processCreditCardExpense(
        transaction,
        'groceries',
        'payment_cat_1',
        mockBudgetItems,
        '2024-01'
      )

      expect(result.success).toBe(true)
      expect(result.moves).toHaveLength(0) // No moves for cash transactions
      
      // Spending category should have increased spent amount
      const updatedSpendingItem = result.updatedBudgetItems.find(
        item => item.categoryId === 'groceries'
      )
      expect(updatedSpendingItem.spent).toBe(250) // 200 + 50
    })

    it('should process credit card expense with automatic payment funding', () => {
      const transaction: CreditCardTransaction = {
        id: 'txn_2',
        accountId: 'card_1',
        categoryId: 'groceries',
        amount: 75,
        date: '2024-01-16',
        merchant: 'Target'
      }

      const result = processCreditCardExpense(
        transaction,
        'groceries',
        'payment_cat_1',
        mockBudgetItems,
        '2024-01'
      )

      expect(result.success).toBe(true)
      expect(result.moves).toHaveLength(1)
      expect(result.moves[0].type).toBe('spending_to_payment')
      expect(result.moves[0].amount).toBe(75)

      // Spending category spent should increase
      const updatedSpendingItem = result.updatedBudgetItems.find(
        item => item.categoryId === 'groceries'
      )
      expect(updatedSpendingItem.spent).toBe(275) // 200 + 75

      // Payment category assigned should increase
      const updatedPaymentItem = result.updatedBudgetItems.find(
        item => item.categoryId === 'payment_cat_1'
      )
      expect(updatedPaymentItem.assigned).toBe(375) // 300 + 75
    })

    it('should fail when spending category has insufficient funds', () => {
      const transaction: CreditCardTransaction = {
        id: 'txn_3',
        accountId: 'card_1',
        categoryId: 'groceries',
        amount: 300, // More than available (400 - 200 = 200)
        date: '2024-01-17',
        merchant: 'Expensive Store'
      }

      const result = processCreditCardExpense(
        transaction,
        'groceries',
        'payment_cat_1',
        mockBudgetItems,
        '2024-01'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Insufficient funds')
    })
  })

  describe('processCreditCardPayment', () => {
    it('should process payment correctly', () => {
      const result = processCreditCardPayment(
        200, // payment amount
        'payment_cat_1',
        'card_1',
        mockBudgetItems,
        '2024-01'
      )

      expect(result.success).toBe(true)
      
      // Payment category spent should increase
      const updatedPaymentItem = result.updatedBudgetItems.find(
        item => item.categoryId === 'payment_cat_1'
      )
      expect(updatedPaymentItem.spent).toBe(200)
      expect(result.updatedCardBalance).toBe(200)
    })

    it('should fail when payment category has insufficient funds', () => {
      const result = processCreditCardPayment(
        400, // More than available (300 - 0 = 300)
        'payment_cat_1',
        'card_1',
        mockBudgetItems,
        '2024-01'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Insufficient payment funds')
    })
  })

  describe('calculatePaymentCategoryStates', () => {
    it('should calculate pay-in-full card state correctly', () => {
      const cards: CreditCardAccount[] = [mockCreditCard]
      
      const states = calculatePaymentCategoryStates(cards, mockBudgetItems, '2024-01')
      
      expect(states).toHaveLength(1)
      expect(states[0].paymentAvailable).toBe(300) // assigned - spent
      expect(states[0].cardBalance).toBe(500) // absolute value
      expect(states[0].shouldPayInFull).toBe(true)
      expect(states[0].underfunded).toBe(true) // 300 < 500
    })

    it('should calculate pay-over-time card state correctly', () => {
      const payOverTimeCard: CreditCardAccount = {
        ...mockCreditCard,
        paymentStrategy: 'pay_over_time',
        monthlyPaymentTarget: 100
      }

      const states = calculatePaymentCategoryStates([payOverTimeCard], mockBudgetItems, '2024-01')
      
      expect(states[0].shouldPayInFull).toBe(false)
      expect(states[0].monthlyTarget).toBe(100)
      expect(states[0].overfunded).toBe(true) // 300 > 100
    })
  })

  describe('validateCreditCardTransaction', () => {
    it('should validate successful transaction', () => {
      const transaction: CreditCardTransaction = {
        id: 'txn_4',
        accountId: 'card_1',
        categoryId: 'groceries',
        amount: 50,
        date: '2024-01-18'
      }

      const result = validateCreditCardTransaction(
        transaction,
        'groceries',
        mockBudgetItems,
        '2024-01'
      )

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should warn when transaction uses most of budget', () => {
      const transaction: CreditCardTransaction = {
        id: 'txn_5',
        accountId: 'card_1',
        categoryId: 'groceries',
        amount: 190, // Uses 95% of available (200)
        date: '2024-01-19'
      }

      const result = validateCreditCardTransaction(
        transaction,
        'groceries',
        mockBudgetItems,
        '2024-01'
      )

      expect(result.isValid).toBe(true)
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('should fail validation for insufficient funds', () => {
      const transaction: CreditCardTransaction = {
        id: 'txn_6',
        accountId: 'card_1',
        categoryId: 'groceries',
        amount: 250, // More than available (200)
        date: '2024-01-20'
      }

      const result = validateCreditCardTransaction(
        transaction,
        'groceries',
        mockBudgetItems,
        '2024-01'
      )

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.suggestedActions.length).toBeGreaterThan(0)
    })
  })
})
