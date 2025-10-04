'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { SummaryCard } from '@/components/ui/summary-card'
import { 
  PiggyBank, 
  Users, 
  Plus, 
  Target, 
  TrendingUp,
  AlertTriangle,
  DollarSign,
  ArrowRight,
  Settings,
  ChevronDown,
  ChevronRight,
  Link as LinkIcon
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { 
  MonthSummary, 
  GroupBalance, 
  CategoryBalance,
  FEATURE_BUDGET_V2 
} from '@/lib/types/budget-v2'

interface BudgetV2PageProps {
  month?: string
}

export function BudgetPageV2({ month }: BudgetV2PageProps) {
  const [monthSummary, setMonthSummary] = useState<MonthSummary | null>(null)
  const [groupBalances, setGroupBalances] = useState<GroupBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [editingAssignment, setEditingAssignment] = useState<string | null>(null)

  useEffect(() => {
    fetchBudgetData()
  }, [month])

  const fetchBudgetData = async () => {
    try {
      const currentMonth = month || new Date().toISOString().substring(0, 7)
      
      // Fetch budget summary
      const summaryResponse = await fetch(`/api/budget-v2/summary?month=${currentMonth}`)
      const summaryData = await summaryResponse.json()

      if (summaryResponse.ok) {
        setMonthSummary(summaryData.summary)
        // Would also fetch group balances here
      } else {
        toast.error('Failed to load budget data')
      }
    } catch (error) {
      console.error('Error fetching budget data:', error)
      toast.error('Failed to load budget data')
    } finally {
      setLoading(false)
    }
  }

  const handleFundGroupMinimum = async (groupId: string) => {
    try {
      const response = await fetch('/api/budget-v2/fund-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'fund_minimum',
          groupId,
          month: month || new Date().toISOString().substring(0, 7)
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        fetchBudgetData() // Refresh
      } else {
        toast.error(data.error || 'Failed to fund group')
      }
    } catch (error) {
      console.error('Error funding group:', error)
      toast.error('Failed to fund group')
    }
  }

  const handleUseSavings = async (categoryIds: string[], amount?: number) => {
    try {
      const response = await fetch('/api/budget-v2/fund-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'use_savings',
          categoryIds,
          amount,
          month: month || new Date().toISOString().substring(0, 7)
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        fetchBudgetData() // Refresh
      } else {
        toast.error(data.error || 'Failed to use savings')
      }
    } catch (error) {
      console.error('Error using savings:', error)
      toast.error('Failed to use savings')
    }
  }

  const updateAssignment = async (categoryId: string, newAmount: number) => {
    try {
      const response = await fetch('/api/budget-v2/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign',
          month: month || new Date().toISOString().substring(0, 7),
          assignments: { [categoryId]: newAmount }
        })
      })

      if (response.ok) {
        fetchBudgetData() // Refresh
        setEditingAssignment(null)
        toast.success('Assignment updated')
      } else {
        toast.error('Failed to update assignment')
      }
    } catch (error) {
      console.error('Error updating assignment:', error)
      toast.error('Failed to update assignment')
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

  const toggleGroupExpansion = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  if (!FEATURE_BUDGET_V2) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Budget v2 is not enabled</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
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

  if (!monthSummary) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load budget data</p>
        <Button onClick={fetchBudgetData} className="mt-4">Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget v2</h1>
          <p className="text-muted-foreground">
            Household groups with transactions as source of truth
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Month Settings
          </Button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          title="To-Allocate"
          value={formatCurrency(monthSummary.to_allocate)}
          subtitle="Available to budget"
          icon={PiggyBank}
          className={monthSummary.to_allocate < 0 ? "border-red-200 bg-red-50 dark:bg-red-950/20" : ""}
        />
        <SummaryCard
          title="Total Assigned"
          value={formatCurrency(monthSummary.total_assigned)}
          subtitle="Planned spending"
          icon={Target}
        />
        <SummaryCard
          title="Total Spent"
          value={formatCurrency(monthSummary.total_spent)}
          subtitle="Actual spending"
          icon={DollarSign}
        />
        <SummaryCard
          title="Net Position"
          value={formatCurrency(monthSummary.total_inflows - monthSummary.total_spent)}
          subtitle="Income - Spending"
          icon={TrendingUp}
        />
      </div>

      {/* Quick Actions */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Target className="h-4 w-4 mr-2" />
              Fund All Minimums
            </Button>
            <Button size="sm" variant="outline">
              <PiggyBank className="h-4 w-4 mr-2" />
              Distribute TA
            </Button>
            <Button size="sm" variant="outline">
              <ArrowRight className="h-4 w-4 mr-2" />
              Use Savings
            </Button>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Group
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Overspends Alert */}
      {monthSummary.overspends.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="font-medium text-red-900 dark:text-red-100">
                    {monthSummary.overspends.length} categories overspent
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300">
                    Total overspend: {formatCurrency(
                      monthSummary.overspends.reduce((sum, cat) => sum + Math.abs(cat.available), 0)
                    )}
                  </div>
                </div>
              </div>
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                Cover from TA
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Groups Display */}
      <div className="space-y-4">
        {groupBalances.map((group) => (
          <Card key={group.group_id} className="bg-white dark:bg-gray-800">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
              onClick={() => toggleGroupExpansion(group.group_id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {expandedGroups.has(group.group_id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-orange-600" />
                    <CardTitle className="text-lg">{group.group_name}</CardTitle>
                    {group.group_type === 'person' && (
                      <Badge variant="outline" className="text-xs">Person</Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <div className="font-medium">Assigned: {formatCurrency(group.assigned)}</div>
                    <div className="text-gray-500">Spent: {formatCurrency(group.spent)}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${group.available >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Available: {formatCurrency(group.available)}
                    </div>
                    {group.shortfall > 0 && (
                      <div className="text-red-600 text-xs">
                        Shortfall: {formatCurrency(group.shortfall)}
                      </div>
                    )}
                  </div>
                  
                  {group.shortfall > 0 && (
                    <Button 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleFundGroupMinimum(group.group_id)
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Fund Minimum
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <AnimatePresence>
              {expandedGroups.has(group.group_id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {group.categories.map((category) => (
                        <div 
                          key={category.category_id}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">Category Name</h4>
                              <Badge variant="outline" className="text-xs">
                                <LinkIcon className="h-3 w-3 mr-1" />
                                2 bills
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <span>Assigned: {formatCurrency(category.assigned)}</span>
                              <span>Spent: {formatCurrency(category.spent)}</span>
                              <span className={category.available >= 0 ? 'text-green-600' : 'text-red-600'}>
                                Available: {formatCurrency(category.available)}
                              </span>
                            </div>
                            {category.assigned > 0 && (
                              <Progress 
                                value={Math.min(100, (category.spent / category.assigned) * 100)}
                                className="w-full h-2 mt-2"
                              />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {editingAssignment === category.category_id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  defaultValue={category.assigned}
                                  className="h-8 w-24 text-sm"
                                  data-category-id={category.category_id}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      updateAssignment(category.category_id, parseFloat(e.currentTarget.value))
                                      setEditingAssignment(null)
                                    } else if (e.key === 'Escape') {
                                      setEditingAssignment(null)
                                    }
                                  }}
                                  autoFocus
                                />
                                <Button 
                                  size="sm" 
                                  onClick={() => {
                                    const input = document.querySelector(`input[data-category-id="${category.category_id}"]`) as HTMLInputElement
                                    if (input) {
                                      updateAssignment(category.category_id, parseFloat(input.value))
                                    }
                                    setEditingAssignment(null)
                                  }}
                                >
                                  Save
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingAssignment(category.category_id)}
                              >
                                {formatCurrency(category.assigned)}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        ))}
      </div>
    </div>
  )
}
