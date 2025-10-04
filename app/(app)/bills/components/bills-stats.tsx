'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  DollarSign, 
  AlertTriangle,
  TrendingUp,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BillsStatsData {
  totalMonthly: number
  upcomingCount: number
  overdueCount: number
  nextBillAmount: number
  nextBillDays: number
  avgMonthlyChange: number
}

export function BillsStats() {
  const [data, setData] = useState<BillsStatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBillsStats() {
      try {
        // Mock data for now - would fetch from /api/bills/stats
        const mockData: BillsStatsData = {
          totalMonthly: 2850,
          upcomingCount: 5,
          overdueCount: 1,
          nextBillAmount: 125,
          nextBillDays: 2,
          avgMonthlyChange: 5.2
        }

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        setData(mockData)
      } catch (error) {
        console.error('Error fetching bills stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBillsStats()
  }, [])

  if (loading || !data) {
    return <BillsStatsSkeleton />
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDaysUntil = (days: number) => {
    if (days === 0) return 'Due today'
    if (days === 1) return 'Due tomorrow'
    return `Due in ${days} days`
  }

  const stats = [
    {
      title: 'Monthly Total',
      value: formatCurrency(data.totalMonthly),
      description: `${data.avgMonthlyChange > 0 ? '+' : ''}${data.avgMonthlyChange.toFixed(1)}% vs last month`,
      icon: DollarSign,
      color: 'text-blue-600',
      trend: data.avgMonthlyChange > 0 ? 'up' : data.avgMonthlyChange < 0 ? 'down' : 'neutral'
    },
    {
      title: 'Upcoming Bills',
      value: data.upcomingCount.toString(),
      description: `Next: ${formatCurrency(data.nextBillAmount)} ${formatDaysUntil(data.nextBillDays)}`,
      icon: Calendar,
      color: 'text-orange-600',
      trend: 'neutral'
    },
    {
      title: 'Overdue',
      value: data.overdueCount.toString(),
      description: data.overdueCount === 0 ? 'All caught up! ✨' : 'Need attention',
      icon: AlertTriangle,
      color: data.overdueCount === 0 ? 'text-green-600' : 'text-red-600',
      trend: data.overdueCount === 0 ? 'up' : 'down'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className={cn('h-4 w-4', stat.color)} />
            </CardHeader>
            <CardContent>
              <div className={cn('text-2xl font-bold', stat.color)}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
              {stat.trend === 'up' && (
                <TrendingUp className="h-3 w-3 text-green-600 absolute top-3 right-8" />
              )}
              {stat.trend === 'down' && (
                <div className="absolute top-3 right-8">
                  {stat.title === 'Overdue' ? (
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                  ) : (
                    <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function BillsStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="h-4 w-4 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-24 bg-muted rounded animate-pulse mb-2" />
            <div className="h-3 w-40 bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
