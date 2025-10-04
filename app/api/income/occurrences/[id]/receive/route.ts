import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { ReceiveIncomeRequest } from '@/lib/types/income'
import { createIncomeTransaction, getBudgetMonthAssignment } from '@/lib/budget-rta-integration'
import { getCurrentMonth } from '@/lib/types/budget-v2'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const occurrenceId = params.id
    const receiveRequest: ReceiveIncomeRequest = await request.json()
    const metadata = user.user_metadata || {}
    const occurrences = metadata.income_occurrences || []
    const transactions = metadata.transactions_v2 || []

    // Find the occurrence
    const occurrenceIndex = occurrences.findIndex((occ: any) => occ.id === occurrenceId)
    if (occurrenceIndex === -1) {
      return NextResponse.json({ error: 'Income occurrence not found' }, { status: 404 })
    }

    const occurrence = occurrences[occurrenceIndex]
    
    if (occurrence.status === 'RECEIVED') {
      return NextResponse.json({ error: 'Income already received' }, { status: 400 })
    }

    // Determine budget month assignment
    const receiveDate = new Date(receiveRequest.date || occurrence.scheduledAt)
    const budgetAssignment = getBudgetMonthAssignment({
      date: receiveDate,
      eomThresholdDays: 3,
      userChoice: receiveRequest.budgetMonth
    })

    // Create income transaction
    const incomeTransaction = createIncomeTransaction({
      id: occurrence.id,
      sourceId: occurrence.sourceId,
      amount: receiveRequest.amount || occurrence.net,
      date: receiveRequest.date || occurrence.scheduledAt.split('T')[0],
      accountId: receiveRequest.accountId,
      budgetMonth: budgetAssignment.budgetMonth,
      note: receiveRequest.note
    })

    // Update occurrence status
    const updatedOccurrence = {
      ...occurrence,
      status: 'RECEIVED',
      postedAt: new Date().toISOString(),
      net: receiveRequest.amount || occurrence.net,
      txId: incomeTransaction.id,
      budgetMonth: budgetAssignment.budgetMonth
    }

    // Atomic update: save occurrence + transaction together
    const updatedOccurrences = [...occurrences]
    updatedOccurrences[occurrenceIndex] = updatedOccurrence
    
    const updatedTransactions = [...transactions, incomeTransaction]

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...metadata,
        income_occurrences: updatedOccurrences,
        transactions_v2: updatedTransactions
      }
    })

    if (updateError) {
      console.error('Failed to receive income:', updateError)
      return NextResponse.json({ error: 'Failed to receive income' }, { status: 500 })
    }

    // Find source name for response
    const sources = metadata.income_sources || []
    const source = sources.find((s: any) => s.id === occurrence.sourceId)
    const sourceName = source?.name || 'Income Source'

    return NextResponse.json({
      success: true,
      occurrence: updatedOccurrence,
      transaction: incomeTransaction,
      budgetMonth: budgetAssignment.budgetMonth,
      rtaIncrease: incomeTransaction.amount,
      message: `${sourceName} income received! $${Math.abs(incomeTransaction.amount).toLocaleString()} added to ${budgetAssignment.budgetMonth} budget.`
    })

  } catch (error) {
    console.error('Error receiving income:', error)
    return NextResponse.json({ error: 'Failed to receive income' }, { status: 500 })
  }
}
