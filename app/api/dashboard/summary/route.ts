import { NextRequest, NextResponse } from 'next/server'
import { getUserAndEnsure } from '@/lib/ensureUser'
import { recomputeAll, type DashboardKPIs, type UpcomingItems } from '@/lib/recompute'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
    }

    const metadata = user.user_metadata || {}
    
    // Check if we have cached data
    const cachedKPIs = metadata.dashboard_kpis
    const cachedUpcoming = metadata.upcoming_items
    const lastRecompute = metadata.last_recompute

    // Recompute if cache is older than 1 hour or doesn't exist
    const shouldRecompute = !lastRecompute || 
      (new Date().getTime() - new Date(lastRecompute).getTime()) > 60 * 60 * 1000

    let kpis: DashboardKPIs
    let upcoming: UpcomingItems

    if (shouldRecompute) {
      const recomputeResult = await recomputeAll(user.id)
      if (recomputeResult.success) {
        kpis = recomputeResult.kpis!
        upcoming = recomputeResult.upcoming!
      } else {
        return NextResponse.json({ 
          success: false, 
          error: recomputeResult.error 
        }, { status: 500 })
      }
    } else {
      kpis = cachedKPIs
      upcoming = cachedUpcoming
    }

    // Calculate banner flags
    const banners = calculateBannerFlags(kpis, upcoming, metadata)

    return NextResponse.json({
      success: true,
      kpis,
      upcoming,
      banners,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error getting dashboard summary:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get dashboard summary'
    }, { status: 500 })
  }
}

/**
 * Calculate which banners should be shown
 */
function calculateBannerFlags(kpis: DashboardKPIs, upcoming: UpcomingItems, metadata: any) {
  const banners: Record<string, boolean> = {}

  // Over-allocated budget
  banners.overAllocated = kpis.readyToAssign < 0

  // Goal nudges
  banners.goalNudge = upcoming.goals.some(goal => goal.needsAttention)

  // No transactions this month
  const currentMonth = getCurrentMonth()
  const transactions = metadata.transactions || []
  const hasTransactionsThisMonth = transactions.some((txn: any) => {
    const txnDate = new Date(txn.date)
    const txnMonth = `${txnDate.getFullYear()}-${String(txnDate.getMonth() + 1).padStart(2, '0')}`
    return txnMonth === currentMonth
  })
  banners.noTransactions = !hasTransactionsThisMonth

  // Onboarding completion (show for 48 hours)
  const onboardingCompletedAt = metadata.onboarding_completed_at
  if (onboardingCompletedAt) {
    const hoursSinceCompletion = (new Date().getTime() - new Date(onboardingCompletedAt).getTime()) / (1000 * 60 * 60)
    banners.onboardingComplete = hoursSinceCompletion <= 48
  }

  // Trial ending soon
  const onboardingProfile = metadata.onboarding_profile
  if (onboardingProfile?.trialEndsAt) {
    const daysUntilTrialEnd = Math.ceil((new Date(onboardingProfile.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    banners.trialEnding = daysUntilTrialEnd <= 3 && daysUntilTrialEnd > 0
  }

  return banners
}

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
