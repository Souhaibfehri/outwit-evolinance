'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppCard, MetricCard } from '@/components/ui/app-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Toggle } from '@/components/ui/toggle'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { InfoPill } from '@/components/ui/info-pill'
import { RolloverTooltip } from '@/components/foxy/jargon-tooltip'
import { 
  DollarSign, 
  Plus, 
  TrendingUp,
  AlertCircle,
  Settings,
  MoreHorizontal,
  Star,
  Home,
  ShoppingCart,
  Car,
  Coffee,
  Target,
  PiggyBank,
  Zap,
  Eye,
  EyeOff,
  ArrowUpDown,
  List,
  Grid3X3,
  Edit,
  Trash2,
  MoveHorizontal,
  Download
} from 'lucide-react'
import Link from 'next/link'
import { exportTransactionsCSV } from '@/lib/csv-enhanced'
import {
  calcMonthSummary,
  sortCategories,
  groupCategories,
  formatCurrency,
  type CategoryBudgetItem,
  type MonthSummary
} from '@/lib/budget/calcs'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { CatchUpWizard } from '@/components/catchup/catch-up-wizard'

export interface BudgetPageClientProps {
  initialData: {
    currentMonth: string
    monthSummary: MonthSummary
    categoryGroups: any[]
    categories: any[]
    budgetItems: any[]
    budgetMonth: any
  }
}

export function BudgetPageClient({ initialData }: BudgetPageClientProps) {
  const [data, setData] = useState(initialData)
  const [sortBy, setSortBy] = useState<'priority' | 'assigned' | 'spent' | 'alphabetical'>('priority')
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped')
  const [showCatchUpWizard, setShowCatchUpWizard] = useState(false)
  const [editingAmount, setEditingAmount] = useState<string | null>(null)

  // Load view preferences
  useEffect(() => {
    const savedSort = localStorage.getItem('budget-sort-by') as any
    const savedView = localStorage.getItem('budget-view-mode') as any
    if (savedSort) setSortBy(savedSort)
    if (savedView) setViewMode(savedView)
  }, [])

  // Save view preferences
  useEffect(() => {
    localStorage.setItem('budget-sort-by', sortBy)
    localStorage.setItem('budget-view-mode', viewMode)
  }, [sortBy, viewMode])

  const handleSetAmount = async (categoryId: string, newAmount: number) => {
    // In production, would call server action
    toast.success('Amount updated')
    setEditingAmount(null)
  }

  const handleToggleRollover = async (categoryId: string, rollover: boolean) => {
    // In production, would call server action
    toast.success(`Rollover ${rollover ? 'enabled' : 'disabled'}`)
  }

  const handleCreateDefaultCategories = async () => {
    try {
      const response = await fetch('/api/budget/seed-defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        toast.success('Default categories created! Refreshing page...')
        // Refresh the page to show new categories
        window.location.reload()
      } else {
        throw new Error('Failed to create categories')
      }
    } catch (error) {
      console.error('Error creating default categories:', error)
      toast.error('Failed to create default categories. Please try again.')
    }
  }

  const handleAddCustomCategory = () => {
    // Navigate to groups page where category management is handled
    window.location.href = '/budget/groups'
  }

  const handleCatchUpComplete = async (catchUpData: any) => {
    try {
      // Create estimated transactions based on catch-up data
      const response = await fetch('/api/transactions/quick-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'catch-up',
          data: catchUpData
        })
      })
      
      if (response.ok) {
        toast.success(`Created ${catchUpData.categories.filter((c: any) => c.amount > 0).length} estimated transactions!`)
        // Refresh page to show updated data
        window.location.reload()
      } else {
        throw new Error('Failed to create catch-up transactions')
      }
    } catch (error) {
      console.error('Error completing catch-up:', error)
      toast.error('Failed to create catch-up transactions. Please try again.')
    }
  }

  // Process categories for display
  const sortedCategories = useMemo(() => {
    const categoryItems: CategoryBudgetItem[] = data.categories.map((category: any) => {
      const budgetItem = data.budgetItems.find((item: any) => 
        item.categoryId === category.id && item.month === data.currentMonth
      )
      
      return {
        categoryId: category.id,
        categoryName: category.name,
        assigned: budgetItem ? parseFloat(budgetItem.assigned) : 0,
        spent: budgetItem ? parseFloat(budgetItem.spent) : 0,
        leftoverFromPrev: budgetItem ? parseFloat(budgetItem.leftoverFromPrev) : 0,
        priority: category.priority || 3,
        rollover: category.rollover || false,
        groupId: category.groupId,
        groupName: category.groupName || 'Other'
      }
    })

    return sortCategories(categoryItems, sortBy)
  }, [data, sortBy])

  const groupedCategories = useMemo(() => {
    return groupCategories(sortedCategories)
  }, [sortedCategories])

  const hasDefaultCategories = data.categoryGroups.some((g: any) => g.isDefault)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between" data-coach-anchor="budget-header">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Budget
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Zero-based budgeting made simple
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="card-hover"
            onClick={() => window.location.href = '/budget/groups'}
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage Groups
          </Button>
          <Button variant="outline" size="sm" className="card-hover" onClick={() => exportTransactionsCSV([])}>
            <Download className="h-4 w-4 mr-2" />
            Export Budget
          </Button>
          <Button className="btn-primary rounded-xl">
            <Plus className="h-4 w-4 mr-2" />
            New Category
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div data-coach-anchor="ready-to-assign">
          <MetricCard
            title="Ready to Assign"
            value={formatCurrency(data.monthSummary.readyToAssign)}
            subtitle={data.monthSummary.isOverAssigned ? "Over-assigned!" : "Available to budget"}
            icon={DollarSign}
            status={data.monthSummary.isOverAssigned ? "danger" : "success"}
          />
        </div>
        <MetricCard
          title="Total Assigned"
          value={formatCurrency(data.monthSummary.totalAssigned)}
          subtitle="This month"
          icon={Target}
          status="info"
        />
        <MetricCard
          title="Total Spent"
          value={formatCurrency(data.monthSummary.totalSpent)}
          subtitle={`${((data.monthSummary.totalSpent / data.monthSummary.totalAssigned) * 100).toFixed(1)}% of assigned`}
          icon={TrendingUp}
          status={data.monthSummary.totalSpent > data.monthSummary.totalAssigned ? "warn" : "success"}
        />
        <MetricCard
          title="Available"
          value={formatCurrency(data.monthSummary.totalAssigned - data.monthSummary.totalSpent)}
          subtitle="Remaining to spend"
          icon={PiggyBank}
          status="info"
        />
      </div>

      {/* Over-assignment Warning */}
      {data.monthSummary.isOverAssigned && (
        <AppCard status="danger" className="border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-200">Budget Over-Assigned</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                You've assigned {formatCurrency(Math.abs(data.monthSummary.readyToAssign))} more than available. 
                Reduce category amounts to balance your budget.
              </p>
            </div>
          </div>
        </AppCard>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Sort by:</label>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="assigned">Amount Assigned</SelectItem>
                <SelectItem value="spent">Amount Spent</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">View:</label>
            <Toggle 
              pressed={viewMode === 'grouped'} 
              onPressedChange={(pressed) => setViewMode(pressed ? 'grouped' : 'flat')}
              className="data-[state=on]:bg-blue-100 data-[state=on]:text-blue-900"
            >
              {viewMode === 'grouped' ? <Grid3X3 className="h-4 w-4" /> : <List className="h-4 w-4" />}
              {viewMode === 'grouped' ? 'Grouped' : 'Flat List'}
            </Toggle>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!hasDefaultCategories && (
            <Button 
              variant="outline" 
              onClick={handleCreateDefaultCategories}
              className="card-hover"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Default Categories
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => setShowCatchUpWizard(true)}
            className="card-hover"
            data-coach-anchor="quick-catch-up-btn"
          >
            <Zap className="h-4 w-4 mr-2" />
            Quick Catch-Up
          </Button>
        </div>
      </div>

      {/* Categories */}
      <AppCard
        title={`Categories (${sortedCategories.length})`}
        subtitle={viewMode === 'grouped' ? 'Organized by groups' : 'Flat list view'}
        icon={Target}
        elevated
      >
        {sortedCategories.length === 0 ? (
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No categories yet</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Create categories to start budgeting your money.
            </p>
            <div className="flex items-center gap-3 justify-center">
              <Button onClick={handleCreateDefaultCategories} variant="outline">
                Create Default Categories
              </Button>
              <Button onClick={handleAddCustomCategory} className="btn-primary rounded-xl">
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Category
              </Button>
            </div>
          </div>
        ) : viewMode === 'grouped' ? (
          <div className="space-y-6">
            {Object.entries(groupedCategories).map(([groupName, categories]) => (
              <motion.div
                key={groupName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                  <Home className="h-4 w-4 text-slate-600" />
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">{groupName}</h3>
                  <Badge variant="outline" className="text-xs">
                    {categories.length} categories
                  </Badge>
                </div>
                
                <div className="space-y-2" data-testid="category-list">
                  {categories.map((category) => (
                    <CategoryRow
                      key={category.categoryId}
                      category={category}
                      isEditing={editingAmount === category.categoryId}
                      onEdit={() => setEditingAmount(category.categoryId)}
                      onCancelEdit={() => setEditingAmount(null)}
                      onSave={(amount) => handleSetAmount(category.categoryId, amount)}
                      onToggleRollover={(rollover) => handleToggleRollover(category.categoryId, rollover)}
                      maxAmount={data.monthSummary.readyToAssign + category.assigned}
                      allowOverAssign={data.budgetMonth?.allowOverAssign || false}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {sortedCategories.map((category) => (
              <CategoryRow
                key={category.categoryId}
                category={category}
                isEditing={editingAmount === category.categoryId}
                onEdit={() => setEditingAmount(category.categoryId)}
                onCancelEdit={() => setEditingAmount(null)}
                onSave={(amount) => handleSetAmount(category.categoryId, amount)}
                onToggleRollover={(rollover) => handleToggleRollover(category.categoryId, rollover)}
                maxAmount={data.monthSummary.readyToAssign + category.assigned}
                allowOverAssign={data.budgetMonth?.allowOverAssign || false}
                showGroup
              />
            ))}
          </div>
        )}
      </AppCard>
    </div>
  )
}

// Category Row Component
interface CategoryRowProps {
  category: CategoryBudgetItem
  isEditing: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onSave: (amount: number) => void
  onToggleRollover: (rollover: boolean) => void
  maxAmount: number
  allowOverAssign: boolean
  showGroup?: boolean
}

function CategoryRow({
  category,
  isEditing,
  onEdit,
  onCancelEdit,
  onSave,
  onToggleRollover,
  maxAmount,
  allowOverAssign,
  showGroup = false
}: CategoryRowProps) {
  const progress = category.assigned > 0 ? Math.min(100, (category.spent / category.assigned) * 100) : 0
  const isOverspent = category.spent > category.assigned
  const remaining = category.assigned - category.spent

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        {/* Priority Stars */}
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-3 w-3 ${
                star <= category.priority 
                  ? 'text-yellow-400 fill-current' 
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Category Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium truncate">{category.categoryName}</h4>
            {showGroup && (
              <Badge variant="outline" className="text-xs">
                {category.groupName}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Spent: {formatCurrency(category.spent)}</span>
            <span className={remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
              Remaining: {formatCurrency(remaining)}
            </span>
          </div>
          
          {category.assigned > 0 && (
            <div className="mt-2">
              <Progress 
                value={progress} 
                className={`h-2 ${isOverspent ? 'bg-red-100 dark:bg-red-900' : ''}`}
              />
            </div>
          )}
        </div>

        {/* Rollover Toggle */}
        <div className="flex items-center gap-2">
          <Switch
            checked={category.rollover}
            onCheckedChange={onToggleRollover}
            className="data-[state=checked]:bg-blue-600"
          />
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">
              <RolloverTooltip>Rollover</RolloverTooltip>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4 shrink-0">
        {/* Amount Input/Display */}
        <div className="w-28 text-right">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                defaultValue={category.assigned}
                className="w-20 px-2 py-1 text-sm border rounded"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = parseFloat((e.target as HTMLInputElement).value) || 0
                    onSave(value)
                  } else if (e.key === 'Escape') {
                    onCancelEdit()
                  }
                }}
                autoFocus
              />
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="text-right p-2 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <span className="font-mono">{formatCurrency(category.assigned)}</span>
            </Button>
          )}
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Edit className="h-4 w-4 mr-2" />
              Edit Category
            </DropdownMenuItem>
            <DropdownMenuItem>
              <MoveHorizontal className="h-4 w-4 mr-2" />
              Move to Group
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Category
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  )
}

