import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { 
  Goal, 
  GoalContribution, 
  GoalWithProgress, 
  GoalKPIs, 
  CreateGoalRequest,
  calculateGoalProgress
} from '@/lib/types/goals'
import { getCurrentMonth } from '@/lib/types/budget-v2'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeKpis = searchParams.get('kpis') === 'true'
    const status = searchParams.get('status') // Filter by status

    const metadata = user.user_metadata || {}
    const goals: Goal[] = metadata.goals_v2 || []
    const contributions: GoalContribution[] = metadata.goal_contributions || []

    // Filter goals by status if specified
    let filteredGoals = goals
    if (status && status !== 'ALL') {
      filteredGoals = goals.filter(goal => goal.status === status)
    }

    // Calculate progress for each goal
    const goalsWithProgress: GoalWithProgress[] = filteredGoals.map(goal => {
      const goalContributions = contributions.filter(c => c.goalId === goal.id)
      const progress = calculateGoalProgress(goal, goalContributions)
      
      return {
        ...goal,
        ...progress,
        contributions: goalContributions,
        milestones: [], // Would come from goal_milestones in real DB
        plannedThisMonth: 0 // Would come from goal_plans
      }
    })

    const response: any = { goals: goalsWithProgress }

    // Include KPIs if requested
    if (includeKpis) {
      const kpis = calculateGoalKPIs(goalsWithProgress)
      response.kpis = kpis
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching goals:', error)
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const goalData: CreateGoalRequest = await request.json()
    const metadata = user.user_metadata || {}
    const existingGoals = metadata.goals_v2 || []

    // Validate required fields
    if (!goalData.name || !goalData.targetAmount || goalData.targetAmount <= 0) {
      return NextResponse.json({ 
        error: 'Name and target amount are required, target must be positive' 
      }, { status: 400 })
    }

    if (!goalData.priority || goalData.priority < 1 || goalData.priority > 5) {
      return NextResponse.json({ 
        error: 'Priority must be between 1 and 5' 
      }, { status: 400 })
    }

    // Create new goal
    const newGoal: Goal = {
      id: `goal_${Date.now()}`,
      userId: user.id,
      name: goalData.name.trim(),
      priority: goalData.priority,
      targetAmount: goalData.targetAmount,
      currency: goalData.currency || 'USD',
      targetDate: goalData.targetDate,
      categoryId: goalData.categoryId,
      fundingAccountId: goalData.fundingAccountId,
      notifyEnabled: goalData.notifyEnabled || false,
      notifyRules: goalData.notifyRules || {
        daysBefore: [30, 7],
        offPace: true,
        milestone: [25, 50, 75, 100]
      },
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const updatedGoals = [...existingGoals, newGoal]

    // Create initial monthly plan if provided
    let updatedPlans = metadata.goal_plans || []
    if (goalData.plannedMonthlyAmount && goalData.plannedMonthlyAmount > 0) {
      const currentMonth = getCurrentMonth()
      updatedPlans.push({
        id: `plan_${Date.now()}`,
        goalId: newGoal.id,
        month: currentMonth,
        planned: goalData.plannedMonthlyAmount,
        createdAt: new Date().toISOString()
      })
    }

    // Save to user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...metadata,
        goals_v2: updatedGoals,
        goal_plans: updatedPlans
      }
    })

    if (updateError) {
      console.error('Failed to create goal:', updateError)
      return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      goal: newGoal,
      message: `Goal "${newGoal.name}" created successfully! 🎯`
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating goal:', error)
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
  }
}

/**
 * Calculate comprehensive goal KPIs
 */
function calculateGoalKPIs(goals: GoalWithProgress[]): GoalKPIs {
  const activeGoals = goals.filter(g => g.status === 'ACTIVE')
  const completedGoals = goals.filter(g => g.status === 'COMPLETED')
  
  const totalSaved = goals.reduce((sum, goal) => sum + goal.savedAmount, 0)
  const totalTarget = activeGoals.reduce((sum, goal) => sum + goal.targetAmount, 0)
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0

  // Calculate this month's planned vs contributed
  const currentMonth = getCurrentMonth()
  const thisMonthPlanned = goals.reduce((sum, goal) => sum + (goal.plannedThisMonth || 0), 0)
  
  // This month contributions (would need to filter by date in real implementation)
  const thisMonthContributed = goals.reduce((sum, goal) => {
    return sum + goal.contributions
      .filter(c => c.date.startsWith(currentMonth))
      .reduce((contribSum, c) => contribSum + c.amount, 0)
  }, 0)

  // Find top goal (highest priority active goal with progress)
  const topGoalCandidate = activeGoals
    .filter(g => g.savedAmount > 0)
    .sort((a, b) => {
      // Sort by priority first, then by progress
      if (a.priority !== b.priority) return b.priority - a.priority
      return b.progressPercent - a.progressPercent
    })[0]

  const topGoal = topGoalCandidate ? {
    id: topGoalCandidate.id,
    name: topGoalCandidate.name,
    progress: topGoalCandidate.progressPercent,
    eta: topGoalCandidate.eta
  } : undefined

  return {
    totalGoals: goals.length,
    activeGoals: activeGoals.length,
    completedGoals: completedGoals.length,
    totalSaved,
    totalTarget,
    overallProgress: Math.min(100, overallProgress),
    thisMonthPlanned,
    thisMonthContributed,
    topGoal
  }
}
