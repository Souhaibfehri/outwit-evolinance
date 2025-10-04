import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TUTORIAL_STEPS } from '@/lib/foxy/tutorial-steps'

// GET /api/coach/steps - Get all tutorial steps
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return tutorial steps (in production, these could be stored in DB for A/B testing)
    return NextResponse.json({
      steps: TUTORIAL_STEPS,
      totalSteps: TUTORIAL_STEPS.length
    })
  } catch (error) {
    console.error('Error fetching tutorial steps:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tutorial steps' },
      { status: 500 }
    )
  }
}
