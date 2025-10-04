// lib/debt.ts - Debt payoff calculation engine

export interface Debt {
  id: string
  name: string
  balance: number // in cents
  interest: number // APR as percentage (e.g., 4.5)
  minPayment: number // in cents
}

export interface PayoffScheduleEntry {
  month: number
  date: Date
  debtId: string
  debtName: string
  startingBalance: number
  payment: number
  interest: number
  principal: number
  endingBalance: number
}

export interface PayoffSummary {
  strategy: 'avalanche' | 'snowball'
  totalMonths: number
  totalInterest: number
  totalPayments: number
  debtFreeDate: Date
  monthlySavings?: number // compared to minimum payments only
  schedule: PayoffScheduleEntry[]
}

/**
 * Calculate debt payoff using either Avalanche (highest interest first) 
 * or Snowball (smallest balance first) strategy
 */
export function calculateDebtPayoff(
  debts: Debt[],
  extraMonthlyPayment: number, // in cents
  strategy: 'avalanche' | 'snowball' = 'avalanche'
): PayoffSummary {
  if (debts.length === 0) {
    return {
      strategy,
      totalMonths: 0,
      totalInterest: 0,
      totalPayments: 0,
      debtFreeDate: new Date(),
      schedule: [],
    }
  }

  // Clone debts to avoid mutation
  let workingDebts = debts.map(debt => ({ ...debt }))
  const schedule: PayoffScheduleEntry[] = []
  let totalInterest = 0
  let totalPayments = 0
  let month = 0
  const startDate = new Date()

  // Calculate total minimum payments
  const totalMinPayments = workingDebts.reduce((sum, debt) => sum + debt.minPayment, 0)
  const totalAvailablePayment = totalMinPayments + extraMonthlyPayment

  // Sort debts based on strategy
  if (strategy === 'avalanche') {
    // Highest interest rate first
    workingDebts.sort((a, b) => b.interest - a.interest)
  } else {
    // Smallest balance first (snowball)
    workingDebts.sort((a, b) => a.balance - b.balance)
  }

  while (workingDebts.some(debt => debt.balance > 0)) {
    month++
    const currentDate = new Date(startDate.getFullYear(), startDate.getMonth() + month, 1)
    
    // Apply interest to all debts
    workingDebts.forEach(debt => {
      if (debt.balance > 0) {
        const monthlyInterestRate = debt.interest / 100 / 12
        const interestCharge = Math.round(debt.balance * monthlyInterestRate)
        debt.balance += interestCharge
      }
    })

    let remainingPayment = totalAvailablePayment

    // Pay minimum payments first
    workingDebts.forEach(debt => {
      if (debt.balance > 0 && remainingPayment > 0) {
        const startingBalance = debt.balance
        const monthlyInterestRate = debt.interest / 100 / 12
        const interestCharge = Math.round(startingBalance * monthlyInterestRate)
        
        // Pay minimum payment or remaining balance, whichever is smaller
        const payment = Math.min(debt.minPayment, debt.balance, remainingPayment)
        const principal = payment - interestCharge
        
        debt.balance = Math.max(0, debt.balance - payment)
        remainingPayment -= payment
        totalInterest += interestCharge
        totalPayments += payment

        if (payment > 0) {
          schedule.push({
            month,
            date: currentDate,
            debtId: debt.id,
            debtName: debt.name,
            startingBalance,
            payment,
            interest: interestCharge,
            principal: Math.max(0, principal),
            endingBalance: debt.balance,
          })
        }
      }
    })

    // Apply extra payment to target debt (first debt with balance > 0 in sorted order)
    if (remainingPayment > 0) {
      const targetDebt = workingDebts.find(debt => debt.balance > 0)
      if (targetDebt) {
        const extraPayment = Math.min(remainingPayment, targetDebt.balance)
        targetDebt.balance -= extraPayment
        totalPayments += extraPayment

        // Add to existing schedule entry or create new one
        const existingEntry = schedule.find(
          entry => entry.month === month && entry.debtId === targetDebt.id
        )
        if (existingEntry) {
          existingEntry.payment += extraPayment
          existingEntry.principal += extraPayment
          existingEntry.endingBalance = targetDebt.balance
        } else {
          schedule.push({
            month,
            date: currentDate,
            debtId: targetDebt.id,
            debtName: targetDebt.name,
            startingBalance: targetDebt.balance + extraPayment,
            payment: extraPayment,
            interest: 0,
            principal: extraPayment,
            endingBalance: targetDebt.balance,
          })
        }
      }
    }

    // Re-sort debts for next iteration (in case balances changed the order)
    if (strategy === 'avalanche') {
      workingDebts.sort((a, b) => b.interest - a.interest)
    } else {
      workingDebts.sort((a, b) => a.balance - b.balance)
    }

    // Safety check to prevent infinite loops
    if (month > 600) { // 50 years max
      break
    }
  }

  const debtFreeDate = new Date(startDate.getFullYear(), startDate.getMonth() + month, 1)

  return {
    strategy,
    totalMonths: month,
    totalInterest,
    totalPayments,
    debtFreeDate,
    schedule,
  }
}

/**
 * Compare Avalanche vs Snowball strategies
 */
export function compareStrategies(
  debts: Debt[],
  extraMonthlyPayment: number
): {
  avalanche: PayoffSummary
  snowball: PayoffSummary
  savings: {
    months: number
    interest: number
    totalPayments: number
  }
} {
  const avalanche = calculateDebtPayoff(debts, extraMonthlyPayment, 'avalanche')
  const snowball = calculateDebtPayoff(debts, extraMonthlyPayment, 'snowball')

  return {
    avalanche,
    snowball,
    savings: {
      months: snowball.totalMonths - avalanche.totalMonths,
      interest: snowball.totalInterest - avalanche.totalInterest,
      totalPayments: snowball.totalPayments - avalanche.totalPayments,
    },
  }
}

/**
 * Calculate minimum payment only scenario for comparison
 */
export function calculateMinimumPaymentScenario(debts: Debt[]): PayoffSummary {
  return calculateDebtPayoff(debts, 0, 'avalanche')
}

/**
 * Format currency for display
 */
export function formatCurrency(cents: number): string {
  return `$${(Math.abs(cents) / 100).toFixed(2)}`
}

/**
 * Format months as years and months
 */
export function formatDuration(months: number): string {
  if (months <= 0) return '0 months'
  
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12

  if (years === 0) {
    return `${months} month${months === 1 ? '' : 's'}`
  }
  
  if (remainingMonths === 0) {
    return `${years} year${years === 1 ? '' : 's'}`
  }
  
  return `${years} year${years === 1 ? '' : 's'} ${remainingMonths} month${remainingMonths === 1 ? '' : 's'}`
}
