import { Suspense } from 'react'
import { DashboardClient } from './dashboard-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { InfoHint, FINANCIAL_EXPLANATIONS } from '@/components/ui/info-hint'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  CreditCard, 
  PiggyBank,
  AlertTriangle,
  CheckCircle,
  Plus,
  ArrowRight,
  Calendar,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { DashboardSkeleton } from './components/dashboard-skeleton'
import { DashboardKPIs } from './components/dashboard-kpis-new'
import { SmartBanners } from './components/smart-banners'
import { UpcomingItems } from './components/upcoming-items'
import { QuickActions } from './components/quick-actions'
import { RecentActivity } from './components/recent-activity'
import { GoalsWidget } from '@/components/dashboard/goals-widget'

export default function DashboardPage() {
  return (
    <DashboardClient>
      <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Your financial overview at a glance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/transactions/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/budget">
              Review Budget
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Smart Banners */}
      <Suspense fallback={<div className="h-16" />}>
        <SmartBanners />
      </Suspense>

      {/* Main KPIs Grid */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardKPIs />
      </Suspense>

      {/* Secondary Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Goals Widget */}
        <Suspense fallback={<Card className="h-96"><CardContent className="p-6">Loading...</CardContent></Card>}>
          <GoalsWidget />
        </Suspense>

        {/* Upcoming Items */}
        <Suspense fallback={<Card className="h-96"><CardContent className="p-6">Loading...</CardContent></Card>}>
          <UpcomingItems />
        </Suspense>

        {/* Recent Activity */}
        <Suspense fallback={<Card className="h-96"><CardContent className="p-6">Loading...</CardContent></Card>}>
          <RecentActivity />
        </Suspense>
      </div>

      {/* Quick Actions */}
      <Suspense fallback={<div className="h-32" />}>
        <QuickActions />
      </Suspense>
    </div>
    </DashboardClient>
  )
}

export const metadata = {
  title: 'Dashboard - Outwit Budget',
  description: 'Your financial overview and key metrics'
}
