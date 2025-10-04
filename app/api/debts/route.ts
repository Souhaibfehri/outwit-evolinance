import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { DebtAccount, DebtKPIs, DebtListItem } from '@/lib/types/debts'
import { 
  getDebtStatus, 
  calculateUtilization, 
  getPromoInfo 
} from '@/lib/types/debts'
import { calculateCreditUtilization } from '@/lib/debt-payoff-engine'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeKpis = searchParams.get('kpis') === 'true'

    const metadata = user.user_metadata || {}
    const debtAccounts: DebtAccount[] = metadata.debt_accounts || []

    // Filter out archived debts
    const activeDebts = debtAccounts.filter(debt => !debt.archivedAt)

    // Convert to list items with computed properties
    const debtList: DebtListItem[] = activeDebts.map(debt => ({
      id: debt.id,
      name: debt.name,
      type: debt.type,
      balance: debt.principalBalance,
      apr: debt.apr,
      minPayment: debt.minPayment,
      nextDueDate: debt.dueDay ? getNextDueDateString(debt, new Date()) : undefined,
      status: getDebtStatus(debt),
      utilization: calculateUtilization(debt.principalBalance, debt.creditLimit),
      promoRate: getPromoInfo(debt),
      autopayEnabled: debt.autopayEnabled,
      canPay: debt.principalBalance > 0
    }))

    const response: any = { debts: debtList }

    // Include KPIs if requested
    if (includeKpis) {
      const kpis = calculateDebtKPIs(activeDebts)
      response.kpis = kpis
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching debts:', error)
    return NextResponse.json({ error: 'Failed to fetch debts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const debtData = await request.json()
    const metadata = user.user_metadata || {}
    const existingDebts = metadata.debt_accounts || []

    // Create new debt
    const newDebt: DebtAccount = {
      id: `debt_${Date.now()}`,
      userId: user.id,
      name: debtData.name,
      type: debtData.type,
      currency: debtData.currency || 'USD',
      principalBalance: debtData.principalBalance,
      apr: debtData.apr,
      minPayment: debtData.minPayment,
      statementDay: debtData.statementDay,
      dueDay: debtData.dueDay,
      termMonths: debtData.termMonths,
      creditLimit: debtData.creditLimit,
      startDate: debtData.startDate || new Date().toISOString(),
      timezone: debtData.timezone || 'UTC',
      autopayEnabled: debtData.autopayEnabled || false,
      autopayAccountId: debtData.autopayAccountId,
      promo: debtData.promo,
      notes: debtData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Validate required fields
    if (!newDebt.name || !newDebt.type || newDebt.principalBalance <= 0 || newDebt.apr < 0 || newDebt.minPayment <= 0) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, type, principalBalance, apr, minPayment' 
      }, { status: 400 })
    }

    const updatedDebts = [...existingDebts, newDebt]

    // Save to user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...metadata,
        debt_accounts: updatedDebts
      }
    })

    if (updateError) {
      console.error('Failed to create debt:', updateError)
      return NextResponse.json({ error: 'Failed to create debt' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      debt: newDebt,
      message: 'Debt account created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating debt:', error)
    return NextResponse.json({ error: 'Failed to create debt' }, { status: 500 })
  }
}

/**
 * Calculate comprehensive debt KPIs
 */
function calculateDebtKPIs(debts: DebtAccount[]): DebtKPIs {
  if (debts.length === 0) {
    return {
      totalDebt: 0,
      monthlyMinimum: 0,
      averageAPR: 0,
      totalInterestProjected: 0
    }
  }

  const totalDebt = debts.reduce((sum, debt) => sum + debt.principalBalance, 0)
  const monthlyMinimum = debts.reduce((sum, debt) => sum + debt.minPayment, 0)
  const weightedAPR = debts.reduce((sum, debt) => sum + (debt.apr * debt.principalBalance), 0) / totalDebt
  const creditUtilization = calculateCreditUtilization(debts)

  // Simple projection: minimum payments only
  let projectedMonths = 0
  let totalInterestProjected = 0

  // Calculate debt-free date using minimum payments
  const workingDebts = debts.map(debt => ({ ...debt, balance: debt.principalBalance }))
  
  while (workingDebts.some(debt => debt.balance > 0) && projectedMonths < 600) {
    projectedMonths++
    
    workingDebts.forEach(debt => {
      if (debt.balance <= 0) return
      
      const monthlyRate = (debt.apr / 100) / 12
      const interestCharge = debt.balance * monthlyRate
      const principalPayment = Math.max(0, debt.minPayment - interestCharge)
      
      debt.balance = Math.max(0, debt.balance - principalPayment)
      totalInterestProjected += interestCharge
    })
  }

  const projectedDebtFreeDate = projectedMonths < 600 
    ? new Date(Date.now() + projectedMonths * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    : undefined

  return {
    totalDebt,
    monthlyMinimum,
    projectedDebtFreeDate,
    averageAPR: weightedAPR,
    totalCreditUtilization: creditUtilization > 0 ? creditUtilization : undefined,
    monthsToDebtFree: projectedMonths < 600 ? projectedMonths : undefined,
    totalInterestProjected
  }
}

/**
 * Get next due date as string
 */
function getNextDueDateString(debt: DebtAccount, currentDate: Date): string | undefined {
  if (!debt.dueDay) return undefined

  let dueDate: Date

  if (debt.dueDay === -1) {
    // Last day of month
    dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  } else {
    // Specific day of month
    dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), debt.dueDay)
    
    // If due date has passed this month, move to next month
    if (dueDate <= currentDate) {
      dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, debt.dueDay)
    }
  }

  return dueDate.toISOString().split('T')[0]
}
