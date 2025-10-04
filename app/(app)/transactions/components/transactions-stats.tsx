'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  ArrowUpDown,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getUserData } from '@/lib/user-data'

interface TransactionStats {
  thisMonth: {
    income: number
    expenses: number
    net: number
    count: number
  }
  lastMonth: {
    income: number
    expenses: number
    net: number
    count: number
  }
  avgTransaction: number
  largestExpense: number
}

export function TransactionsStats() {
  const [stats, setStats] = useState<TransactionStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch real user data from Supabase
        const userData = await getUserData()
        
        const now = new Date()
        const thisMonth = now.getMonth()
        const thisYear = now.getFullYear()
        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
        const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear

        // Calculate this month's stats
        const thisMonthTransactions = userData.transactions.filter(txn => {
          const txnDate = new Date(txn.date)
          return txnDate.getMonth() === thisMonth && txnDate.getFullYear() === thisYear
        })

        const thisMonthIncome = thisMonthTransactions
          .filter(txn => txn.type === 'income')
          .reduce((sum, txn) => sum + Math.abs(txn.amount), 0)

        const thisMonthExpenses = thisMonthTransactions
          .filter(txn => txn.type === 'expense')
          .reduce((sum, txn) => sum + Math.abs(txn.amount), 0)

        // Calculate last month's stats for comparison
        const lastMonthTransactions = userData.transactions.filter(txn => {
          const txnDate = new Date(txn.date)
          return txnDate.getMonth() === lastMonth && txnDate.getFullYear() === lastMonthYear
        })

        const lastMonthIncome = lastMonthTransactions
          .filter(txn => txn.type === 'income')
          .reduce((sum, txn) => sum + Math.abs(txn.amount), 0)

        const lastMonthExpenses = lastMonthTransactions
          .filter(txn => txn.type === 'expense')
          .reduce((sum, txn) => sum + Math.abs(txn.amount), 0)

        // Calculate additional metrics
        const allTransactions = userData.transactions.filter(txn => txn.type === 'expense')
        const avgTransaction = allTransactions.length > 0 
          ? allTransactions.reduce((sum, txn) => sum + Math.abs(txn.amount), 0) / allTransactions.length
          : 0

        const largestExpense = allTransactions.length > 0
          ? Math.max(...allTransactions.map(txn => Math.abs(txn.amount)))
          : 0

        const realStats: TransactionStats = {
          thisMonth: {
            income: Math.round(thisMonthIncome),
            expenses: Math.round(thisMonthExpenses),
            net: Math.round(thisMonthIncome - thisMonthExpenses),
            count: thisMonthTransactions.length
          },
          lastMonth: {
            income: Math.round(lastMonthIncome),
            expenses: Math.round(lastMonthExpenses),
            net: Math.round(lastMonthIncome - lastMonthExpenses),
            count: lastMonthTransactions.length
          },
          avgTransaction: Math.round(avgTransaction * 100) / 100,
          largestExpense: Math.round(largestExpense)
        }

        setStats(realStats)
      } catch (error) {
        console.error('Error fetching transaction stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading || !stats) {
    return <TransactionsStatsSkeleton />
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  const incomeChange = calculateChange(stats.thisMonth.income, stats.lastMonth.income)
  const expenseChange = calculateChange(stats.thisMonth.expenses, stats.lastMonth.expenses)
  const netChange = calculateChange(stats.thisMonth.net, stats.lastMonth.net)

  const statCards = [
    {
      title: 'This Month Income',
      value: formatCurrency(stats.thisMonth.income),
      change: incomeChange,
      description: `${stats.thisMonth.count} transactions`,
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      title: 'This Month Expenses',
      value: formatCurrency(stats.thisMonth.expenses),
      change: expenseChange,
      description: `Avg: ${formatCurrency(stats.avgTransaction)}`,
      icon: TrendingDown,
      color: 'text-red-600'
    },
    {
      title: 'Net Cash Flow',
      value: formatCurrency(stats.thisMonth.net),
      change: netChange,
      description: stats.thisMonth.net > 0 ? 'Positive flow' : 'Negative flow',
      icon: ArrowUpDown,
      color: stats.thisMonth.net > 0 ? 'text-green-600' : 'text-red-600'
    },
    {
      title: 'Largest Expense',
      value: formatCurrency(stats.largestExpense),
      change: 0,
      description: 'This month',
      icon: DollarSign,
      color: 'text-orange-600'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-testid="transaction-kpis">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        const isPositiveChange = stat.change > 0
        const isNegativeChange = stat.change < 0
        
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
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                {stat.change !== 0 && (
                  <div className={cn(
                    'flex items-center text-xs',
                    isPositiveChange ? 'text-green-600' : 'text-red-600'
                  )}>
                    {isPositiveChange ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(stat.change).toFixed(1)}%
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function TransactionsStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="h-4 w-4 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-24 bg-muted rounded animate-pulse mb-2" />
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-muted rounded animate-pulse" />
              <div className="h-3 w-12 bg-muted rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
