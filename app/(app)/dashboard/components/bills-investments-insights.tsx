'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Receipt,
  TrendingUp,
  Calculator,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  DollarSign,
  Calendar,
  Target
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface BillsInsights {
  monthlyTotal: number
  upcomingCount: number
  overdueCount: number
  avgBillAmount: number
  nextBillDue: {
    name: string
    amount: number
    daysUntil: number
  }
}

interface InvestmentsInsights {
  monthlyContributions: number
  projectedGrowth: number
  totalValue: number
  bestPerformer: {
    name: string
    apr: number
    growth: number
  }
}

export function BillsInvestmentsInsights() {
  const [billsData, setBillsData] = useState<BillsInsights | null>(null)
  const [investmentsData, setInvestmentsData] = useState<InvestmentsInsights | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInsights() {
      try {
        // Mock data for now - would fetch from /api/dashboard/insights
        const mockBillsData: BillsInsights = {
          monthlyTotal: 1456,
          upcomingCount: 3,
          overdueCount: 1,
          avgBillAmount: 182,
          nextBillDue: {
            name: 'Electric Bill',
            amount: 125,
            daysUntil: 2
          }
        }

        const mockInvestmentsData: InvestmentsInsights = {
          monthlyContributions: 1000,
          projectedGrowth: 8450,
          totalValue: 14950,
          bestPerformer: {
            name: 'Index Fund',
            apr: 8.5,
            growth: 1200
          }
        }

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 900))
        setBillsData(mockBillsData)
        setInvestmentsData(mockInvestmentsData)
      } catch (error) {
        console.error('Error fetching insights:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
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
    return <BillsInvestmentsInsightsSkeleton />
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="space-y-6"
    >
      {/* Bills Insights */}
      <Card className="card-hover card-gradient border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-600" />
            Bills Overview
          </CardTitle>
          <Link href="/bills">
            <Button variant="outline" size="sm" className="text-xs">
              Manage
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {billsData && (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Monthly Total</p>
                  <p className="font-bold text-blue-800 dark:text-blue-200">
                    {formatCurrency(billsData.monthlyTotal)}
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950">
                  <p className="text-xs text-green-700 dark:text-green-300 mb-1">Avg per Bill</p>
                  <p className="font-bold text-green-800 dark:text-green-200">
                    {formatCurrency(billsData.avgBillAmount)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Upcoming Bills</span>
                  <Badge variant="outline" className="text-xs">
                    {billsData.upcomingCount} due soon
                  </Badge>
                </div>
                
                {billsData.overdueCount > 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-700 dark:text-red-300">
                      {billsData.overdueCount} overdue bill{billsData.overdueCount > 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Next: {billsData.nextBillDue.name}
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">
                        {formatCurrency(billsData.nextBillDue.amount)} in {billsData.nextBillDue.daysUntil} days
                      </p>
                    </div>
                    <Button size="sm" className="btn-primary text-xs">
                      Pay Now
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Investments Insights */}
      <Card className="card-hover card-gradient border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Investments
          </CardTitle>
          <Link href="/investments">
            <Button variant="outline" size="sm" className="text-xs">
              Invest
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {investmentsData && (
            <>
              <div className="p-4 rounded-xl gradient-purple text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-purple-100 text-sm">Monthly Contributions</span>
                  <Target className="h-4 w-4 text-purple-200" />
                </div>
                <p className="font-bold text-xl">
                  {formatCurrency(investmentsData.monthlyContributions)}
                </p>
                <p className="text-purple-200 text-xs">
                  Building wealth consistently
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950">
                  <p className="text-xs text-green-700 dark:text-green-300 mb-1">Total Value</p>
                  <p className="font-bold text-green-800 dark:text-green-200">
                    {formatCurrency(investmentsData.totalValue)}
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-950">
                  <p className="text-xs text-purple-700 dark:text-purple-300 mb-1">Projected Growth</p>
                  <p className="font-bold text-purple-800 dark:text-purple-200">
                    +{formatCurrency(investmentsData.projectedGrowth)}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  <span className="text-sm font-medium text-teal-800 dark:text-teal-200">
                    Best Performer
                  </span>
                </div>
                <p className="text-xs text-teal-700 dark:text-teal-300">
                  {investmentsData.bestPerformer.name} • {investmentsData.bestPerformer.apr}% APR
                </p>
                <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                  +{formatCurrency(investmentsData.bestPerformer.growth)} growth
                </p>
              </div>

              {/* Quick Simulator */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Quick Simulation</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>If you invest an extra <span className="font-medium text-orange-600">$100/month</span> at <span className="font-medium text-purple-600">7.5% APR</span>:</p>
                  <p className="mt-1">You could have <span className="font-bold text-green-600">{formatCurrency(155000)}</span> in 10 years!</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function BillsInvestmentsInsightsSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i} className="card-gradient border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="h-5 w-32 bg-muted rounded animate-pulse" />
            <div className="h-6 w-16 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="h-16 bg-muted rounded-lg animate-pulse" />
              <div className="h-16 bg-muted rounded-lg animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
