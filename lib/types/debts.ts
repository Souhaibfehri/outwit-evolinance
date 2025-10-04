// Debts data model with payoff simulation and education

export interface DebtAccount {
  id: string
  userId: string
  name: string
  type: 'credit_card' | 'loan' | 'line_of_credit' | 'student_loan' | 'other'
  currency: string
  principalBalance: number // current principal
  apr: number // annual percent rate
  minPayment: number // required minimum for current cycle
  statementDay?: number // for credit cards (1–31 or -1 for 'last')
  dueDay?: number // due date in month (1–31 or -1 for 'last')
  termMonths?: number // for amortized loans
  creditLimit?: number // for credit cards
  startDate: string
  timezone: string
  autopayEnabled: boolean
  autopayAccountId?: string
  promo?: {
    rate: number
    endsOn: string
  }
  notes?: string
  createdAt: string
  updatedAt: string
  archivedAt?: string
}

export interface DebtRate {
  id: string
  debtId: string
  apr: number
  startsOn: string
  endsOn?: string
  compounding: 'daily' | 'monthly'
}

export interface DebtPayment {
  id: string
  debtId: string
  transactionId: string
  paidAt: string
  amount: number
  allocation: {
    interest: number
    principal: number
    fees: number
  }
  fxRateUsed?: number
}

export interface DebtKPIs {
  totalDebt: number
  monthlyMinimum: number
  projectedDebtFreeDate?: string
  averageAPR: number
  totalCreditUtilization?: number
  monthsToDebtFree?: number
  totalInterestProjected: number
}

export interface PayoffSimulation {
  method: 'avalanche' | 'snowball' | 'custom'
  extraPerMonth: number
  lumpSum?: {
    amount: number
    date: string
  }
  roundUpToNearest?: number
  keepMinimums: boolean
  results: {
    monthsToDebtFree: number
    totalInterestPaid: number
    interestSaved: number
    monthsSaved: number
    timeline: PayoffStep[]
    milestones: PayoffMilestone[]
  }
}

export interface PayoffStep {
  month: number
  monthName: string
  debts: Array<{
    debtId: string
    debtName: string
    startingBalance: number
    payment: number
    interestPortion: number
    principalPortion: number
    endingBalance: number
    paidOff: boolean
  }>
  totalPayment: number
  totalInterest: number
  totalPrincipal: number
  remainingDebt: number
}

export interface PayoffMilestone {
  month: number
  debtId: string
  debtName: string
  message: string
  celebration: boolean
}

export interface DebtListItem {
  id: string
  name: string
  type: string
  balance: number
  apr: number
  minPayment: number
  nextDueDate?: string
  status: 'current' | 'overdue' | 'autopay'
  utilization?: number // for credit cards
  promoRate?: {
    rate: number
    endsOn: string
    daysRemaining: number
  }
  autopayEnabled: boolean
  canPay: boolean
}

export interface MakePaymentRequest {
  debtId: string
  amount: number
  date: string
  accountId: string
  assignToMonth: 'current' | 'next'
  note?: string
}

// Teaching content
export interface DebtMethod {
  id: 'avalanche' | 'snowball'
  name: string
  description: string
  pros: string[]
  cons: string[]
  bestFor: string
  example: {
    scenario: string
    result: string
  }
}

export const DEBT_METHODS: Record<string, DebtMethod> = {
  avalanche: {
    id: 'avalanche',
    name: 'Debt Avalanche',
    description: 'Pay minimums on all debts, then attack the highest interest rate first',
    pros: [
      'Saves the most money in interest',
      'Mathematically optimal',
      'Faster overall payoff'
    ],
    cons: [
      'May take longer to see individual debts disappear',
      'Requires discipline and patience'
    ],
    bestFor: 'People who are motivated by saving money and can stay disciplined',
    example: {
      scenario: 'Credit Card 22% APR vs Auto Loan 5% APR',
      result: 'Focus extra payments on credit card first, save hundreds in interest'
    }
  },
  snowball: {
    id: 'snowball',
    name: 'Debt Snowball',
    description: 'Pay minimums on all debts, then attack the smallest balance first',
    pros: [
      'Quick psychological wins',
      'Builds momentum and motivation',
      'Simplifies your debt list faster'
    ],
    cons: [
      'May cost more in interest over time',
      'Not mathematically optimal'
    ],
    bestFor: 'People who need motivation and quick wins to stay on track',
    example: {
      scenario: '$500 store card vs $15,000 auto loan',
      result: 'Pay off store card first for immediate victory, then tackle auto loan'
    }
  }
}

// Status helpers
export function getDebtStatus(debt: DebtAccount, currentDate: Date = new Date()): DebtListItem['status'] {
  if (debt.autopayEnabled) return 'autopay'
  
  if (debt.dueDay) {
    const dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), debt.dueDay)
    if (currentDate > dueDate) return 'overdue'
  }
  
  return 'current'
}

export function calculateUtilization(balance: number, creditLimit?: number): number | undefined {
  if (!creditLimit || creditLimit <= 0) return undefined
  return Math.min(100, (balance / creditLimit) * 100)
}

export function getPromoInfo(debt: DebtAccount, currentDate: Date = new Date()): DebtListItem['promoRate'] | undefined {
  if (!debt.promo) return undefined
  
  const endDate = new Date(debt.promo.endsOn)
  const daysRemaining = Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysRemaining <= 0) return undefined
  
  return {
    rate: debt.promo.rate,
    endsOn: debt.promo.endsOn,
    daysRemaining
  }
}
