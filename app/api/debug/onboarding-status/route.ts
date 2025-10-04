import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      return NextResponse.json({ 
        error: 'Authentication error', 
        details: error.message 
      }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 })
    }

    const metadata = user.user_metadata || {}
    const onboardingCompleted = metadata.onboarding_done || metadata.onboarding_session?.completed

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      created: user.created_at,
      onboardingStatus: {
        completed: onboardingCompleted,
        onboarding_done: metadata.onboarding_done,
        onboarding_session_completed: metadata.onboarding_session?.completed,
        onboarding_session: metadata.onboarding_session
      },
      middlewareBehavior: {
        protectedRoutes: onboardingCompleted ? 'ALLOW ACCESS' : 'REDIRECT TO /onboarding',
        loginRedirect: onboardingCompleted ? 'REDIRECT TO /dashboard' : 'REDIRECT TO /onboarding'
      },
      fullMetadata: metadata
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
