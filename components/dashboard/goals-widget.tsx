'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Target, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Plus,
  ArrowRight,
  Trophy,
  Clock
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { GoalKPIs, GoalWithProgress } from '@/lib/types/goals'

export function GoalsWidget() {
  const [kpis, setKpis] = useState<GoalKPIs | null>(null)
  const [topGoals, setTopGoals] = useState<GoalWithProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGoalsData()
  }, [])

  const fetchGoalsData = async () => {
    try {
      const response = await fetch('/api/goals?kpis=true&status=ACTIVE')
      const data = await response.json()
      
      if (response.ok) {
        setKpis(data.kpis)
        // Get top 3 active goals by priority and progress
        const sortedGoals = (data.goals || [])
          .filter((g: GoalWithProgress) => g.status === 'ACTIVE')
          .sort((a: GoalWithProgress, b: GoalWithProgress) => {
            // Sort by priority first, then by progress
            if (a.priority !== b.priority) return b.priority - a.priority
            return b.progressPercent - a.progressPercent
          })
          .slice(0, 3)
        
        setTopGoals(sortedGoals)
      }
    } catch (error) {
      console.error('Error fetching goals data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No target date'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-blue-600" />
            Goals
          </CardTitle>
          <Link href="/goals">
            <Button variant="ghost" size="sm">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* KPIs Summary */}
        {kpis && (
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(kpis.totalSaved)}
              </div>
              <div className="text-xs text-green-700 dark:text-green-300">
                Total Saved
              </div>
            </div>
            
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                {kpis.activeGoals}
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                Active Goals
              </div>
            </div>
          </div>
        )}

        {/* This Month Progress */}
        {kpis && kpis.thisMonthPlanned > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">This Month</span>
              <span className="font-medium">
                {formatCurrency(kpis.thisMonthContributed)} of {formatCurrency(kpis.thisMonthPlanned)}
              </span>
            </div>
            <Progress 
              value={kpis.thisMonthPlanned > 0 ? (kpis.thisMonthContributed / kpis.thisMonthPlanned) * 100 : 0} 
              className="h-2"
            />
          </div>
        )}

        {/* Top Goals */}
        {topGoals.length > 0 ? (
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Top Goals
            </div>
            
            {topGoals.map((goal, index) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-medium text-sm truncate">
                      {goal.name}
                    </div>
                    <Badge className="text-xs px-1 py-0 h-5">
                      {'⭐'.repeat(goal.priority)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>{formatCurrency(goal.savedAmount)} of {formatCurrency(goal.targetAmount)}</span>
                      <span>{goal.progressPercent.toFixed(0)}%</span>
                    </div>
                    <Progress value={goal.progressPercent} className="h-1" />
                    
                    {goal.targetDate && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>Target: {formatDate(goal.targetDate)}</span>
                        {!goal.isOnPace && (
                          <span className="text-yellow-600">⚠️</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {goal.progressPercent >= 100 && (
                  <div className="text-green-600">
                    <Trophy className="h-4 w-4" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Target className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              No goals yet
            </div>
            <Link href="/goals">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-1" />
                Add Goal
              </Button>
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        {topGoals.length > 0 && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-2">
              <Link href="/goals">
                <Button variant="outline" size="sm" className="w-full">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Contribute
                </Button>
              </Link>
              <Link href="/goals?tab=planner">
                <Button variant="outline" size="sm" className="w-full">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Plan
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
