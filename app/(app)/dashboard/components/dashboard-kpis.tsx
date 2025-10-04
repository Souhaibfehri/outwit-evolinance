'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AppCard, MetricCard } from '@/components/ui/app-card'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  CreditCard,
  PiggyBank,
  Target,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { motion } from 'framer-motion'
import { getUserData, calculateMetrics } from '@/lib/user-data'
import { SummaryCard } from '@/components/ui/summary-card'
import { DashboardKpis } from '@/lib/types/dashboard'

interface DashboardKPIsData {
  monthlyIncome: number
  readyToAssign: number
  thisMonthSpent: number
  totalDebt: number
  savingsRate: number
  netWorth: number
  trends: {
    income: number
    spending: number
    debt: number
    savings: number
  }
}

export function DashboardKPIs() {
  const [data, setData] = useState<DashboardKpis | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemoAccount, setIsDemoAccount] = useState(false)

  useEffect(() => {
    async function fetchKPIs() {
      try {
        // Fetch real user data from Supabase
        const userData = await getUserData()
        
        // Set demo account flag
        setIsDemoAccount(userData.isDemoAccount)
        
        // Calculate metrics from real user data
        const metrics = calculateMetrics(userData)
        
        setData(metrics)
      } catch (error) {
        console.error('Error fetching dashboard KPIs:', error)
        // Fallback to empty data structure
        setData({
          readyToAssign: 0,
          incomeThisMonth: 0,
          totalSpentThisMonth: 0,
          debtOutstanding: 0,
          savingsRate: 0,
          budgetUtilization: 0
        })
      } finally {
        setLoading(false)
      }
    }

    fetchKPIs()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getTrendIcon = (trend: number) => {
    return trend > 0 ? ArrowUpRight : ArrowDownRight
  }

  const getTrendColor = (trend: number, isPositiveGood: boolean = true) => {
    const isPositive = trend > 0
    if (isPositiveGood) {
      return isPositive ? 'text-green-600' : 'text-red-600'
    } else {
      return isPositive ? 'text-red-600' : 'text-green-600'
    }
  }

  if (loading || !data) {
    return <DashboardKPIsSkeleton />
  }

  const kpiCards = [
    {
      title: 'Monthly Income',
      value: formatCurrency(data.monthlyIncome),
      trend: data.trends.income,
      icon: DollarSign,
      gradient: 'gradient-success',
      description: 'Total monthly income',
      isPositiveGood: true
    },
    {
      title: 'Ready to Assign',
      value: formatCurrency(data.readyToAssign),
      trend: data.trends.savings,
      icon: PiggyBank,
      gradient: 'gradient-primary',
      description: 'Available to budget',
      isPositiveGood: true
    },
    {
      title: 'This Month Spent',
      value: formatCurrency(data.thisMonthSpent),
      trend: data.trends.spending,
      icon: CreditCard,
      gradient: 'gradient-info',
      description: 'Total expenses',
      isPositiveGood: false
    },
    {
      title: 'Total Debt',
      value: formatCurrency(data.totalDebt),
      trend: data.trends.debt,
      icon: TrendingDown,
      gradient: 'gradient-warning',
      description: 'All outstanding debt',
      isPositiveGood: false
    }
  ]

  return (
    <div className="space-y-6">
      {/* Main KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" data-coach-anchor="dashboard-kpis">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon
          const TrendIcon = getTrendIcon(kpi.trend)
          const trendColor = getTrendColor(kpi.trend, kpi.isPositiveGood)
          
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <MetricCard
                title={kpi.title}
                value={kpi.value}
                subtitle={kpi.description}
                icon={Icon}
                trend={{
                  value: kpi.trend,
                  isPositive: kpi.isPositiveGood ? kpi.trend > 0 : kpi.trend < 0
                }}
                className="card-hover"
              />
            </motion.div>
          )
        })}
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <MetricCard
            title="Savings Rate"
            value={`${data.savingsRate.toFixed(1)}%`}
            subtitle="Of income saved monthly"
            icon={Target}
            status="success"
            className="card-hover"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <MetricCard
            title="Net Worth"
            value={formatCurrency(data.netWorth)}
            subtitle="Assets minus liabilities"
            icon={TrendingUp}
            trend={{
              value: 8.2,
              isPositive: true
            }}
            status="info"
            className="card-hover"
          />
        </motion.div>
      </div>
    </div>
  )
}

function DashboardKPIsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="card-gradient border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="space-y-2">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="h-3 w-16 bg-muted rounded animate-pulse" />
              </div>
              <div className="h-9 w-9 bg-muted rounded-xl animate-pulse" />
            </CardHeader>
            <CardContent className="pb-6">
              <div className="space-y-2">
                <div className="h-8 w-28 bg-muted rounded animate-pulse" />
                <div className="h-3 w-32 bg-muted rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="card-gradient border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="space-y-2">
                <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                <div className="h-5 w-16 bg-muted rounded animate-pulse" />
              </div>
              <div className="h-9 w-9 bg-muted rounded-xl animate-pulse" />
            </CardHeader>
            <CardContent className="pb-6">
              <div className="space-y-2">
                <div className="h-8 w-24 bg-muted rounded animate-pulse" />
                <div className="h-3 w-36 bg-muted rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}