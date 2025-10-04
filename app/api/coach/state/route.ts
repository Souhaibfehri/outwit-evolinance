import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const UpdateCoachStateSchema = z.object({
  mode: z.enum(['tutorial', 'coach']).optional(),
  tutorialProgress: z.number().min(0).max(100).optional(),
  completedStepIds: z.array(z.string()).optional(),
  unlockedBadges: z.array(z.string()).optional(),
  streakDays: z.number().min(0).optional(),
  coachEnabled: z.boolean().optional(),
  hintsEnabled: z.boolean().optional(),
  celebrationsEnabled: z.boolean().optional(),
  skipTutorial: z.boolean().optional()
})

// GET /api/coach/state - Get current coach state
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get coach state from user metadata (temporary solution)
    const coachState = user.user_metadata?.coach_state || {
      mode: 'tutorial',
      tutorialProgress: 0,
      completedStepIds: [],
      unlockedBadges: [],
      streakDays: 0,
      coachEnabled: true,
      hintsEnabled: true,
      celebrationsEnabled: true,
      skipTutorial: false
    }

    return NextResponse.json(coachState)
  } catch (error) {
    console.error('Error fetching coach state:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coach state' },
      { status: 500 }
    )
  }
}

// POST /api/coach/state - Update coach state
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = UpdateCoachStateSchema.parse(body)

    // Get current coach state
    const currentCoachState = user.user_metadata?.coach_state || {}
    
    // Merge updates
    const updatedCoachState = {
      ...currentCoachState,
      ...validatedData,
      lastActiveAt: new Date().toISOString()
    }

    // Update user metadata
    const { error } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        coach_state: updatedCoachState
      }
    })

    if (error) {
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      coachState: updatedCoachState 
    })
  } catch (error) {
    console.error('Error updating coach state:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update coach state' },
      { status: 500 }
    )
  }
}
