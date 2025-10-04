'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { SummaryCard } from '@/components/ui/summary-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Target, 
  Plus, 
  MoreHorizontal,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  TrendingUp,
  Trophy,
  Zap,
  AlertTriangle,
  CheckCircle,
  PauseCircle,
  Archive,
  Star
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { 
  GoalWithProgress, 
  GoalKPIs, 
  GoalStatus,
  getPriorityLabel,
  getPriorityColor
} from '@/lib/types/goals'
import { AddGoalModal } from '@/components/goals/add-goal-modal'
import { EditGoalModal } from '@/components/goals/edit-goal-modal'
import { ContributeModal } from '@/components/goals/contribute-modal'
import { GoalPlannerTab } from '@/components/goals/goal-planner-tab'
import { GoalActivityTab } from '@/components/goals/goal-activity-tab'

export function GoalsPageV2() {
  const [goals, setGoals] = useState<GoalWithProgress[]>([])
  const [kpis, setKpis] = useState<GoalKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [statusFilter, setStatusFilter] = useState<GoalStatus | 'ALL'>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<number | 'ALL'>('ALL')
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState<string | null>(null)
  const [showContributeModal, setShowContributeModal] = useState<string | null>(null)

  useEffect(() => {
    fetchGoals()
  }, [statusFilter])

  const fetchGoals = async () => {
    try {
      const statusParam = statusFilter !== 'ALL' ? `&status=${statusFilter}` : ''
      const response = await fetch(`/api/goals?kpis=true${statusParam}`)
      const data = await response.json()
      
      if (response.ok) {
        setGoals(data.goals || [])
        setKpis(data.kpis)
      } else {
        toast.error('Failed to load goals')
      }
    } catch (error) {
      console.error('Error fetching goals:', error)
      toast.error('Failed to load goals')
    } finally {
      setLoading(false)
    }
  }

  const handleContribute = async (goalId: string, amount: number, source: any, accountId?: string, note?: string) => {
    try {
      const response = await fetch(`/api/goals/${goalId}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId,
          amount,
          source,
          accountId,
          note
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Show celebration for milestones or completion
        if (data.goalCompleted) {
          toast.success(data.message, {
            duration: 8000,
            className: 'bg-green-50 border-green-200 text-green-800'
          })
        } else if (data.milestones && data.milestones.length > 0) {
          toast.success(data.message, {
            duration: 5000,
            className: 'bg-yellow-50 border-yellow-200 text-yellow-800'
          })
        } else {
          toast.success(data.message)
        }
        
        fetchGoals() // Refresh data
        setShowContributeModal(null)
      } else {
        toast.error(data.error || 'Failed to record contribution')
      }
    } catch (error) {
      console.error('Error contributing to goal:', error)
      toast.error('Failed to record contribution')
    }
  }

  const handleDeleteGoal = async (goalId: string, archive = true) => {
    try {
      const response = await fetch(`/api/goals/${goalId}?archive=${archive}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        fetchGoals()
      } else {
        if (data.hasContributions && !archive) {
          toast.error(data.error + ' Use archive instead.')
        } else {
          toast.error(data.error || 'Failed to delete goal')
        }
      }
    } catch (error) {
      console.error('Error deleting goal:', error)
      toast.error('Failed to delete goal')
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

  const getStatusIcon = (status: GoalStatus) => {
    switch (status) {
      case 'COMPLETED': return CheckCircle
      case 'PAUSED': return PauseCircle
      case 'ARCHIVED': return Archive
      default: return Target
    }
  }

  const getStatusColor = (status: GoalStatus) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-100 border-green-200'
      case 'PAUSED': return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'ARCHIVED': return 'text-gray-600 bg-gray-100 border-gray-200'
      default: return 'text-blue-600 bg-blue-100 border-blue-200'
    }
  }

  // Filter goals
  const filteredGoals = goals.filter(goal => {
    if (statusFilter !== 'ALL' && goal.status !== statusFilter) return false
    if (priorityFilter !== 'ALL' && goal.priority !== priorityFilter) return false
    return true
  })

  if (loading) {
    return (
      <div className="space-y-6">
        {/* KPI Skeletons */}
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Goals</h1>
          <p className="text-muted-foreground">
            Track progress and achieve your financial dreams
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Export Goals
          </Button>
          <Button onClick={() => setShowAddModal(true)} data-testid="add-goal-btn">
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid gap-4 md:grid-cols-4" data-testid="goals-kpis">
          <SummaryCard
            title="Total Saved"
            value={formatCurrency(kpis.totalSaved)}
            subtitle={`Across ${kpis.totalGoals} goals`}
            icon={DollarSign}
            className="border-green-200 bg-green-50 dark:bg-green-950/20"
          />
          <SummaryCard
            title="Overall Progress"
            value={`${kpis.overallProgress.toFixed(1)}%`}
            subtitle="Toward all targets"
            icon={Target}
          />
          <SummaryCard
            title="This Month"
            value={formatCurrency(kpis.thisMonthContributed)}
            subtitle={`of ${formatCurrency(kpis.thisMonthPlanned)} planned`}
            icon={Calendar}
          />
          <SummaryCard
            title="Active Goals"
            value={kpis.activeGoals.toString()}
            subtitle={`${kpis.completedGoals} completed`}
            icon={Trophy}
          />
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="planner">Planner</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Filters */}
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Status:</label>
                  <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="PAUSED">Paused</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Priority:</label>
                  <Select value={priorityFilter.toString()} onValueChange={(value) => setPriorityFilter(value === 'ALL' ? 'ALL' : parseInt(value))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      <SelectItem value="5">⭐⭐⭐⭐⭐ Critical</SelectItem>
                      <SelectItem value="4">⭐⭐⭐⭐ High</SelectItem>
                      <SelectItem value="3">⭐⭐⭐ Medium</SelectItem>
                      <SelectItem value="2">⭐⭐ Low</SelectItem>
                      <SelectItem value="1">⭐ Someday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Goals Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filteredGoals.length === 0 ? (
                <div className="col-span-full">
                  <Card className="bg-white dark:bg-gray-800">
                    <CardContent className="p-12 text-center">
                      <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-medium mb-2">No goals found</h3>
                      <p className="text-muted-foreground text-sm mb-6">
                        {statusFilter !== 'ALL' || priorityFilter !== 'ALL' 
                          ? 'Try adjusting your filters or create a new goal.'
                          : 'Create your first goal to start tracking your progress.'
                        }
                      </p>
                      <Button onClick={() => setShowAddModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Goal
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                filteredGoals.map((goal, index) => {
                  const StatusIcon = getStatusIcon(goal.status)
                  
                  return (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card className="bg-white dark:bg-gray-800 hover:shadow-md transition-all duration-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <StatusIcon className={`h-4 w-4 ${goal.status === 'COMPLETED' ? 'text-green-600' : 'text-blue-600'}`} />
                                <CardTitle className="text-lg leading-tight">{goal.name}</CardTitle>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs px-2 py-1 ${getPriorityColor(goal.priority)}`}>
                                  {'⭐'.repeat(goal.priority)} {getPriorityLabel(goal.priority)}
                                </Badge>
                                <Badge className={`text-xs px-2 py-1 ${getStatusColor(goal.status)}`}>
                                  {goal.status}
                                </Badge>
                              </div>
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setShowEditModal(goal.id)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Goal
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setShowContributeModal(goal.id)}>
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  Contribute
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDeleteGoal(goal.id, true)}>
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteGoal(goal.id, false)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          {/* Progress Ring */}
                          <div className="flex items-center gap-4">
                            <div className="relative w-16 h-16">
                              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="40"
                                  stroke="currentColor"
                                  strokeWidth="8"
                                  fill="none"
                                  className="text-gray-200 dark:text-gray-700"
                                />
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="40"
                                  stroke="currentColor"
                                  strokeWidth="8"
                                  fill="none"
                                  strokeDasharray={`${2 * Math.PI * 40}`}
                                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - goal.progressPercent / 100)}`}
                                  className={goal.status === 'COMPLETED' ? 'text-green-500' : 'text-blue-500'}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm font-bold">
                                  {goal.progressPercent.toFixed(0)}%
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                {formatCurrency(goal.savedAmount)} of {formatCurrency(goal.targetAmount)}
                              </div>
                              <Progress 
                                value={goal.progressPercent} 
                                className="h-2"
                              />
                              {goal.eta && (
                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  ETA: {formatDate(goal.eta)}
                                  {!goal.isOnPace && (
                                    <AlertTriangle className="h-3 w-3 text-yellow-500 ml-1" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Target Date */}
                          {goal.targetDate && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Target: {formatDate(goal.targetDate)}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            <Button 
                              size="sm" 
                              onClick={() => setShowContributeModal(goal.id)}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                              data-testid="add-money-btn"
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Contribute
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setShowEditModal(goal.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })
              )}
            </AnimatePresence>
          </div>
        </TabsContent>

        <TabsContent value="planner">
          <GoalPlannerTab goals={filteredGoals} onRefresh={fetchGoals} />
        </TabsContent>

        <TabsContent value="activity">
          <GoalActivityTab goals={filteredGoals} />
        </TabsContent>

        <TabsContent value="settings">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Goals Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Settings panel coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddGoalModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false)
          fetchGoals()
        }}
      />

      {showEditModal && (
        <EditGoalModal
          isOpen={!!showEditModal}
          onClose={() => setShowEditModal(null)}
          goalId={showEditModal}
          onSuccess={() => {
            setShowEditModal(null)
            fetchGoals()
          }}
        />
      )}

      {showContributeModal && (
        <ContributeModal
          isOpen={!!showContributeModal}
          onClose={() => setShowContributeModal(null)}
          goal={goals.find(g => g.id === showContributeModal)}
          onSuccess={handleContribute}
        />
      )}
    </div>
  )
}
