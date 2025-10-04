'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { InfoHint, FINANCIAL_EXPLANATIONS } from '@/components/ui/info-hint'
import { 
  TrendingUp, 
  PiggyBank, 
  Target,
  DollarSign,
  Percent,
  CreditCard
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReportsKPIsData {
  savingsRate: number
  essentialsPercentage: number
  topCategories: Array<{
    name: string
    amount: number
    percentage: number
  }>
  netCashFlow: {
    current: number
    trailing3: number
    trailing6: number
    trailing12: number
  }
  netWorth: number
  debtToIncomeRatio: number
}

export function ReportsKPIs() {
  const [data, setData] = useState<ReportsKPIsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchKPIs() {
      try {
        // Mock data for now - would fetch from /api/reports/kpis
        const mockData: ReportsKPIsData = {
          savingsRate: 23.5,
          essentialsPercentage: 65.2,
          topCategories: [
            { name: 'Housing', amount: 1200, percentage: 35.2 },
            { name: 'Groceries', amount: 450, percentage: 13.2 },
            { name: 'Transportation', amount: 380, percentage: 11.1 }
          ],
          netCashFlow: {
            current: 1800,
            trailing3: 1650,
            trailing6: 1750,
            trailing12: 1600
          },
          netWorth: 45000,
          debtToIncomeRatio: 0.15
        }

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        setData(mockData)
      } catch (error) {
        console.error('Error fetching reports KPIs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchKPIs()
  }, [])

  if (loading || !data) {
    return <ReportsKPIsSkeleton />
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getSavingsRateColor = (rate: number) => {
    if (rate >= 20) return 'text-green-600'
    if (rate >= 10) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSavingsRateMessage = (rate: number) => {
    if (rate >= 20) return 'Excellent!'
    if (rate >= 10) return 'Good progress'
    return 'Room to improve'
  }

  const kpiCards = [
    {
      title: 'Savings Rate',
      value: formatPercentage(data.savingsRate),
      description: getSavingsRateMessage(data.savingsRate),
      icon: PiggyBank,
      color: getSavingsRateColor(data.savingsRate),
      infoHint: FINANCIAL_EXPLANATIONS.savingsRate
    },
    {
      title: 'Essentials vs Lifestyle',
      value: formatPercentage(data.essentialsPercentage),
      description: `${formatPercentage(100 - data.essentialsPercentage)} lifestyle`,
      icon: Percent,
      color: data.essentialsPercentage <= 70 ? 'text-green-600' : 'text-yellow-600'
    },
    {
      title: 'Net Cash Flow',
      value: formatCurrency(data.netCashFlow.current),
      description: `12-mo avg: ${formatCurrency(data.netCashFlow.trailing12)}`,
      icon: TrendingUp,
      color: data.netCashFlow.current > 0 ? 'text-green-600' : 'text-red-600'
    },
    {
      title: 'Net Worth',
      value: formatCurrency(data.netWorth),
      description: `Debt ratio: ${formatPercentage(data.debtToIncomeRatio * 100)}`,
      icon: Target,
      color: data.netWorth > 0 ? 'text-green-600' : 'text-red-600',
      infoHint: FINANCIAL_EXPLANATIONS.netWorth
    }
  ]

  return (
    <div className="space-y-6">
      {/* Main KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium">
                    {kpi.title}
                  </CardTitle>
                  {kpi.infoHint && (
                    <InfoHint
                      title={kpi.infoHint.title}
                      content={kpi.infoHint.content}
                      learnMoreUrl={kpi.infoHint.learnMoreUrl}
                    />
                  )}
                </div>
                <Icon className={cn('h-4 w-4', kpi.color)} />
              </CardHeader>
              <CardContent>
                <div className={cn('text-2xl font-bold', kpi.color)}>
                  {kpi.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {kpi.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Top Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Top Spending Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topCategories.map((category, index) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPercentage(category.percentage)} of spending
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(category.amount)}</p>
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Cash Flow Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className={cn(
                'text-xl font-bold',
                data.netCashFlow.current > 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {formatCurrency(data.netCashFlow.current)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">3-Month Avg</p>
              <p className={cn(
                'text-xl font-bold',
                data.netCashFlow.trailing3 > 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {formatCurrency(data.netCashFlow.trailing3)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">6-Month Avg</p>
              <p className={cn(
                'text-xl font-bold',
                data.netCashFlow.trailing6 > 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {formatCurrency(data.netCashFlow.trailing6)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">12-Month Avg</p>
              <p className={cn(
                'text-xl font-bold',
                data.netCashFlow.trailing12 > 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {formatCurrency(data.netCashFlow.trailing12)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ReportsKPIsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
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
      
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                  <div>
                    <div className="h-4 w-24 bg-muted rounded animate-pulse mb-1" />
                    <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-4 w-16 bg-muted rounded animate-pulse mb-1" />
                  <div className="h-5 w-8 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
