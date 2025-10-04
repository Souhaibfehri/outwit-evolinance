import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const metadata = user.user_metadata || {}
    
    // Check if onboarding session already exists
    if (metadata.onboarding_session || metadata.onboarding_done) {
      return NextResponse.json({ 
        message: 'Onboarding already initialized or completed',
        status: metadata.onboarding_done ? 'completed' : 'in_progress',
        currentStep: metadata.onboarding_session?.currentStep || 0
      })
    }

    // Create new onboarding session
    const onboardingSession = {
      userId: user.id,
      startedAt: new Date().toISOString(),
      completedAt: null,
      currentStep: 0,
      completed: false,
      stepsDone: [],
      answers: {},
      steps: {
        profile: false,
        income: false,
        bills: false,
        debts: false,
        goals: false,
        investments: false,
        review: false
      }
    }

    // Update user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...metadata,
        onboarding_session: onboardingSession
      }
    })

    if (updateError) {
      console.error('Failed to initialize onboarding:', updateError)
      return NextResponse.json({ error: 'Failed to initialize onboarding' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Onboarding session initialized successfully',
      session: onboardingSession,
      nextStep: '/onboarding/profile'
    })

  } catch (error) {
    console.error('Error initializing onboarding:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
