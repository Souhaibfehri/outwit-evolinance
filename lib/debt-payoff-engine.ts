// Debt payoff engine with accurate accrual and amortization

import { DebtAccount, PayoffSimulation, PayoffStep, PayoffMilestone } from '@/lib/types/debts'

export interface PayoffOptions {
  method: 'avalanche' | 'snowball' | 'custom'
  extraPerMonth: number
  lumpSum?: {
    amount: number
    date: string
  }
  roundUpToNearest?: number
  keepMinimums: boolean
  customOrder?: string[] // debt IDs in custom order
}

/**
 * Calculate complete payoff schedule
 */
export function computePayoffSchedule(
  debts: DebtAccount[],
  options: PayoffOptions,
  startDate: Date = new Date()
): PayoffSimulation {
  // Sort debts by chosen method
  const sortedDebts = sortDebtsByMethod(debts, options.method, options.customOrder)
  
  // Initialize debt balances
  let workingDebts = sortedDebts.map(debt => ({
    ...debt,
    currentBalance: debt.principalBalance,
    paidOff: false
  }))

  const timeline: PayoffStep[] = []
  const milestones: PayoffMilestone[] = []
  let month = 0
  let totalInterestPaid = 0
  let currentDate = new Date(startDate)

  // Calculate baseline (minimum payments only) for comparison
  const baselineResults = calculateBaseline(debts)

  while (workingDebts.some(debt => !debt.paidOff) && month < 600) { // Safety limit
    month++
    currentDate.setMonth(currentDate.getMonth() + 1)
    
    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    let availableExtra = options.extraPerMonth

    // Apply lump sum if this is the month
    if (options.lumpSum && 
        currentDate.toISOString().substring(0, 7) === options.lumpSum.date.substring(0, 7)) {
      availableExtra += options.lumpSum.amount
    }

    const monthDebts: PayoffStep['debts'] = []
    let monthTotalPayment = 0
    let monthTotalInterest = 0
    let monthTotalPrincipal = 0

    // Process each debt
    workingDebts.forEach(debt => {
      if (debt.paidOff) {
        monthDebts.push({
          debtId: debt.id,
          debtName: debt.name,
          startingBalance: 0,
          payment: 0,
          interestPortion: 0,
          principalPortion: 0,
          endingBalance: 0,
          paidOff: true
        })
        return
      }

      const startingBalance = debt.currentBalance
      
      // Calculate interest for this month
      const monthlyInterestRate = (debt.apr / 100) / 12
      const interestCharge = startingBalance * monthlyInterestRate
      
      // Determine payment amount
      let paymentAmount = debt.minPayment
      
      // Add extra payment if this is the target debt
      if (availableExtra > 0 && isTargetDebt(debt, workingDebts, options.method)) {
        const extraPayment = Math.min(availableExtra, startingBalance + interestCharge - debt.minPayment)
        paymentAmount += extraPayment
        availableExtra -= extraPayment
      }

      // Apply rounding if enabled
      if (options.roundUpToNearest && options.roundUpToNearest > 0) {
        paymentAmount = Math.ceil(paymentAmount / options.roundUpToNearest) * options.roundUpToNearest
      }

      // Ensure we don't overpay
      paymentAmount = Math.min(paymentAmount, startingBalance + interestCharge)

      // Allocate payment: interest first, then principal
      const interestPortion = Math.min(interestCharge, paymentAmount)
      const principalPortion = paymentAmount - interestPortion
      const endingBalance = Math.max(0, startingBalance - principalPortion)

      // Check if debt is paid off
      const paidOff = endingBalance <= 0.01

      if (paidOff && !debt.paidOff) {
        milestones.push({
          month,
          debtId: debt.id,
          debtName: debt.name,
          message: `🎉 ${debt.name} is paid off!`,
          celebration: true
        })
        debt.paidOff = true
      }

      monthDebts.push({
        debtId: debt.id,
        debtName: debt.name,
        startingBalance,
        payment: paymentAmount,
        interestPortion,
        principalPortion,
        endingBalance,
        paidOff
      })

      // Update working debt
      debt.currentBalance = endingBalance
      monthTotalPayment += paymentAmount
      monthTotalInterest += interestPortion
      monthTotalPrincipal += principalPortion
      totalInterestPaid += interestPortion
    })

    timeline.push({
      month,
      monthName,
      debts: monthDebts,
      totalPayment: monthTotalPayment,
      totalInterest: monthTotalInterest,
      totalPrincipal: monthTotalPrincipal,
      remainingDebt: workingDebts.reduce((sum, debt) => sum + debt.currentBalance, 0)
    })

    // Break if all debts are paid off
    if (workingDebts.every(debt => debt.paidOff)) {
      break
    }
  }

  // Calculate savings vs baseline
  const interestSaved = baselineResults.totalInterest - totalInterestPaid
  const monthsSaved = baselineResults.months - month

  return {
    method: options.method,
    extraPerMonth: options.extraPerMonth,
    lumpSum: options.lumpSum,
    roundUpToNearest: options.roundUpToNearest,
    keepMinimums: options.keepMinimums,
    results: {
      monthsToDebtFree: month,
      totalInterestPaid,
      interestSaved: Math.max(0, interestSaved),
      monthsSaved: Math.max(0, monthsSaved),
      timeline,
      milestones
    }
  }
}

/**
 * Sort debts by payoff method
 */
function sortDebtsByMethod(
  debts: DebtAccount[], 
  method: PayoffOptions['method'],
  customOrder?: string[]
): DebtAccount[] {
  switch (method) {
    case 'avalanche':
      return [...debts].sort((a, b) => b.apr - a.apr) // Highest APR first
    
    case 'snowball':
      return [...debts].sort((a, b) => a.principalBalance - b.principalBalance) // Smallest balance first
    
    case 'custom':
      if (customOrder) {
        return customOrder
          .map(id => debts.find(debt => debt.id === id))
          .filter(Boolean) as DebtAccount[]
      }
      return debts
    
    default:
      return debts
  }
}

/**
 * Determine if this debt should receive extra payments
 */
function isTargetDebt(
  debt: any,
  workingDebts: any[],
  method: PayoffOptions['method']
): boolean {
  const activeDebts = workingDebts.filter(d => !d.paidOff && d.currentBalance > 0)
  if (activeDebts.length === 0) return false

  switch (method) {
    case 'avalanche':
      const highestAPR = Math.max(...activeDebts.map(d => d.apr))
      return debt.apr === highestAPR && debt.currentBalance > 0
    
    case 'snowball':
      const smallestBalance = Math.min(...activeDebts.map(d => d.currentBalance))
      return debt.currentBalance === smallestBalance
    
    case 'custom':
      // First non-paid-off debt in custom order gets extra
      return debt.id === activeDebts[0]?.id
    
    default:
      return false
  }
}

/**
 * Calculate baseline scenario (minimum payments only)
 */
function calculateBaseline(debts: DebtAccount[]): { months: number; totalInterest: number } {
  const workingDebts = debts.map(debt => ({
    ...debt,
    currentBalance: debt.principalBalance
  }))

  let month = 0
  let totalInterest = 0

  while (workingDebts.some(debt => debt.currentBalance > 0) && month < 600) {
    month++

    workingDebts.forEach(debt => {
      if (debt.currentBalance <= 0) return

      const monthlyRate = (debt.apr / 100) / 12
      const interestCharge = debt.currentBalance * monthlyRate
      const principalPayment = Math.max(0, debt.minPayment - interestCharge)
      
      debt.currentBalance = Math.max(0, debt.currentBalance - principalPayment)
      totalInterest += interestCharge
    })
  }

  return { months: month, totalInterest }
}

/**
 * Calculate debt payment allocation (interest vs principal)
 */
export function calculatePaymentAllocation(
  debt: DebtAccount,
  paymentAmount: number,
  compounding: 'daily' | 'monthly' = 'monthly'
): { interest: number; principal: number; fees: number } {
  const balance = debt.principalBalance
  
  // Calculate interest based on compounding
  let interestCharge: number
  if (compounding === 'daily') {
    const dailyRate = (debt.apr / 100) / 365
    const daysInMonth = 30 // Simplified
    interestCharge = balance * dailyRate * daysInMonth
  } else {
    const monthlyRate = (debt.apr / 100) / 12
    interestCharge = balance * monthlyRate
  }

  // Fees (simplified - could be more complex)
  const fees = 0

  // Allocation: fees first, then interest, then principal
  const feesAllocation = Math.min(paymentAmount, fees)
  const remainingAfterFees = paymentAmount - feesAllocation
  
  const interestAllocation = Math.min(remainingAfterFees, interestCharge)
  const principalAllocation = remainingAfterFees - interestAllocation

  return {
    interest: interestAllocation,
    principal: principalAllocation,
    fees: feesAllocation
  }
}

/**
 * Calculate credit utilization
 */
export function calculateCreditUtilization(debts: DebtAccount[]): number {
  const creditCards = debts.filter(debt => 
    debt.type === 'credit_card' && debt.creditLimit && debt.creditLimit > 0
  )

  if (creditCards.length === 0) return 0

  const totalBalance = creditCards.reduce((sum, card) => sum + card.principalBalance, 0)
  const totalLimit = creditCards.reduce((sum, card) => sum + (card.creditLimit || 0), 0)

  return totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0
}

/**
 * Generate educational examples with user's actual data
 */
export function generateDebtExamples(debts: DebtAccount[]): {
  avalanche: string
  snowball: string
  comparison: string
} {
  if (debts.length === 0) {
    return {
      avalanche: 'Add your debts to see personalized examples',
      snowball: 'Add your debts to see personalized examples',
      comparison: 'Add your debts to see savings comparison'
    }
  }

  const sortedByAPR = [...debts].sort((a, b) => b.apr - a.apr)
  const sortedByBalance = [...debts].sort((a, b) => a.principalBalance - b.principalBalance)

  const highestAPR = sortedByAPR[0]
  const smallestBalance = sortedByBalance[0]

  const avalanche = `With your debts, Avalanche targets ${highestAPR.name} first (${highestAPR.apr}% APR)`
  const snowball = `Snowball targets ${smallestBalance.name} first ($${smallestBalance.principalBalance.toLocaleString()} balance)`

  // Quick simulation for comparison
  const avalancheResults = computePayoffSchedule(debts, { method: 'avalanche', extraPerMonth: 100, keepMinimums: true })
  const snowballResults = computePayoffSchedule(debts, { method: 'snowball', extraPerMonth: 100, keepMinimums: true })

  const comparison = `Adding $100/month extra: Avalanche saves $${Math.abs(avalancheResults.results.interestSaved - snowballResults.results.interestSaved).toFixed(0)} vs Snowball`

  return { avalanche, snowball, comparison }
}
