import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Goal, UpdateGoalRequest, calculateGoalProgress } from '@/lib/types/goals'

export async function GET(
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
    const metadata = user.user_metadata || {}
    const goals = metadata.goals_v2 || []
    const contributions = metadata.goal_contributions || []

    const goal = goals.find((g: Goal) => g.id === goalId)
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    // Include progress and contributions
    const goalContributions = contributions.filter((c: any) => c.goalId === goalId)
    const progress = calculateGoalProgress(goal, goalContributions)

    return NextResponse.json({ 
      goal: {
        ...goal,
        ...progress,
        contributions: goalContributions
      }
    })

  } catch (error) {
    console.error('Error fetching goal:', error)
    return NextResponse.json({ error: 'Failed to fetch goal' }, { status: 500 })
  }
}

export async function PATCH(
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
    const updateData: UpdateGoalRequest = await request.json()
    const metadata = user.user_metadata || {}
    const goals = metadata.goals_v2 || []
    const contributions = metadata.goal_contributions || []

    const goalIndex = goals.findIndex((g: Goal) => g.id === goalId)
    if (goalIndex === -1) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    const existingGoal = goals[goalIndex]
    const goalContributions = contributions.filter((c: any) => c.goalId === goalId)
    const currentSaved = goalContributions.reduce((sum: number, c: any) => sum + c.amount, 0)

    // Check if target amount is being lowered below current saved amount
    let surplusHandling = null
    if (updateData.targetAmount !== undefined && updateData.targetAmount < currentSaved) {
      const surplus = currentSaved - updateData.targetAmount
      surplusHandling = {
        surplus,
        message: `Target amount is lower than current saved amount ($${currentSaved.toLocaleString()}). Surplus of $${surplus.toLocaleString()} will be returned to Ready-to-Assign.`
      }
    }

    // Validate updates
    if (updateData.priority !== undefined && (updateData.priority < 1 || updateData.priority > 5)) {
      return NextResponse.json({ 
        error: 'Priority must be between 1 and 5' 
      }, { status: 400 })
    }

    if (updateData.targetAmount !== undefined && updateData.targetAmount <= 0) {
      return NextResponse.json({ 
        error: 'Target amount must be positive' 
      }, { status: 400 })
    }

    // Update goal
    const updatedGoal: Goal = {
      ...existingGoal,
      ...updateData,
      id: goalId, // Prevent ID changes
      userId: user.id, // Prevent user ID changes
      updatedAt: new Date().toISOString()
    }

    const updatedGoals = [...goals]
    updatedGoals[goalIndex] = updatedGoal

    // Handle surplus if target was lowered
    let updatedContributions = contributions
    let surplusTransaction = null

    if (surplusHandling && updateData.targetAmount !== undefined) {
      // Create a reversing contribution to return surplus to RTA
      const reversalContribution = {
        id: `contrib_reversal_${Date.now()}`,
        goalId: goalId,
        userId: user.id,
        date: new Date().toISOString().split('T')[0],
        amount: -surplusHandling.surplus,
        source: 'RTA',
        note: `Surplus returned due to target reduction from $${existingGoal.targetAmount} to $${updateData.targetAmount}`,
        createdAt: new Date().toISOString()
      }

      updatedContributions = [...contributions, reversalContribution]

      // Create corresponding transaction to increase RTA
      surplusTransaction = {
        id: `txn_surplus_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        account_id: 'budget_account',
        payee: 'Goal Surplus Return',
        memo: `Returned surplus from ${updatedGoal.name}`,
        amount: surplusHandling.surplus,
        type: 'inflow',
        category_id: null, // Increases RTA
        inflow_to_budget: true
      }
    }

    // Prepare metadata update
    const metadataUpdate: any = {
      ...metadata,
      goals_v2: updatedGoals,
      goal_contributions: updatedContributions
    }

    // Add surplus transaction to transactions if applicable
    if (surplusTransaction) {
      const existingTransactions = metadata.transactions_v2 || []
      metadataUpdate.transactions_v2 = [...existingTransactions, surplusTransaction]
    }

    // Save to user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: metadataUpdate
    })

    if (updateError) {
      console.error('Failed to update goal:', updateError)
      return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 })
    }

    let message = `Goal "${updatedGoal.name}" updated successfully!`
    if (surplusHandling) {
      message += ` Surplus of $${surplusHandling.surplus.toLocaleString()} returned to Ready-to-Assign.`
    }

    return NextResponse.json({ 
      success: true, 
      goal: updatedGoal,
      surplusHandling,
      message
    })

  } catch (error) {
    console.error('Error updating goal:', error)
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 })
  }
}

export async function DELETE(
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
    const metadata = user.user_metadata || {}
    const goals = metadata.goals_v2 || []
    const contributions = metadata.goal_contributions || []

    const goalIndex = goals.findIndex((g: Goal) => g.id === goalId)
    if (goalIndex === -1) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const archive = searchParams.get('archive') === 'true'

    // Check if goal has contributions
    const goalContributions = contributions.filter((c: any) => c.goalId === goalId)
    const hasContributions = goalContributions.length > 0

    if (!archive && hasContributions) {
      return NextResponse.json({ 
        error: 'Cannot delete goal with contributions. Use archive instead.',
        hasContributions: true,
        contributionCount: goalContributions.length
      }, { status: 400 })
    }

    let updatedGoals: Goal[]
    let message: string

    if (archive) {
      // Archive instead of delete
      const archivedGoal = {
        ...goals[goalIndex],
        status: 'ARCHIVED' as const,
        updatedAt: new Date().toISOString()
      }
      updatedGoals = [...goals]
      updatedGoals[goalIndex] = archivedGoal
      message = `Goal "${archivedGoal.name}" archived successfully`
    } else {
      // Permanently delete (only if no contributions)
      updatedGoals = goals.filter((g: Goal) => g.id !== goalId)
      message = `Goal "${goals[goalIndex].name}" deleted successfully`
    }

    // Save to user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...metadata,
        goals_v2: updatedGoals
      }
    })

    if (updateError) {
      console.error('Failed to delete/archive goal:', updateError)
      return NextResponse.json({ error: 'Failed to delete/archive goal' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      archived: archive,
      message
    })

  } catch (error) {
    console.error('Error deleting goal:', error)
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 })
  }
}
