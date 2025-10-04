'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Calendar, 
  CreditCard,
  Target,
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface UpcomingBill {
  id: string
  name: string
  amount: number
  dueDate: string
  category: string
  overdue: boolean
  daysUntil: number
}

interface GoalProgress {
  id: string
  name: string
  current: number
  target: number
  targetDate?: string
  priority: number
}

export function UpcomingItems() {
  const [bills, setBills] = useState<UpcomingBill[]>([])
  const [goals, setGoals] = useState<GoalProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUpcomingItems() {
      try {
        // Mock data for now - would fetch from /api/dashboard/upcoming
        const mockBills: UpcomingBill[] = [
          {
            id: '1',
            name: 'Electric Bill',
            amount: 125,
            dueDate: '2024-02-01',
            category: 'Utilities',
            overdue: false,
            daysUntil: 2
          },
          {
            id: '2',
            name: 'Internet',
            amount: 89,
            dueDate: '2024-02-03',
            category: 'Utilities',
            overdue: false,
            daysUntil: 4
          },
          {
            id: '3',
            name: 'Car Payment',
            amount: 350,
            dueDate: '2024-01-28',
            category: 'Transportation',
            overdue: true,
            daysUntil: -1
          }
        ]

        const mockGoals: GoalProgress[] = [
          {
            id: '1',
            name: 'Emergency Fund',
            current: 3750,
            target: 5000,
            targetDate: '2024-06-01',
            priority: 1
          },
          {
            id: '2',
            name: 'Vacation Fund',
            current: 850,
            target: 2000,
            targetDate: '2024-08-01',
            priority: 2
          },
          {
            id: '3',
            name: 'New Car Down Payment',
            current: 2200,
            target: 8000,
            priority: 3
          }
        ]

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 700))
        setBills(mockBills)
        setGoals(mockGoals)
      } catch (error) {
        console.error('Error fetching upcoming items:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUpcomingItems()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getDaysText = (days: number) => {
    if (days < 0) return 'Overdue'
    if (days === 0) return 'Due today'
    if (days === 1) return 'Due tomorrow'
    return `Due in ${days} days`
  }

  const getDaysColor = (days: number, overdue: boolean) => {
    if (overdue) return 'text-red-600'
    if (days <= 1) return 'text-orange-600'
    if (days <= 3) return 'text-yellow-600'
    return 'text-green-600'
  }

  if (loading) {
    return <UpcomingItemsSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Upcoming Bills */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="card-hover card-gradient border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4" data-testid="upcoming-bills">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Upcoming Bills
            </CardTitle>
            <Link href="/bills">
              <Button variant="outline" size="sm" className="text-xs">
                View All
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {bills.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming bills</p>
              </div>
            ) : (
              bills.slice(0, 4).map((bill, index) => (
                <motion.div
                  key={bill.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg gradient-info">
                      <CreditCard className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{bill.name}</p>
                      <p className="text-xs text-muted-foreground">{bill.category}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatCurrency(bill.amount)}</p>
                    <p className={`text-xs ${getDaysColor(bill.daysUntil, bill.overdue)}`}>
                      {getDaysText(bill.daysUntil)}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Goal Progress */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="card-hover card-gradient border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              Goal Progress
            </CardTitle>
            <Link href="/goals">
              <Button variant="outline" size="sm" className="text-xs">
                View All
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {goals.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No active goals</p>
                <Link href="/goals">
                  <Button size="sm" className="mt-3">
                    Create Your First Goal
                  </Button>
                </Link>
              </div>
            ) : (
              goals.slice(0, 3).map((goal, index) => {
                const progress = (goal.current / goal.target) * 100
                const remaining = goal.target - goal.current
                
                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{goal.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          Priority {goal.priority}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatCurrency(goal.current)} / {formatCurrency(goal.target)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(remaining)} remaining
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Progress 
                        value={progress} 
                        className="h-2 bg-gray-200 dark:bg-gray-700"
                      />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {progress.toFixed(1)}% complete
                        </span>
                        {goal.targetDate && (
                          <span className="text-muted-foreground">
                            Target: {formatDate(goal.targetDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

function UpcomingItemsSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i} className="card-gradient border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="h-5 w-32 bg-muted rounded animate-pulse" />
            <div className="h-6 w-16 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-lg animate-pulse" />
                  <div>
                    <div className="h-4 w-24 bg-muted rounded animate-pulse mb-1" />
                    <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-4 w-16 bg-muted rounded animate-pulse mb-1" />
                  <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}