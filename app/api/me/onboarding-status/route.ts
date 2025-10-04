import { NextRequest, NextResponse } from 'next/server'
import { getUserAndEnsure } from '@/lib/ensureUser'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      onboardingDone: user.profile?.onboardingDone || false,
      onboardingStep: user.profile?.onboardingStep || 0,
    })
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
