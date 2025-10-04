'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Target,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrendData {
  category: string
  currentMonth: number
  previousMonth: number
  change: number
  trend: 'up' | 'down' | 'stable'
  insight: string
  severity: 'info' | 'warning' | 'success'
}

export function TrendsAnalysis() {
  const [trends, setTrends] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTrends() {
      try {
        // Mock data for now - would fetch from /api/reports/trends
        const mockTrends: TrendData[] = [
          {
            category: 'Entertainment',
            currentMonth: 320,
            previousMonth: 180,
            change: 77.8,
            trend: 'up',
            insight: 'Significant increase in entertainment spending. Consider reviewing your budget allocation.',
            severity: 'warning'
          },
          {
            category: 'Groceries',
            currentMonth: 450,
            previousMonth: 520,
            change: -13.5,
            trend: 'down',
            insight: 'Great job reducing grocery expenses! You\'re staying within budget.',
            severity: 'success'
          },
          {
            category: 'Transportation',
            currentMonth: 380,
            previousMonth: 280,
            change: 35.7,
            trend: 'up',
            insight: 'Higher transportation costs this month. Check for any one-time expenses.',
            severity: 'info'
          },
          {
            category: 'Shopping',
            currentMonth: 220,
            previousMonth: 350,
            change: -37.1,
            trend: 'down',
            insight: 'Excellent reduction in shopping expenses. Keep up the good work!',
            severity: 'success'
          },
          {
            category: 'Utilities',
            currentMonth: 280,
            previousMonth: 180,
            change: 55.6,
            trend: 'up',
            insight: 'Utilities increased significantly. This might be seasonal or due to higher usage.',
            severity: 'warning'
          }
        ]

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        setTrends(mockTrends)
      } catch (error) {
        console.error('Error fetching trends:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrends()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'warning': return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
      case 'success': return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
      default: return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'warning': return AlertTriangle
      case 'success': return CheckCircle
      default: return Target
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return TrendingUp
      case 'down': return TrendingDown
      default: return Target
    }
  }

  if (loading) {
    return <TrendsAnalysisSkeleton />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Spending Trends Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        {trends.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No trend data</h3>
            <p className="text-muted-foreground text-sm">
              We need at least 2 months of data to show spending trends.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {trends.map((trend) => {
              const SeverityIcon = getSeverityIcon(trend.severity)
              const TrendIcon = getTrendIcon(trend.trend)
              
              return (
                <div
                  key={trend.category}
                  className={cn(
                    'p-4 rounded-lg border transition-colors',
                    getSeverityColor(trend.severity)
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-full bg-background border">
                      <SeverityIcon className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{trend.category}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(trend.previousMonth)} → {formatCurrency(trend.currentMonth)}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={trend.trend === 'up' ? 'destructive' : trend.trend === 'down' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            <TrendIcon className="h-3 w-3 mr-1" />
                            {Math.abs(trend.change).toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm">
                        {trend.insight}
                      </p>
                      
                      {/* Visual change indicator */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Change:</span>
                        <div className="flex-1 relative">
                          <Progress 
                            value={Math.min(Math.abs(trend.change), 100)} 
                            className={cn(
                              'h-2',
                              trend.trend === 'up' ? 'bg-red-100 dark:bg-red-900' : 'bg-green-100 dark:bg-green-900'
                            )}
                          />
                        </div>
                        <span className={cn(
                          'text-xs font-medium',
                          trend.trend === 'up' ? 'text-red-600' : 'text-green-600'
                        )}>
                          {trend.change > 0 ? '+' : ''}{trend.change.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            
            <div className="pt-4 border-t">
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Positive trends</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span>Watch closely</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span>Informational</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TrendsAnalysisSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-48 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 rounded-lg border">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 bg-muted rounded-full animate-pulse" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-4 w-24 bg-muted rounded animate-pulse mb-1" />
                      <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-full bg-muted rounded animate-pulse" />
                  <div className="h-2 w-full bg-muted rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
