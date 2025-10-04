import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { TUTORIAL_STEPS } from '@/lib/foxy/tutorial-steps'
import { BADGES } from '@/lib/foxy/badges'

const CompleteStepSchema = z.object({
  stepId: z.string(),
  eventPayload: z.record(z.any()).optional()
})

// POST /api/coach/complete-step - Mark tutorial step as complete
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { stepId, eventPayload } = CompleteStepSchema.parse(body)

    // Validate step exists
    const step = TUTORIAL_STEPS.find(s => s.id === stepId)
    if (!step) {
      return NextResponse.json({ error: 'Invalid step ID' }, { status: 400 })
    }

    // Get current coach state
    const coachState = user.user_metadata?.coach_state || {
      completedStepIds: [],
      tutorialProgress: 0,
      unlockedBadges: []
    }

    // Check if step already completed
    if (coachState.completedStepIds.includes(stepId)) {
      return NextResponse.json({ 
        success: true, 
        message: 'Step already completed',
        alreadyCompleted: true 
      })
    }

    // Add step to completed list
    const newCompletedSteps = [...coachState.completedStepIds, stepId]
    const newProgress = Math.floor((newCompletedSteps.length / TUTORIAL_STEPS.length) * 100)
    
    // DISABLED: Auto-badge unlocking for tutorial steps
    // Users should earn badges through meaningful financial actions, not tutorial completion
    const newBadges = [...coachState.unlockedBadges]
    let unlockedBadge = null

    // // Step-specific badges
    // if (step.config?.badge && !newBadges.includes(step.config.badge)) {
    //   newBadges.push(step.config.badge)
    //   unlockedBadge = BADGES.find(b => b.id === step.config.badge)
    // }

    // // Tutorial completion badge
    // if (newProgress >= 100 && !newBadges.includes('trailblazer')) {
    //   newBadges.push('trailblazer')
    //   unlockedBadge = BADGES.find(b => b.id === 'trailblazer')
    // }

    // Update coach state
    const updatedCoachState = {
      ...coachState,
      completedStepIds: newCompletedSteps,
      tutorialProgress: newProgress,
      unlockedBadges: newBadges,
      mode: newProgress >= 100 ? 'coach' : coachState.mode,
      lastActiveAt: new Date().toISOString()
    }

    // Save to user metadata
    await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        coach_state: updatedCoachState
      }
    })

    // Log completion event
    console.log(`Tutorial step completed: ${stepId}`, {
      userId: user.id,
      progress: newProgress,
      badge: unlockedBadge?.id
    })

    return NextResponse.json({
      success: true,
      stepCompleted: stepId,
      newProgress,
      tutorialComplete: newProgress >= 100,
      unlockedBadge,
      coachState: updatedCoachState
    })
  } catch (error) {
    console.error('Error completing tutorial step:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid step data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to complete step' },
      { status: 500 }
    )
  }
}
