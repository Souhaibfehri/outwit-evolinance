import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { ContributeToInvestmentRequest } from '@/lib/types/investments'
import { createInvestmentTransaction, getBudgetMonthAssignment } from '@/lib/budget-rta-integration'
import { getCurrentMonth } from '@/lib/types/budget-v2'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const contributionRequest: ContributeToInvestmentRequest = await request.json()
    const metadata = user.user_metadata || {}
    const accounts = metadata.investment_accounts || []
    const contributions = metadata.investment_contributions || []
    const transactions = metadata.transactions_v2 || []

    // Find the investment account
    const account = accounts.find((acc: any) => acc.id === contributionRequest.accountId)
    if (!account) {
      return NextResponse.json({ error: 'Investment account not found' }, { status: 404 })
    }

    // Validate contribution
    if (!contributionRequest.amount || contributionRequest.amount <= 0) {
      return NextResponse.json({ error: 'Contribution amount must be positive' }, { status: 400 })
    }

    // Determine budget month assignment
    const contributionDate = new Date(contributionRequest.date || new Date().toISOString().split('T')[0])
    const budgetAssignment = getBudgetMonthAssignment({
      date: contributionDate,
      eomThresholdDays: 3,
      userChoice: contributionRequest.budgetMonth
    })

    // Create contribution record
    const newContribution = {
      id: `contrib_invest_${Date.now()}`,
      accountId: contributionRequest.accountId,
      userId: user.id,
      date: contributionRequest.date || new Date().toISOString().split('T')[0],
      amount: contributionRequest.amount,
      currency: account.currency || 'USD',
      source: contributionRequest.source,
      budgetMonth: budgetAssignment.budgetMonth,
      note: contributionRequest.note,
      createdAt: new Date().toISOString()
    }

    // Create appropriate transaction(s)
    const newTransactions = createInvestmentTransaction({
      id: newContribution.id,
      accountId: contributionRequest.accountId,
      amount: contributionRequest.amount,
      date: newContribution.date,
      source: contributionRequest.source,
      sourceAccountId: contributionRequest.accountSourceId,
      budgetMonth: budgetAssignment.budgetMonth,
      note: contributionRequest.note
    })

    // Link first transaction to contribution
    if (newTransactions.length > 0) {
      (newContribution as any).txId = newTransactions[0].id
    }

    // Atomic update: save contribution + transaction(s) together
    const updatedContributions = [...contributions, newContribution]
    const updatedTransactions = [...transactions, ...newTransactions]

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...metadata,
        investment_contributions: updatedContributions,
        transactions_v2: updatedTransactions
      }
    })

    if (updateError) {
      console.error('Failed to record investment contribution:', updateError)
      return NextResponse.json({ error: 'Failed to record contribution' }, { status: 500 })
    }

    // Calculate impact message
    let impactMessage = ''
    switch (contributionRequest.source) {
      case 'RTA':
        impactMessage = `Ready-to-Assign reduced by $${contributionRequest.amount.toLocaleString()}`
        break
      case 'TRANSFER':
        impactMessage = `Transferred from ${contributionRequest.accountSourceId || 'account'}`
        break
      case 'ONE_OFF':
        impactMessage = `Income added and immediately allocated to investment`
        break
    }

    return NextResponse.json({
      success: true,
      contribution: newContribution,
      transactions: newTransactions,
      budgetMonth: budgetAssignment.budgetMonth,
      impact: impactMessage,
      message: `$${contributionRequest.amount.toLocaleString()} contributed to ${account.name}! ${impactMessage}.`
    })

  } catch (error) {
    console.error('Error recording investment contribution:', error)
    return NextResponse.json({ error: 'Failed to record contribution' }, { status: 500 })
  }
}
