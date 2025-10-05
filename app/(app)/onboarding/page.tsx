import { redirect } from 'next/navigation'
import { getUserAndEnsure } from '@/lib/ensureUser'

// Force dynamic rendering for authenticated route
export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const user = await getUserAndEnsure()
  if (!user) {
    redirect('/login')
  }

  // Check onboarding status
  const metadata = user.user_metadata || {}
  const onboardingSession = metadata.onboarding_session

  // Only redirect if explicitly completed, otherwise start fresh
  if (onboardingSession?.completed === true) {
    redirect('/dashboard')
  }

  // Always start with profile step for now to prevent auto-skipping
  redirect('/onboarding/profile')
}
