import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { 
  Goal, 
  GoalContribution, 
  ContributeToGoalRequest,
  calculateGoalProgress,
  shouldTriggerMilestone
} from '@/lib/types/goals'
import { getCurrentMonth, getNextMonth } from '@/lib/types/budget-v2'

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

    const goalId = params.id
    const contributionRequest: ContributeToGoalRequest = await request.json()
    const metadata = user.user_metadata || {}
    const goals = metadata.goals_v2 || []
    const contributions = metadata.goal_contributions || []
    const transactions = metadata.transactions_v2 || []

    // Find the goal
    const goal = goals.find((g: Goal) => g.id === goalId)
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    if (goal.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Cannot contribute to inactive goal' }, { status: 400 })
    }

    // Validate contribution
    if (!contributionRequest.amount || contributionRequest.amount <= 0) {
      return NextResponse.json({ error: 'Contribution amount must be positive' }, { status: 400 })
    }

    // Calculate current progress for milestone detection
    const existingContributions = contributions.filter((c: any) => c.goalId === goalId)
    const currentProgress = calculateGoalProgress(goal, existingContributions)

    // Determine budget month
    const budgetMonth = contributionRequest.assignToMonth === 'next' 
      ? getNextMonth(getCurrentMonth())
      : getCurrentMonth()

    const contributionDate = contributionRequest.date || new Date().toISOString().split('T')[0]

    // Create contribution record
    const newContribution: GoalContribution = {
      id: `contrib_${Date.now()}`,
      goalId: goalId,
      userId: user.id,
      date: contributionDate,
      amount: contributionRequest.amount,
      source: contributionRequest.source,
      accountId: contributionRequest.accountId,
      note: contributionRequest.note,
      createdAt: new Date().toISOString()
    }

    // Create appropriate transaction(s) based on source
    const newTransactions = []
    let transactionId: string | undefined

    switch (contributionRequest.source) {
      case 'RTA':
        // Create expense transaction that reduces RTA
        transactionId = `txn_goal_rta_${Date.now()}`
        newTransactions.push({
          id: transactionId,
          date: contributionDate,
          account_id: 'budget_account',
          payee: `Goal: ${goal.name}`,
          memo: contributionRequest.note || `Contribution to ${goal.name}`,
          amount: -Math.abs(contributionRequest.amount),
          type: 'outflow',
          category_id: goal.categoryId || 'goal_funding',
          inflow_to_budget: false,
          goal_id: goalId
        })
        break

      case 'TRANSFER':
        // Create transfer from account (no expense to budget)
        if (!contributionRequest.accountId) {
          return NextResponse.json({ error: 'Account ID required for transfers' }, { status: 400 })
        }
        
        const transferId = `transfer_goal_${Date.now()}`
        transactionId = transferId
        
        newTransactions.push(
          // Outflow from source account
          {
            id: `${transferId}_out`,
            date: contributionDate,
            account_id: contributionRequest.accountId,
            payee: `Goal: ${goal.name}`,
            memo: contributionRequest.note || `Transfer to ${goal.name}`,
            amount: -Math.abs(contributionRequest.amount),
            type: 'outflow',
            category_id: null,
            inflow_to_budget: false,
            related_txn_id: `${transferId}_in`,
            goal_id: goalId
          },
          // Inflow to goal tracking account
          {
            id: `${transferId}_in`,
            date: contributionDate,
            account_id: 'goal_vault',
            payee: `From ${contributionRequest.accountId}`,
            memo: contributionRequest.note || `Goal contribution`,
            amount: Math.abs(contributionRequest.amount),
            type: 'inflow',
            category_id: null,
            inflow_to_budget: false,
            related_txn_id: `${transferId}_out`,
            goal_id: goalId
          }
        )
        break

      case 'ONE_OFF':
        // Create income then immediate allocation
        const incomeId = `txn_goal_income_${Date.now()}`
        transactionId = incomeId
        
        newTransactions.push(
          // Income transaction
          {
            id: `${incomeId}_income`,
            date: contributionDate,
            account_id: contributionRequest.accountId || 'budget_account',
            payee: 'One-off Income',
            memo: `Income for ${goal.name}`,
            amount: Math.abs(contributionRequest.amount),
            type: 'inflow',
            category_id: null,
            inflow_to_budget: true,
            related_txn_id: `${incomeId}_allocation`
          },
          // Immediate allocation to goal
          {
            id: `${incomeId}_allocation`,
            date: contributionDate,
            account_id: 'budget_account',
            payee: `Goal: ${goal.name}`,
            memo: contributionRequest.note || `Allocated to ${goal.name}`,
            amount: -Math.abs(contributionRequest.amount),
            type: 'outflow',
            category_id: goal.categoryId || 'goal_funding',
            inflow_to_budget: false,
            related_txn_id: `${incomeId}_income`,
            goal_id: goalId
          }
        )
        break

      case 'ROUND_UP':
      case 'QUICK_CATCH_UP':
        // Similar to RTA but with different categorization
        transactionId = `txn_goal_${contributionRequest.source.toLowerCase()}_${Date.now()}`
        newTransactions.push({
          id: transactionId,
          date: contributionDate,
          account_id: 'budget_account',
          payee: `Goal: ${goal.name}`,
          memo: contributionRequest.note || `${contributionRequest.source} contribution to ${goal.name}`,
          amount: -Math.abs(contributionRequest.amount),
          type: 'outflow',
          category_id: goal.categoryId || 'goal_funding',
          inflow_to_budget: false,
          goal_id: goalId
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid contribution source' }, { status: 400 })
    }

    // Link transaction to contribution
    if (transactionId) {
      newContribution.transactionId = transactionId
    }

    // Calculate new progress for milestone detection
    const updatedContributions = [...existingContributions, newContribution]
    const newProgress = calculateGoalProgress(goal, updatedContributions)

    // Check for milestone achievements
    const milestones = []
    const milestonePercents = [25, 50, 75, 100]
    
    for (const percent of milestonePercents) {
      if (shouldTriggerMilestone(currentProgress.progressPercent, newProgress.progressPercent, percent)) {
        milestones.push({
          id: `milestone_${Date.now()}_${percent}`,
          goalId: goalId,
          percent: percent,
          reachedAt: new Date().toISOString()
        })
      }
    }

    // Check if goal is completed
    let updatedGoal = goal
    if (newProgress.progressPercent >= 100 && goal.status === 'ACTIVE') {
      updatedGoal = {
        ...goal,
        status: 'COMPLETED' as const,
        updatedAt: new Date().toISOString()
      }
    }

    // Atomic update: save all changes together
    const updatedGoals = goals.map((g: Goal) => g.id === goalId ? updatedGoal : g)
    const updatedContributionsList = [...contributions, newContribution]
    const updatedTransactions = [...transactions, ...newTransactions]
    const updatedMilestones = [...(metadata.goal_milestones || []), ...milestones]

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...metadata,
        goals_v2: updatedGoals,
        goal_contributions: updatedContributionsList,
        transactions_v2: updatedTransactions,
        goal_milestones: updatedMilestones
      }
    })

    if (updateError) {
      console.error('Failed to record contribution:', updateError)
      return NextResponse.json({ error: 'Failed to record contribution' }, { status: 500 })
    }

    // Prepare response
    const isCompleted = newProgress.progressPercent >= 100
    let message = `$${contributionRequest.amount.toLocaleString()} contributed to ${goal.name}! `
    
    if (isCompleted) {
      message += `🎉 Goal completed! You did it!`
    } else {
      message += `You're now ${newProgress.progressPercent.toFixed(1)}% complete!`
    }

    // Add milestone messages
    if (milestones.length > 0) {
      const milestonePercent = Math.max(...milestones.map(m => m.percent))
      message += ` 🏆 ${milestonePercent}% milestone reached!`
    }

    return NextResponse.json({
      success: true,
      contribution: newContribution,
      transactions: newTransactions,
      milestones,
      progress: newProgress,
      goalCompleted: isCompleted,
      message
    })

  } catch (error) {
    console.error('Error recording contribution:', error)
    return NextResponse.json({ error: 'Failed to record contribution' }, { status: 500 })
  }
}
