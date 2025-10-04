import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { AllocateRTARequest } from '@/lib/types/goals'
import { getCurrentMonth } from '@/lib/types/budget-v2'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const allocationRequest: AllocateRTARequest = await request.json()
    const metadata = user.user_metadata || {}
    const goals = metadata.goals_v2 || []
    const contributions = metadata.goal_contributions || []
    const transactions = metadata.transactions_v2 || []
    const goalPlans = metadata.goal_plans || []

    // Validate total amount
    if (allocationRequest.totalAmount <= 0) {
      return NextResponse.json({ error: 'Total amount must be positive' }, { status: 400 })
    }

    // Calculate allocations based on strategy
    const allocations = calculateAllocations(goals, allocationRequest)
    
    if (Object.keys(allocations).length === 0) {
      return NextResponse.json({ error: 'No goals available for allocation' }, { status: 400 })
    }

    const currentMonth = getCurrentMonth()
    const newPlans = []
    const newContributions = []
    const newTransactions = []

    // Create goal plans and optionally contributions
    for (const [goalId, amount] of Object.entries(allocations)) {
      if (amount <= 0) continue

      const goal = goals.find((g: any) => g.id === goalId)
      if (!goal) continue

      // Create or update goal plan for current month
      const existingPlanIndex = goalPlans.findIndex((p: any) => p.goalId === goalId && p.month === currentMonth)
      
      if (existingPlanIndex >= 0) {
        // Update existing plan
        goalPlans[existingPlanIndex] = {
          ...goalPlans[existingPlanIndex],
          planned: goalPlans[existingPlanIndex].planned + amount
        }
      } else {
        // Create new plan
        newPlans.push({
          id: `plan_${Date.now()}_${goalId}`,
          goalId,
          month: currentMonth,
          planned: amount,
          createdAt: new Date().toISOString()
        })
      }

      // If fundNow is true, create actual contributions
      if (allocationRequest.fundNow) {
        const contributionId = `contrib_rta_${Date.now()}_${goalId}`
        const transactionId = `txn_rta_${Date.now()}_${goalId}`

        // Create contribution
        newContributions.push({
          id: contributionId,
          goalId,
          userId: user.id,
          date: new Date().toISOString().split('T')[0],
          amount,
          source: 'RTA' as const,
          transactionId,
          note: `RTA allocation via ${allocationRequest.strategy.type} strategy`,
          createdAt: new Date().toISOString()
        })

        // Create expense transaction that reduces RTA
        newTransactions.push({
          id: transactionId,
          date: new Date().toISOString().split('T')[0],
          account_id: 'budget_account',
          payee: `Goal: ${goal.name}`,
          memo: `RTA allocation - ${allocationRequest.strategy.type} strategy`,
          amount: -Math.abs(amount),
          type: 'outflow',
          category_id: goal.categoryId || 'goal_funding',
          inflow_to_budget: false,
          goal_id: goalId
        })
      }
    }

    // Atomic update: save all changes together
    const updatedGoalPlans = [...goalPlans, ...newPlans]
    const updatedContributions = [...contributions, ...newContributions]
    const updatedTransactions = [...transactions, ...newTransactions]

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...metadata,
        goal_plans: updatedGoalPlans,
        goal_contributions: updatedContributions,
        transactions_v2: updatedTransactions
      }
    })

    if (updateError) {
      console.error('Failed to allocate RTA to goals:', updateError)
      return NextResponse.json({ error: 'Failed to allocate RTA to goals' }, { status: 500 })
    }

    const message = allocationRequest.fundNow 
      ? `$${allocationRequest.totalAmount.toLocaleString()} allocated and funded to goals using ${allocationRequest.strategy.type} strategy!`
      : `$${allocationRequest.totalAmount.toLocaleString()} planned for goals using ${allocationRequest.strategy.type} strategy!`

    return NextResponse.json({
      success: true,
      allocations,
      plansCreated: newPlans.length,
      contributionsCreated: newContributions.length,
      transactionsCreated: newTransactions.length,
      funded: allocationRequest.fundNow,
      message
    })

  } catch (error) {
    console.error('Error allocating RTA to goals:', error)
    return NextResponse.json({ error: 'Failed to allocate RTA to goals' }, { status: 500 })
  }
}

/**
 * Calculate allocations based on strategy
 */
function calculateAllocations(goals: any[], request: AllocateRTARequest): Record<string, number> {
  const activeGoals = goals.filter(g => g.status === 'ACTIVE')
  
  if (activeGoals.length === 0) {
    return {}
  }

  const allocations: Record<string, number> = {}

  switch (request.strategy.type) {
    case 'priority':
      return allocateByPriority(activeGoals, request.totalAmount)
    
    case 'time_to_target':
      return allocateByTimeToTarget(activeGoals, request.totalAmount)
    
    case 'even_split':
      return allocateEvenly(activeGoals, request.totalAmount)
    
    case 'custom':
      return request.strategy.customAllocations || {}
    
    default:
      return allocateByPriority(activeGoals, request.totalAmount)
  }
}

/**
 * Allocate by priority (higher priority gets more)
 */
function allocateByPriority(goals: any[], totalAmount: number): Record<string, number> {
  const allocations: Record<string, number> = {}
  
  // Calculate priority weights (5 = 5x weight, 1 = 1x weight)
  const totalWeight = goals.reduce((sum, goal) => sum + goal.priority, 0)
  
  if (totalWeight === 0) return {}
  
  goals.forEach(goal => {
    const weight = goal.priority / totalWeight
    allocations[goal.id] = Math.round(totalAmount * weight)
  })
  
  return allocations
}

/**
 * Allocate by time to target (closer deadlines get more)
 */
function allocateByTimeToTarget(goals: any[], totalAmount: number): Record<string, number> {
  const allocations: Record<string, number> = {}
  const today = new Date()
  
  // Filter goals with target dates and calculate urgency
  const goalsWithDates = goals.filter(goal => goal.targetDate)
  const goalsWithoutDates = goals.filter(goal => !goal.targetDate)
  
  if (goalsWithDates.length === 0) {
    // If no target dates, fall back to priority allocation
    return allocateByPriority(goals, totalAmount)
  }
  
  // Calculate urgency scores (closer dates = higher urgency)
  const urgencyScores = goalsWithDates.map(goal => {
    const targetDate = new Date(goal.targetDate)
    const daysUntilTarget = Math.max(1, Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
    const urgency = 1 / daysUntilTarget // Closer dates = higher urgency
    return { goalId: goal.id, urgency }
  })
  
  const totalUrgency = urgencyScores.reduce((sum, score) => sum + score.urgency, 0)
  
  // Allocate 80% based on urgency
  const urgencyAmount = totalAmount * 0.8
  urgencyScores.forEach(score => {
    const weight = score.urgency / totalUrgency
    allocations[score.goalId] = Math.round(urgencyAmount * weight)
  })
  
  // Allocate remaining 20% evenly among goals without dates
  if (goalsWithoutDates.length > 0) {
    const remainingAmount = totalAmount * 0.2
    const evenAmount = Math.round(remainingAmount / goalsWithoutDates.length)
    goalsWithoutDates.forEach(goal => {
      allocations[goal.id] = evenAmount
    })
  }
  
  return allocations
}

/**
 * Allocate evenly among all goals
 */
function allocateEvenly(goals: any[], totalAmount: number): Record<string, number> {
  const allocations: Record<string, number> = {}
  const evenAmount = Math.round(totalAmount / goals.length)
  
  goals.forEach(goal => {
    allocations[goal.id] = evenAmount
  })
  
  return allocations
}
