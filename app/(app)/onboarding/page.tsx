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

  if (onboardingSession?.completed) {
    redirect('/dashboard')
  }

  // Redirect to current step or start
  const currentStep = onboardingSession?.currentStep || 0
  const stepRoutes = ['profile', 'income', 'bills', 'debts', 'goals', 'review']
  const targetRoute = stepRoutes[currentStep] || 'profile'

  redirect(`/onboarding/${targetRoute}`)
}
