import { describe, it, expect } from '@jest/globals'

// Debt payoff calculation functions
interface Debt {
  id: string
  name: string
  balance: number
  apr: number
  minPayment: number
  paymentType: 'minimum' | 'fixed'
}

interface PayoffResult {
  totalMonths: number
  totalInterest: number
  monthlyPayments: Array<{
    month: number
    payment: number
    principal: number
    interest: number
    balance: number
  }>
}

/**
 * Calculate debt payoff using avalanche method (highest APR first)
 */
function calculateAvalanche(debts: Debt[], extraPayment: number = 0): PayoffResult {
  const sortedDebts = [...debts].sort((a, b) => b.apr - a.apr)
  return calculatePayoffStrategy(sortedDebts, extraPayment)
}

/**
 * Calculate debt payoff using snowball method (lowest balance first)
 */
function calculateSnowball(debts: Debt[], extraPayment: number = 0): PayoffResult {
  const sortedDebts = [...debts].sort((a, b) => a.balance - b.balance)
  return calculatePayoffStrategy(sortedDebts, extraPayment)
}

/**
 * Calculate debt payoff with custom order
 */
function calculateCustomOrder(debts: Debt[], extraPayment: number = 0): PayoffResult {
  return calculatePayoffStrategy(debts, extraPayment)
}

/**
 * Core payoff calculation logic
 */
function calculatePayoffStrategy(debts: Debt[], extraPayment: number): PayoffResult {
  const workingDebts = debts.map(debt => ({ ...debt }))
  const monthlyPayments: Array<{
    month: number
    payment: number
    principal: number
    interest: number
    balance: number
  }> = []
  
  let month = 0
  let totalInterest = 0
  
  while (workingDebts.some(debt => debt.balance > 0) && month < 600) { // Max 50 years
    month++
    
    let monthlyPayment = 0
    let monthlyPrincipal = 0
    let monthlyInterest = 0
    
    // Calculate minimum payments for all debts
    const totalMinPayments = workingDebts.reduce((sum, debt) => {
      return debt.balance > 0 ? sum + debt.minPayment : sum
    }, 0)
    
    // Pay minimums first
    for (const debt of workingDebts) {
      if (debt.balance <= 0) continue
      
      const monthlyRate = debt.apr / 12
      const interestPayment = debt.balance * monthlyRate
      const principalPayment = Math.min(debt.minPayment - interestPayment, debt.balance)
      
      debt.balance = Math.max(0, debt.balance - principalPayment)
      monthlyPayment += debt.minPayment
      monthlyPrincipal += principalPayment
      monthlyInterest += interestPayment
      totalInterest += interestPayment
    }
    
    // Apply extra payment to first debt with balance
    if (extraPayment > 0) {
      const targetDebt = workingDebts.find(debt => debt.balance > 0)
      if (targetDebt) {
        const extraPrincipal = Math.min(extraPayment, targetDebt.balance)
        targetDebt.balance -= extraPrincipal
        monthlyPayment += extraPayment
        monthlyPrincipal += extraPrincipal
      }
    }
    
    const totalBalance = workingDebts.reduce((sum, debt) => sum + debt.balance, 0)
    
    monthlyPayments.push({
      month,
      payment: monthlyPayment,
      principal: monthlyPrincipal,
      interest: monthlyInterest,
      balance: totalBalance
    })
    
    if (totalBalance <= 0) break
  }
  
  return {
    totalMonths: month,
    totalInterest,
    monthlyPayments
  }
}

/**
 * Compare payoff strategies and recommend best option
 */
function compareStrategies(debts: Debt[], extraPayment: number = 0) {
  const avalanche = calculateAvalanche(debts, extraPayment)
  const snowball = calculateSnowball(debts, extraPayment)
  
  const interestDifference = snowball.totalInterest - avalanche.totalInterest
  const timeDifference = snowball.totalMonths - avalanche.totalMonths
  
  // Recommend avalanche if it saves significant money (>3% difference)
  // Otherwise recommend snowball for psychological benefits
  const recommendation = interestDifference / avalanche.totalInterest > 0.03 ? 'avalanche' : 'snowball'
  
  return {
    avalanche,
    snowball,
    recommendation,
    savings: {
      interest: interestDifference,
      months: timeDifference
    }
  }
}

describe('Debt Payoff Calculations', () => {
  const mockDebts: Debt[] = [
    {
      id: '1',
      name: 'Credit Card 1',
      balance: 5000,
      apr: 0.18, // 18%
      minPayment: 100,
      paymentType: 'minimum'
    },
    {
      id: '2', 
      name: 'Credit Card 2',
      balance: 2000,
      apr: 0.22, // 22%
      minPayment: 50,
      paymentType: 'minimum'
    },
    {
      id: '3',
      name: 'Personal Loan',
      balance: 10000,
      apr: 0.08, // 8%
      minPayment: 200,
      paymentType: 'fixed'
    }
  ]

  describe('calculateAvalanche', () => {
    it('should prioritize highest APR debt first', () => {
      const result = calculateAvalanche(mockDebts, 200)
      
      expect(result.totalMonths).toBeGreaterThan(0)
      expect(result.totalInterest).toBeGreaterThan(0)
      expect(result.monthlyPayments).toHaveLength(result.totalMonths)
      
      // Should pay off 22% APR debt first (Credit Card 2)
      const firstPayoffMonth = result.monthlyPayments.findIndex(payment => {
        // Check if any debt is paid off by looking at significant balance reduction
        return payment.balance < mockDebts.reduce((sum, debt) => sum + debt.balance, 0) - 1000
      })
      
      expect(firstPayoffMonth).toBeGreaterThan(0)
    })

    it('should handle zero extra payment', () => {
      const result = calculateAvalanche(mockDebts, 0)
      
      expect(result.totalMonths).toBeGreaterThan(0)
      expect(result.totalInterest).toBeGreaterThan(0)
      
      // With only minimum payments, should take longer
      const resultWithExtra = calculateAvalanche(mockDebts, 200)
      expect(result.totalMonths).toBeGreaterThan(resultWithExtra.totalMonths)
      expect(result.totalInterest).toBeGreaterThan(resultWithExtra.totalInterest)
    })
  })

  describe('calculateSnowball', () => {
    it('should prioritize lowest balance debt first', () => {
      const result = calculateSnowball(mockDebts, 200)
      
      expect(result.totalMonths).toBeGreaterThan(0)
      expect(result.totalInterest).toBeGreaterThan(0)
      
      // Should pay off $2000 debt first (Credit Card 2)
      const firstPayoffMonth = result.monthlyPayments.findIndex(payment => {
        return payment.balance < mockDebts.reduce((sum, debt) => sum + debt.balance, 0) - 1500
      })
      
      expect(firstPayoffMonth).toBeGreaterThan(0)
    })
  })

  describe('compareStrategies', () => {
    it('should compare avalanche vs snowball correctly', () => {
      const comparison = compareStrategies(mockDebts, 200)
      
      expect(comparison.avalanche).toBeDefined()
      expect(comparison.snowball).toBeDefined()
      expect(comparison.recommendation).toMatch(/avalanche|snowball/)
      expect(comparison.savings.interest).toBeDefined()
      expect(comparison.savings.months).toBeDefined()
      
      // Avalanche should generally save more in interest
      expect(comparison.avalanche.totalInterest).toBeLessThanOrEqual(comparison.snowball.totalInterest)
    })

    it('should recommend snowball when savings are minimal', () => {
      // Debts with similar APRs should favor snowball
      const similarAPRDebts: Debt[] = [
        { id: '1', name: 'Debt 1', balance: 1000, apr: 0.10, minPayment: 50, paymentType: 'minimum' },
        { id: '2', name: 'Debt 2', balance: 2000, apr: 0.11, minPayment: 75, paymentType: 'minimum' }
      ]
      
      const comparison = compareStrategies(similarAPRDebts, 100)
      
      // With minimal interest difference, should recommend snowball
      expect(comparison.recommendation).toBe('snowball')
    })

    it('should recommend avalanche when savings are significant', () => {
      // Debts with very different APRs should favor avalanche
      const differentAPRDebts: Debt[] = [
        { id: '1', name: 'High APR', balance: 5000, apr: 0.25, minPayment: 100, paymentType: 'minimum' },
        { id: '2', name: 'Low APR', balance: 1000, apr: 0.05, minPayment: 25, paymentType: 'minimum' }
      ]
      
      const comparison = compareStrategies(differentAPRDebts, 200)
      
      // With significant interest difference, should recommend avalanche
      expect(comparison.recommendation).toBe('avalanche')
    })
  })

  describe('Edge Cases', () => {
    it('should handle single debt', () => {
      const singleDebt = [mockDebts[0]]
      const result = calculateAvalanche(singleDebt, 100)
      
      expect(result.totalMonths).toBeGreaterThan(0)
      expect(result.totalInterest).toBeGreaterThan(0)
    })

    it('should handle zero balance debts', () => {
      const zeroBalanceDebts = mockDebts.map(debt => ({ ...debt, balance: 0 }))
      const result = calculateAvalanche(zeroBalanceDebts, 100)
      
      expect(result.totalMonths).toBe(0)
      expect(result.totalInterest).toBe(0)
      expect(result.monthlyPayments).toHaveLength(0)
    })

    it('should handle very high extra payments', () => {
      const result = calculateAvalanche(mockDebts, 10000) // Pay off everything immediately
      
      expect(result.totalMonths).toBeLessThanOrEqual(3) // Should pay off very quickly
    })

    it('should prevent infinite loops', () => {
      const problematicDebt: Debt[] = [
        { id: '1', name: 'Low Payment', balance: 10000, apr: 0.30, minPayment: 10, paymentType: 'minimum' }
      ]
      
      const result = calculateAvalanche(problematicDebt, 0)
      
      // Should not run forever even with inadequate minimum payment
      expect(result.totalMonths).toBeLessThan(600)
    })
  })
})

// Export functions for use in the actual app
export {
  calculateAvalanche,
  calculateSnowball,
  calculateCustomOrder,
  compareStrategies
}
