'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { 
  CalendarDays, 
  Target, 
  DollarSign, 
  TrendingUp, 
  Zap, 
  Clock, 
  Users, 
  Calculator,
  Star,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { GoalWithProgress, AllocateRTARequest } from '@/lib/types/goals'

interface GoalPlannerTabProps {
  goals: GoalWithProgress[]
  onRefresh: () => void
}

const ALLOCATION_STRATEGIES = [
  {
    id: 'priority' as const,
    name: 'By Priority',
    description: 'Higher priority goals get more funding',
    icon: Star,
    example: 'Critical goals get 5x more than Someday goals'
  },
  {
    id: 'time_to_target' as const,
    name: 'By Time to Target',
    description: 'Goals with closer deadlines get more funding',
    icon: Clock,
    example: 'Goals due in 3 months get more than goals due in 2 years'
  },
  {
    id: 'even_split' as const,
    name: 'Even Split',
    description: 'All active goals get equal amounts',
    icon: Users,
    example: 'Each goal gets exactly the same amount'
  },
  {
    id: 'custom' as const,
    name: 'Custom Allocation',
    description: 'Set specific amounts for each goal',
    icon: Calculator,
    example: 'You decide exactly how much each goal gets'
  }
]

export function GoalPlannerTab({ goals, onRefresh }: GoalPlannerTabProps) {
  const [totalAmount, setTotalAmount] = useState(500)
  const [selectedStrategy, setSelectedStrategy] = useState<AllocateRTARequest['strategy']['type']>('priority')
  const [customAllocations, setCustomAllocations] = useState<Record<string, number>>({})
  const [fundNow, setFundNow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [previewAllocations, setPreviewAllocations] = useState<Record<string, number>>({})

  const activeGoals = goals.filter(g => g.status === 'ACTIVE')

  // Initialize custom allocations
  useEffect(() => {
    if (selectedStrategy === 'custom') {
      const initialAllocations: Record<string, number> = {}
      activeGoals.forEach(goal => {
        initialAllocations[goal.id] = customAllocations[goal.id] || 0
      })
      setCustomAllocations(initialAllocations)
    }
  }, [selectedStrategy, activeGoals])

  // Calculate preview allocations
  useEffect(() => {
    if (selectedStrategy === 'custom') {
      setPreviewAllocations(customAllocations)
    } else {
      calculatePreviewAllocations()
    }
  }, [totalAmount, selectedStrategy, customAllocations, activeGoals])

  const calculatePreviewAllocations = () => {
    if (activeGoals.length === 0 || totalAmount <= 0) {
      setPreviewAllocations({})
      return
    }

    const allocations: Record<string, number> = {}

    switch (selectedStrategy) {
      case 'priority':
        const totalWeight = activeGoals.reduce((sum, goal) => sum + goal.priority, 0)
        activeGoals.forEach(goal => {
          const weight = goal.priority / totalWeight
          allocations[goal.id] = Math.round(totalAmount * weight)
        })
        break

      case 'time_to_target':
        const goalsWithDates = activeGoals.filter(g => g.targetDate)
        const goalsWithoutDates = activeGoals.filter(g => !g.targetDate)
        
        if (goalsWithDates.length > 0) {
          const today = new Date()
          const urgencyScores = goalsWithDates.map(goal => {
            const targetDate = new Date(goal.targetDate!)
            const daysUntilTarget = Math.max(1, Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
            const urgency = 1 / daysUntilTarget
            return { goalId: goal.id, urgency }
          })
          
          const totalUrgency = urgencyScores.reduce((sum, score) => sum + score.urgency, 0)
          const urgencyAmount = totalAmount * 0.8
          
          urgencyScores.forEach(score => {
            const weight = score.urgency / totalUrgency
            allocations[score.goalId] = Math.round(urgencyAmount * weight)
          })
          
          if (goalsWithoutDates.length > 0) {
            const remainingAmount = totalAmount * 0.2
            const evenAmount = Math.round(remainingAmount / goalsWithoutDates.length)
            goalsWithoutDates.forEach(goal => {
              allocations[goal.id] = evenAmount
            })
          }
        } else {
          // No target dates, fall back to even split
          const evenAmount = Math.round(totalAmount / activeGoals.length)
          activeGoals.forEach(goal => {
            allocations[goal.id] = evenAmount
          })
        }
        break

      case 'even_split':
        const evenAmount = Math.round(totalAmount / activeGoals.length)
        activeGoals.forEach(goal => {
          allocations[goal.id] = evenAmount
        })
        break
    }

    setPreviewAllocations(allocations)
  }

  const handleCustomAllocationChange = (goalId: string, amount: number) => {
    setCustomAllocations(prev => ({
      ...prev,
      [goalId]: amount
    }))
  }

  const handleAllocate = async () => {
    if (totalAmount <= 0) {
      toast.error('Please enter a positive amount to allocate')
      return
    }

    if (activeGoals.length === 0) {
      toast.error('No active goals to allocate to')
      return
    }

    setLoading(true)

    try {
      const allocationRequest: AllocateRTARequest = {
        strategy: {
          type: selectedStrategy,
          customAllocations: selectedStrategy === 'custom' ? customAllocations : undefined
        },
        totalAmount,
        fundNow
      }

      const response = await fetch('/api/goals/allocate-rta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allocationRequest)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message, {
          duration: 5000
        })
        onRefresh()
      } else {
        toast.error(data.error || 'Failed to allocate funds')
      }
    } catch (error) {
      console.error('Error allocating funds:', error)
      toast.error('Failed to allocate funds')
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

  const totalCustomAllocation = Object.values(customAllocations).reduce((sum, amount) => sum + amount, 0)
  const customAllocationValid = selectedStrategy !== 'custom' || totalCustomAllocation === totalAmount

  return (
    <div className="space-y-6">
      {/* Strategy Selection */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            Allocate Ready-to-Assign to Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Total Amount */}
          <div>
            <Label htmlFor="total-amount" className="text-base font-medium mb-3 block">
              Amount to Allocate: {formatCurrency(totalAmount)}
            </Label>
            <Slider
              value={[totalAmount]}
              onValueChange={([value]) => setTotalAmount(value)}
              max={5000}
              step={25}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>$0</span>
              <span>$5,000</span>
            </div>
            <div className="mt-2">
              <Input
                type="number"
                min="0"
                step="25"
                value={totalAmount}
                onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                className="w-32"
              />
            </div>
          </div>

          {/* Strategy Selection */}
          <div>
            <Label className="text-base font-medium mb-3 block">
              Allocation Strategy
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ALLOCATION_STRATEGIES.map((strategy) => {
                const IconComponent = strategy.icon
                const isSelected = selectedStrategy === strategy.id
                
                return (
                  <Card 
                    key={strategy.id}
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                    onClick={() => setSelectedStrategy(strategy.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm mb-1">
                            {strategy.name}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            {strategy.description}
                          </div>
                          <div className="text-xs text-gray-500">
                            {strategy.example}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Fund Now Option */}
          <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div>
              <div className="font-medium text-green-900 dark:text-green-100">
                Fund Immediately
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                Create contributions now and reduce Ready-to-Assign
              </div>
            </div>
            <Switch
              checked={fundNow}
              onCheckedChange={setFundNow}
            />
          </div>
        </CardContent>
      </Card>

      {/* Custom Allocation Controls */}
      {selectedStrategy === 'custom' && (
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle>Custom Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeGoals.map((goal) => (
                <div key={goal.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{goal.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {goal.progressPercent.toFixed(1)}% complete • Priority: {'⭐'.repeat(goal.priority)}
                    </div>
                  </div>
                  <div className="w-32">
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={customAllocations[goal.id] || 0}
                        onChange={(e) => handleCustomAllocationChange(goal.id, parseFloat(e.target.value) || 0)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="font-medium">Total Allocated:</div>
                <div className={`font-bold ${customAllocationValid ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalCustomAllocation)} / {formatCurrency(totalAmount)}
                </div>
              </div>
              
              {!customAllocationValid && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  Total allocation must equal {formatCurrency(totalAmount)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Allocation Preview */}
      {Object.keys(previewAllocations).length > 0 && (
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Allocation Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeGoals.map((goal, index) => {
                const allocation = previewAllocations[goal.id] || 0
                if (allocation <= 0) return null

                const newSaved = goal.savedAmount + allocation
                const newProgress = goal.targetAmount > 0 ? Math.min(100, (newSaved / goal.targetAmount) * 100) : 0
                const progressIncrease = newProgress - goal.progressPercent

                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="font-medium text-green-900 dark:text-green-100">
                          {goal.name}
                        </div>
                        <Badge className="text-xs px-2 py-1 text-green-700 bg-green-100 border-green-200">
                          {'⭐'.repeat(goal.priority)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-green-700 dark:text-green-300">Current progress:</span>
                          <span>{goal.progressPercent.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-green-700 dark:text-green-300">After allocation:</span>
                          <span className="font-medium">
                            {newProgress.toFixed(1)}% (+{progressIncrease.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={newProgress} className="h-2" />
                        
                        {goal.targetDate && (
                          <div className="text-xs text-green-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Target: {formatDate(goal.targetDate)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-green-600">
                        +{formatCurrency(allocation)}
                      </div>
                      {newProgress >= 100 && (
                        <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                          <CheckCircle className="h-3 w-3" />
                          Goal Complete!
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}

              <div className="pt-4 border-t">
                <Button 
                  onClick={handleAllocate}
                  disabled={loading || !customAllocationValid || totalAmount <= 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  ) : fundNow ? (
                    <Zap className="h-4 w-4 mr-2" />
                  ) : (
                    <Target className="h-4 w-4 mr-2" />
                  )}
                  {loading 
                    ? 'Processing...' 
                    : fundNow 
                      ? `Fund ${formatCurrency(totalAmount)} Now` 
                      : `Plan ${formatCurrency(totalAmount)} Allocation`
                  }
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {activeGoals.length === 0 && (
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-12 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No Active Goals</h3>
            <p className="text-muted-foreground text-sm">
              Create some active goals to start planning your allocations.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
