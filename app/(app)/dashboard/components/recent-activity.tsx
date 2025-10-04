'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AppCard } from '@/components/ui/app-card'
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Clock,
  ArrowRight,
  TrendingUp,
  Filter
} from 'lucide-react'
import { motion } from 'framer-motion'
import { getUserData } from '@/lib/user-data'
import Link from 'next/link'
import { isUserInDemoMode, getEmptyStateMessage, filterDemoData } from '@/lib/demo-mode'

interface RecentTransaction {
  id: string
  date: string
  merchant: string
  category: string
  account: string
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  amount: number
  isApproximate?: boolean
  source?: string
  isDemo?: boolean
}

export function RecentActivity() {
  const [transactions, setTransactions] = useState<RecentTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [userIsDemoMode] = useState(isUserInDemoMode())
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  useEffect(() => {
    async function fetchRecentActivity() {
      try {
        // Fetch real user data from Supabase
        const userData = await getUserData()
        
        // Convert user transactions to recent activity format
        const recentTransactions: RecentTransaction[] = userData.transactions
          .slice(-10) // Get last 10 transactions
          .map(txn => ({
            id: txn.id,
            date: txn.date,
            merchant: txn.description || txn.merchant || 'Unknown',
            category: txn.categoryName || txn.category || 'Uncategorized',
            account: txn.accountName || txn.account || 'Default Account',
            type: txn.type.toUpperCase() as 'INCOME' | 'EXPENSE' | 'TRANSFER',
            amount: txn.amount,
            isApproximate: false,
            source: 'user_data'
          }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        // If no real data, show helpful empty state
        if (recentTransactions.length === 0) {
          setTransactions([])
          setLoading(false)
          return
        }

        setTransactions(recentTransactions)
      } catch (error) {
        console.error('Error fetching recent activity:', error)
        // Fallback to empty array instead of mock data
        setTransactions([])
      } finally {
        setLoading(false)
      }
    }

    fetchRecentActivity()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(amount))
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  // Filter transactions based on selected filters
  const filteredTransactions = transactions.filter(transaction => {
    const categoryMatch = selectedCategory === 'all' || transaction.category === selectedCategory
    const typeMatch = selectedType === 'all' || transaction.type === selectedType
    return categoryMatch && typeMatch
  })

  // Get unique categories and types for filter dropdowns
  const uniqueCategories = Array.from(new Set(transactions.map(t => t.category)))
  const uniqueTypes = Array.from(new Set(transactions.map(t => t.type)))

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'INCOME':
        return ArrowUp
      case 'EXPENSE':
        return ArrowDown
      case 'TRANSFER':
        return ArrowUpDown
      default:
        return ArrowUpDown
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'INCOME':
        return 'text-green-600 bg-green-100 dark:bg-green-900'
      case 'EXPENSE':
        return 'text-red-600 bg-red-100 dark:bg-red-900'
      case 'TRANSFER':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900'
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900'
    }
  }

  if (loading) {
    return <RecentActivitySkeleton />
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <AppCard
        title="Recent Activity"
        icon={Clock}
        elevated
        data-testid="recent-activity"
        actions={
          <div className="flex items-center gap-2">
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs border rounded px-2 py-1 bg-white dark:bg-gray-800"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select 
              value={selectedType} 
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs border rounded px-2 py-1 bg-white dark:bg-gray-800"
            >
              <option value="all">All Types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <Link href="/transactions">
              <Button variant="outline" size="sm" className="text-xs">
                View All
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        }
        className="card-hover"
      >
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No recent activity</h3>
              <p className="text-muted-foreground text-sm mb-6">
                {getEmptyStateMessage('transactions', userIsDemoMode)}
              </p>
              <Button className="btn-primary rounded-xl">Add Transaction</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.slice(0, 5).map((transaction, index) => {
                const Icon = getTransactionIcon(transaction.type)
                const colorClass = getTransactionColor(transaction.type)
                
                return (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="grid grid-cols-[auto_1fr_auto] gap-4 items-start p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200"
                  >
                    <div className={`p-2 rounded-lg ${colorClass} shrink-0`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    
                    <div className="min-w-0 space-y-1">
                      {/* Line 1: Merchant + Chips */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                          {transaction.merchant}
                        </h4>
                        <div className="inline-flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-xs px-2 py-0 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                            {transaction.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs px-2 py-0 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                            {transaction.account}
                          </Badge>
                          {transaction.isApproximate && (
                            <Badge variant="secondary" className="text-xs px-2 py-0">
                              Est.
                            </Badge>
                          )}
                          {transaction.source === 'quick_capture' && (
                            <Badge variant="outline" className="text-xs px-2 py-0 bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800">
                              Quick
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Line 2: Time + Type */}
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <span>{formatTime(transaction.date)}</span>
                        <span>•</span>
                        <span className="capitalize">{transaction.type.toLowerCase()}</span>
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <p className={`font-semibold text-sm ${
                        transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'EXPENSE' ? '-' : '+'}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                        {transaction.type.toLowerCase()}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
              
              <div className="pt-4 text-center">
                <Link href="/transactions">
                  <Button variant="outline" className="card-hover">
                    View All Transactions
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
      </AppCard>
    </motion.div>
  )
}

function RecentActivitySkeleton() {
  return (
    <AppCard
      title="Recent Activity"
      elevated
      className="card-hover"
    >
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border rounded-xl">
            <div className="w-8 h-8 bg-muted rounded-lg animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-muted rounded animate-pulse mb-2" />
              <div className="h-3 w-48 bg-muted rounded animate-pulse" />
            </div>
            <div className="text-right">
              <div className="h-4 w-16 bg-muted rounded animate-pulse mb-1" />
              <div className="h-3 w-12 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </AppCard>
  )
}