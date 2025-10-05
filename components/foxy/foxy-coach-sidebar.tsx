'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { 
  Bot, 
  Lightbulb, 
  Zap, 
  Target, 
  DollarSign,
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  PiggyBank,
  CreditCard,
  BarChart3,
  Wallet,
  Search
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { FinancialInsight, QuickAction } from '@/app/api/insights/route'
import Link from 'next/link'

interface FoxyCoachSidebarProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  className?: string
}

export function FoxyCoachSidebar({ isOpen, onOpenChange, className }: FoxyCoachSidebarProps) {
  const [insights, setInsights] = useState<FinancialInsight[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      fetchInsights()
    }
  }, [isOpen])

  const fetchInsights = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/insights')
      const data = await response.json()

      if (data.success) {
        setInsights(data.insights)
        setLastUpdated(new Date().toLocaleTimeString())
      } else {
        toast.error('Failed to load insights')
      }
    } catch (error) {
      console.error('Error fetching insights:', error)
      toast.error('Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAction = async (action: QuickAction, insightId: string) => {
    // Log the interaction
    try {
      await fetch('/api/coach/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'quick_action_clicked',
          data: {
            insightId,
            actionId: action.id,
            actionType: action.type,
            timestamp: new Date().toISOString()
          }
        })
      })
    } catch (error) {
      console.warn('Failed to log coach event:', error)
    }

    // Execute the action
    switch (action.type) {
      case 'navigate':
        window.location.href = action.params?.route || '/dashboard'
        break
      
      case 'fund':
        // Open funding modal or navigate to budget
        if (action.params?.categoryId) {
          window.location.href = `/budget?fund=${action.params.categoryId}&amount=${action.params.amount || ''}`
        } else {
          window.location.href = '/budget'
        }
        break
      
      case 'create_goal':
        window.location.href = `/goals?create=${action.params?.type || 'savings'}`
        break
      
      case 'reassign':
        window.location.href = `/budget?rebalance=${action.params?.month || ''}`
        break
      
      case 'snooze':
        // Handle snooze action
        toast.info('Target snoozed until end of month')
        break
    }

    toast.success(`Action: ${action.label}`)
  }

  const getInsightIcon = (type: FinancialInsight['type']) => {
    switch (type) {
      case 'savings_rate': return PiggyBank
      case 'forecast_drift': return TrendingUp
      case 'category_volatility': return BarChart3
      case 'unassigned_income': return DollarSign
      case 'due_soon_bills': return CreditCard
      case 'goal_milestone': return Target
      case 'overspending_pattern': return AlertTriangle
      default: return Info
    }
  }

  const getSeverityColor = (severity: FinancialInsight['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-600'
      case 'warning': return 'text-yellow-600'
      case 'info': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const getActionIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      PiggyBank, Target, DollarSign, Calendar, TrendingUp, Zap, Wallet, 
      CreditCard, BarChart3, ExternalLink, Search
    }
    return icons[iconName] || ExternalLink
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-orange-600" />
            Foxy Coach
          </SheetTitle>
          <SheetDescription>
            Smart insights and quick actions based on your financial data
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Header Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">
                {insights.length} insights found
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={fetchInsights} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>

          {/* Insights List */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-full mb-1"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : insights.length > 0 ? (
            <div className="space-y-4">
              <AnimatePresence>
                {insights.map((insight, index) => {
                  const IconComponent = getInsightIcon(insight.type)
                  
                  return (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className={`${
                        insight.severity === 'critical' ? 'border-red-200 bg-red-50 dark:bg-red-950/20' :
                        insight.severity === 'warning' ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20' :
                        'border-blue-200 bg-blue-50 dark:bg-blue-950/20'
                      }`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-3">
                            <IconComponent className={`h-5 w-5 mt-0.5 ${getSeverityColor(insight.severity)}`} />
                            <div className="flex-1">
                              <CardTitle className="text-sm font-semibold">
                                {insight.title}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground mt-1">
                                {insight.description}
                              </p>
                            </div>
                            <Badge variant={
                              insight.severity === 'critical' ? 'destructive' :
                              insight.severity === 'warning' ? 'secondary' : 'outline'
                            } className="text-xs">
                              {insight.severity}
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        {insight.quickActions.length > 0 && (
                          <CardContent className="pt-0">
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-muted-foreground mb-2">
                                Quick Actions:
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {insight.quickActions.map(action => {
                                  const ActionIcon = getActionIcon(action.icon || 'ExternalLink')
                                  
                                  return (
                                    <Button
                                      key={action.id}
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleQuickAction(action, insight.id)}
                                      className="text-xs h-7"
                                    >
                                      <ActionIcon className="h-3 w-3 mr-1" />
                                      {action.label}
                                    </Button>
                                  )
                                })}
                              </div>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          ) : (
            // "You're on track" state
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="relative">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <div className="absolute -top-2 -right-2">
                  <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center">
                    <Bot className="h-3 w-3 text-white" />
                  </div>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                You're On Track! 🎉
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Your finances look healthy. Foxy couldn't find any urgent issues that need attention.
              </p>
              
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  Keep up the great work with:
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Budget on track
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Bills managed
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Goals progressing
                  </Badge>
                </div>
              </div>
            </motion.div>
          )}

          {/* Footer */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Last updated: {lastUpdated}</span>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/reports">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Full Reports
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Trigger button for the sidebar
export function FoxyCoachTrigger({ hasNewInsights = false }: { hasNewInsights?: boolean }) {
  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/20"
      >
        <Bot className="h-4 w-4 mr-2" />
        Foxy Coach
      </Button>
      
      {hasNewInsights && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
        />
      )}
    </div>
  )
}
