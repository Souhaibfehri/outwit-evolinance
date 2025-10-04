import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { 
  InvestmentAccount, 
  InvestmentAccountWithDetails, 
  InvestmentKPIs, 
  CreateInvestmentAccountRequest,
  calculateInvestmentMetrics,
  calculateSIP
} from '@/lib/types/investments'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeKpis = searchParams.get('kpis') === 'true'
    const includeDetails = searchParams.get('details') === 'true'

    const metadata = user.user_metadata || {}
    const accounts: InvestmentAccount[] = metadata.investment_accounts || []
    const plans = metadata.investment_plans || []
    const contributions = metadata.investment_contributions || []
    const snapshots = metadata.holding_snapshots || []

    // Build accounts with details if requested
    const accountsWithDetails: InvestmentAccountWithDetails[] = accounts.map(account => {
      const accountPlans = plans.filter((p: any) => p.accountId === account.id)
      const accountContributions = contributions.filter((c: any) => c.accountId === account.id)
      const accountSnapshots = snapshots.filter((s: any) => s.accountId === account.id)
      
      const metrics = calculateInvestmentMetrics(accountContributions, accountSnapshots)
      
      // Calculate projection if there are active plans
      const activePlans = accountPlans.filter((p: any) => p.active)
      const monthlyContribution = activePlans.reduce((sum: number, p: any) => {
        const frequency = getAnnualFrequency(p.cadence, p.everyNWeeks)
        return sum + (p.amount * frequency / 12)
      }, 0)
      
      const avgAPR = activePlans.length > 0 
        ? activePlans.reduce((sum: number, p: any) => sum + (p.aprAssumption || 7), 0) / activePlans.length
        : 7

      const projectedValue = monthlyContribution > 0 
        ? calculateSIP(monthlyContribution, avgAPR, 5)
        : undefined

      return {
        ...account,
        plans: includeDetails ? accountPlans : [],
        contributions: includeDetails ? accountContributions : [],
        snapshots: includeDetails ? accountSnapshots : [],
        totalContributed: metrics.totalContributed,
        monthlyContributions: metrics.monthlyAverage,
        ytdContributions: metrics.ytdContributions,
        projectedValue: projectedValue ? {
          futureValue: projectedValue.futureValue,
          totalContributions: projectedValue.totalContributions,
          totalGrowth: projectedValue.totalGrowth,
          years: 5,
          monthlyContribution,
          aprAssumption: avgAPR,
          compoundingPeriods: 12
        } : undefined
      }
    })

    const response: any = { accounts: accountsWithDetails }

    // Include KPIs if requested
    if (includeKpis) {
      const kpis = calculateInvestmentKPIs(accountsWithDetails)
      response.kpis = kpis
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching investment accounts:', error)
    return NextResponse.json({ error: 'Failed to fetch investment accounts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const accountData: CreateInvestmentAccountRequest = await request.json()
    const metadata = user.user_metadata || {}
    const existingAccounts = metadata.investment_accounts || []

    // Validate required fields
    if (!accountData.name?.trim()) {
      return NextResponse.json({ error: 'Account name is required' }, { status: 400 })
    }

    // Create new investment account
    const newAccount: InvestmentAccount = {
      id: `invest_account_${Date.now()}`,
      userId: user.id,
      name: accountData.name.trim(),
      type: accountData.type,
      currency: accountData.currency || 'USD',
      trackHoldings: accountData.trackHoldings ?? false,
      currentValue: accountData.currentValue,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const updatedAccounts = [...existingAccounts, newAccount]

    // Create initial value snapshot if provided
    let updatedSnapshots = metadata.holding_snapshots || []
    if (newAccount.trackHoldings && accountData.currentValue && accountData.currentValue > 0) {
      const initialSnapshot = {
        id: `snapshot_${Date.now()}`,
        accountId: newAccount.id,
        userId: user.id,
        asOf: new Date().toISOString().split('T')[0],
        value: accountData.currentValue,
        currency: newAccount.currency,
        createdAt: new Date().toISOString()
      }
      updatedSnapshots = [...updatedSnapshots, initialSnapshot]
    }

    // Save to user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...metadata,
        investment_accounts: updatedAccounts,
        holding_snapshots: updatedSnapshots
      }
    })

    if (updateError) {
      console.error('Failed to create investment account:', updateError)
      return NextResponse.json({ error: 'Failed to create investment account' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      account: newAccount,
      message: `Investment account "${newAccount.name}" created successfully!`
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating investment account:', error)
    return NextResponse.json({ error: 'Failed to create investment account' }, { status: 500 })
  }
}

/**
 * Calculate comprehensive investment KPIs
 */
function calculateInvestmentKPIs(accounts: InvestmentAccountWithDetails[]): InvestmentKPIs {
  const currentDate = new Date()
  const currentMonth = currentDate.toISOString().substring(0, 7)
  const currentYear = currentDate.getFullYear()

  // Aggregate metrics across all accounts
  const totalContributed = accounts.reduce((sum, account) => sum + account.totalContributed, 0)
  const totalCurrentValue = accounts.reduce((sum, account) => sum + (account.currentValue || account.totalContributed), 0)
  
  // This month contributions
  const contributedThisMonth = accounts.reduce((sum, account) => {
    return sum + account.contributions
      .filter((c: any) => c.date.startsWith(currentMonth))
      .reduce((contribSum: number, c: any) => contribSum + c.amount, 0)
  }, 0)

  // YTD contributions
  const ytdContributions = accounts.reduce((sum, account) => {
    return sum + account.contributions
      .filter((c: any) => new Date(c.date).getFullYear() === currentYear)
      .reduce((contribSum: number, c: any) => contribSum + c.amount, 0)
  }, 0)

  // Calculate weighted average APR from active plans
  const allPlans = accounts.flatMap(account => account.plans || [])
  const activePlans = allPlans.filter((p: any) => p.active)
  const averageAPR = activePlans.length > 0
    ? activePlans.reduce((sum: number, p: any) => sum + (p.aprAssumption || 7), 0) / activePlans.length
    : 7

  // Calculate 5-year projection based on current monthly contributions
  const currentMonthlyContributions = accounts.reduce((sum, account) => {
    const accountPlans = (account.plans || []).filter((p: any) => p.active)
    return sum + accountPlans.reduce((planSum: number, p: any) => {
      const frequency = getAnnualFrequency(p.cadence, p.everyNWeeks)
      return planSum + (p.amount * frequency / 12)
    }, 0)
  }, 0)

  const projectedFiveYear = currentMonthlyContributions > 0
    ? calculateSIP(currentMonthlyContributions, averageAPR, 5).futureValue + totalCurrentValue
    : totalCurrentValue

  return {
    totalAccounts: accounts.length,
    contributedThisMonth,
    ytdContributions,
    totalContributed,
    totalCurrentValue,
    projectedFiveYear,
    averageAPR
  }
}

function getAnnualFrequency(cadence: any, everyNWeeks?: number): number {
  switch (cadence) {
    case 'MONTHLY': return 12
    case 'SEMI_MONTHLY': return 24
    case 'BIWEEKLY': return 26
    case 'WEEKLY': return 52
    case 'CUSTOM': return everyNWeeks ? Math.floor(52 / everyNWeeks) : 26
    default: return 12
  }
}
