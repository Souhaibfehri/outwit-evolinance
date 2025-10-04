'use client'

import { useEffect, useState } from 'react'
import { DollarSign, PiggyBank, CreditCard, Target } from 'lucide-react'
import { getUserData, calculateMetrics } from '@/lib/user-data'
import { SummaryCard } from '@/components/ui/summary-card'
import { DashboardKpis } from '@/lib/types/dashboard'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

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

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border p-6 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Failed to load dashboard data</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  // Show empty state if no data and not demo account
  if (!isDemoAccount && data.incomeThisMonth === 0 && data.totalSpentThisMonth === 0) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Ready to Assign"
          value="$0"
          subtitle="Complete onboarding to see your budget"
          icon={PiggyBank}
        >
          <Button size="sm" asChild className="mt-2">
            <Link href="/onboarding">Complete Setup</Link>
          </Button>
        </SummaryCard>
        <SummaryCard
          title="Monthly Income"
          value="$0"
          subtitle="No income sources yet"
          icon={DollarSign}
        >
          <Button size="sm" asChild className="mt-2">
            <Link href="/income">Add Income</Link>
          </Button>
        </SummaryCard>
        <SummaryCard
          title="This Month Spent"
          value="$0"
          subtitle="No expenses recorded"
          icon={CreditCard}
        >
          <Button size="sm" asChild className="mt-2">
            <Link href="/transactions">Add Transaction</Link>
          </Button>
        </SummaryCard>
        <SummaryCard
          title="Total Debt"
          value="$0"
          subtitle="No debts recorded"
          icon={Target}
        >
          <Button size="sm" asChild className="mt-2">
            <Link href="/debts">Add Debt</Link>
          </Button>
        </SummaryCard>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-coach-anchor="dashboard-kpis">
      <SummaryCard
        title="Ready to Assign"
        value={formatCurrency(data.readyToAssign)}
        subtitle="Available to budget"
        icon={PiggyBank}
        trend={data.readyToAssign > 0 ? { value: data.budgetUtilization, label: 'budget used', isPositive: data.budgetUtilization < 100 } : undefined}
      />
      <SummaryCard
        title="Monthly Income"
        value={formatCurrency(data.incomeThisMonth)}
        subtitle="Total monthly income"
        icon={DollarSign}
      />
      <SummaryCard
        title="This Month Spent"
        value={formatCurrency(data.totalSpentThisMonth)}
        subtitle="Total expenses"
        icon={CreditCard}
      />
      <SummaryCard
        title="Total Debt"
        value={formatCurrency(data.debtOutstanding)}
        subtitle="Outstanding debt"
        icon={Target}
        trend={data.debtOutstanding > 0 ? { value: -5.3, label: 'vs last month', isPositive: true } : undefined}
      />
    </div>
  )
}
