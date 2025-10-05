'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Target,
  CreditCard,
  PiggyBank,
  BarChart3,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Zap
} from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { formatCurrency } from '@/lib/budget/calcs'
import { BudgetHeatmap } from './budget-heatmap'
import { NetWorthChart } from './net-worth-chart'

interface DashboardV2Props {
  kpis: {
    readyToAssign: number
    savingsRateMTD: number
    totalDebt: number
    goalProgress: number
    costToBeMe: number
    expectedIncome: number
    netWorth: number
  }
  heatmapData: any[]
  netWorthHistory: any[]
  className?: string
}

export function DashboardV2({ 
  kpis, 
  heatmapData, 
  netWorthHistory, 
  className 
}: DashboardV2Props) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'3m' | '6m' | '12m'>('6m')

  const rtaStatus = kpis.readyToAssign > 0 ? 'needs_allocation' : 
                   kpis.readyToAssign < 0 ? 'over_allocated' : 'zero_based'

  const savingsRateStatus = kpis.savingsRateMTD >= 20 ? 'excellent' :
                           kpis.savingsRateMTD >= 10 ? 'good' :
                           kpis.savingsRateMTD >= 5 ? 'fair' : 'needs_improvement'

  const debtStatus = kpis.totalDebt === 0 ? 'debt_free' :
                    kpis.totalDebt < 10000 ? 'manageable' :
                    kpis.totalDebt < 50000 ? 'moderate' : 'high'

  const goalStatus = kpis.goalProgress >= 80 ? 'on_track' :
                    kpis.goalProgress >= 50 ? 'moderate' : 'behind'

  const budgetBalance = kpis.expectedIncome - kpis.costToBeMe
  const budgetStatus = budgetBalance > 0 ? 'surplus' : 
                      budgetBalance < 0 ? 'deficit' : 'balanced'

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Mission Control Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mission Control</h1>
          <p className="text-muted-foreground">
            Your complete financial overview at a glance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/forecast">
              <Calendar className="h-4 w-4 mr-2" />
              View Forecast
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/budget">
              <Zap className="h-4 w-4 mr-2" />
              Take Action
            </Link>
          </Button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Ready to Assign */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={`${
            rtaStatus === 'needs_allocation' ? 'border-orange-300 bg-orange-50 dark:bg-orange-950/20' :
            rtaStatus === 'over_allocated' ? 'border-red-300 bg-red-50 dark:bg-red-950/20' :
            'border-blue-300 bg-blue-50 dark:bg-blue-950/20'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ready to Assign</p>
                  <p className={`text-2xl font-bold ${
                    rtaStatus === 'needs_allocation' ? 'text-orange-600' :
                    rtaStatus === 'over_allocated' ? 'text-red-600' :
                    'text-blue-600'
                  }`}>
                    {formatCurrency(Math.abs(kpis.readyToAssign))}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {rtaStatus === 'needs_allocation' && (
                      <>
                        <AlertTriangle className="h-3 w-3 text-orange-600" />
                        <span className="text-xs text-orange-600">Needs allocation</span>
                      </>
                    )}
                    {rtaStatus === 'over_allocated' && (
                      <>
                        <AlertTriangle className="h-3 w-3 text-red-600" />
                        <span className="text-xs text-red-600">Over-allocated</span>
                      </>
                    )}
                    {rtaStatus === 'zero_based' && (
                      <>
                        <CheckCircle className="h-3 w-3 text-blue-600" />
                        <span className="text-xs text-blue-600">Zero-based ✓</span>
                      </>
                    )}
                  </div>
                </div>
                <DollarSign className={`h-8 w-8 ${
                  rtaStatus === 'needs_allocation' ? 'text-orange-600' :
                  rtaStatus === 'over_allocated' ? 'text-red-600' :
                  'text-blue-600'
                }`} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Savings Rate MTD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Savings Rate MTD</p>
                  <p className={`text-2xl font-bold ${
                    savingsRateStatus === 'excellent' ? 'text-blue-600' :
                    savingsRateStatus === 'good' ? 'text-blue-500' :
                    savingsRateStatus === 'fair' ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {kpis.savingsRateMTD.toFixed(1)}%
                  </p>
                  <div className="mt-2">
                    <Progress value={Math.min(100, kpis.savingsRateMTD)} className="h-1" />
                  </div>
                </div>
                <PiggyBank className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Debt Outstanding */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Debt Outstanding</p>
                  <p className={`text-2xl font-bold ${
                    debtStatus === 'debt_free' ? 'text-blue-600' :
                    debtStatus === 'manageable' ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {kpis.totalDebt === 0 ? 'Debt Free!' : formatCurrency(kpis.totalDebt)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {debtStatus === 'debt_free' && (
                      <>
                        <CheckCircle className="h-3 w-3 text-blue-600" />
                        <span className="text-xs text-blue-600">Congratulations!</span>
                      </>
                    )}
                    {debtStatus !== 'debt_free' && (
                      <Badge variant="outline" className="text-xs">
                        {debtStatus}
                      </Badge>
                    )}
                  </div>
                </div>
                <CreditCard className={`h-8 w-8 ${
                  debtStatus === 'debt_free' ? 'text-blue-600' : 'text-red-600'
                }`} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Goal Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Goal Progress</p>
                  <p className={`text-2xl font-bold ${
                    goalStatus === 'on_track' ? 'text-blue-600' :
                    goalStatus === 'moderate' ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {kpis.goalProgress.toFixed(1)}%
                  </p>
                  <div className="mt-2">
                    <Progress value={kpis.goalProgress} className="h-1" />
                  </div>
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Cost to Be Me vs Expected Income */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className={`${
            budgetStatus === 'deficit' ? 'border-red-300 bg-red-50 dark:bg-red-950/20' :
            budgetStatus === 'surplus' ? 'border-blue-300 bg-blue-50 dark:bg-blue-950/20' :
            'border-orange-300 bg-orange-50 dark:bg-orange-950/20'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Budget Balance</p>
                  <p className={`text-xl font-bold ${
                    budgetStatus === 'deficit' ? 'text-red-600' :
                    budgetStatus === 'surplus' ? 'text-blue-600' :
                    'text-orange-600'
                  }`}>
                    {formatCurrency(Math.abs(budgetBalance))}
                  </p>
                  <div className="space-y-1 mt-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Income</span>
                      <span className="font-medium">{formatCurrency(kpis.expectedIncome)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Cost to Be Me</span>
                      <span className="font-medium">{formatCurrency(kpis.costToBeMe)}</span>
                    </div>
                  </div>
                </div>
                {budgetStatus === 'deficit' ? (
                  <TrendingDown className="h-8 w-8 text-red-600" />
                ) : (
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Secondary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-600" />
                Budget Heatmap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BudgetHeatmap data={heatmapData} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Net Worth Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                Net Worth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(kpis.netWorth)}
                  </p>
                  <p className="text-sm text-muted-foreground">Current Net Worth</p>
                </div>
                
                <div className="h-32">
                  <NetWorthChart data={netWorthHistory} timeframe={selectedTimeframe} />
                </div>

                <div className="flex justify-center">
                  <div className="flex items-center gap-1 text-xs bg-muted rounded p-1">
                    {(['3m', '6m', '12m'] as const).map(period => (
                      <button
                        key={period}
                        onClick={() => setSelectedTimeframe(period)}
                        className={`px-2 py-1 rounded transition-colors ${
                          selectedTimeframe === period 
                            ? 'bg-background text-foreground' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Action Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Recommended Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rtaStatus === 'needs_allocation' && (
                <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-sm">Allocate Ready to Assign</p>
                      <p className="text-xs text-muted-foreground">
                        You have {formatCurrency(kpis.readyToAssign)} waiting to be assigned
                      </p>
                    </div>
                  </div>
                  <Button size="sm" asChild>
                    <Link href="/budget">
                      Allocate Now
                    </Link>
                  </Button>
                </div>
              )}

              {savingsRateStatus === 'needs_improvement' && (
                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <PiggyBank className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-sm">Boost Your Savings Rate</p>
                      <p className="text-xs text-muted-foreground">
                        Current rate: {kpis.savingsRateMTD.toFixed(1)}% (target: 20%+)
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/goals">
                      Set Goals
                    </Link>
                  </Button>
                </div>
              )}

              {goalStatus === 'behind' && (
                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-sm">Goals Need Attention</p>
                      <p className="text-xs text-muted-foreground">
                        {kpis.goalProgress.toFixed(1)}% average progress across goals
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/goals">
                      Review Goals
                    </Link>
                  </Button>
                </div>
              )}

              {kpis.totalDebt > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium text-sm">Debt Payoff Strategy</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(kpis.totalDebt)} total debt outstanding
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/debts">
                      View Strategy
                    </Link>
                  </Button>
                </div>
              )}

              {/* All good state */}
              {rtaStatus === 'zero_based' && 
               savingsRateStatus !== 'needs_improvement' && 
               goalStatus !== 'behind' && 
               kpis.totalDebt === 0 && (
                <div className="text-center py-6">
                  <CheckCircle className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                    You're Crushing It! 🎉
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your finances are on track. Keep up the great work!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
