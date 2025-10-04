'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { InfoHint, FINANCIAL_EXPLANATIONS } from '@/components/ui/info-hint'
import { AmountInput } from '@/components/budget/amount-input'
// import { DragList } from '@/components/budget/drag-list' // TODO: Implement drag and drop
import { 
  MoreHorizontal,
  GripVertical,
  Star,
  ArrowUp,
  ArrowDown,
  Edit,
  Check,
  X,
  Plus
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface CategoryBudgetItem {
  id: string
  name: string
  groupId?: string
  groupName: string
  assigned: number
  spent: number
  remaining: number
  priority: number
  rollover: boolean
  sortOrder: number
  leftoverFromPrev?: number
}

interface CategoryGroup {
  id: string
  name: string
  icon: string
  sortOrder: number
  isDefault: boolean
  categories: CategoryBudgetItem[]
}

interface BudgetCategoryListProps {
  categoryGroups: CategoryGroup[]
  readyToAssign: number
  allowOverAssign: boolean
  sortBy: 'priority' | 'assigned' | 'name'
  viewMode: 'grouped' | 'flat'
  onAssignAmount: (categoryId: string, amount: number) => Promise<void>
  onToggleRollover: (categoryId: string, rollover: boolean) => void
  onReorderCategories: (categories: Array<{ categoryId: string; groupId?: string; sortOrder: number }>) => void
  onReorderGroups: (groups: Array<{ groupId: string; sortOrder: number }>) => void
}

export function BudgetCategoryList({
  categoryGroups,
  readyToAssign,
  allowOverAssign,
  sortBy,
  viewMode,
  onAssignAmount,
  onToggleRollover,
  onReorderCategories,
  onReorderGroups
}: BudgetCategoryListProps) {
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editingAmount, setEditingAmount] = useState<number>(0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const calcProgress = (spent: number, assigned: number) => {
    if (assigned === 0) return 0
    return Math.min((spent / assigned) * 100, 100)
  }

  // Sort categories within groups
  const sortedGroups = useMemo(() => {
    return categoryGroups.map(group => ({
      ...group,
      categories: [...group.categories].sort((a, b) => {
        switch (sortBy) {
          case 'priority':
            return a.priority - b.priority
          case 'assigned':
            return b.assigned - a.assigned
          case 'name':
            return a.name.localeCompare(b.name)
          default:
            return a.sortOrder - b.sortOrder
        }
      })
    })).sort((a, b) => a.sortOrder - b.sortOrder)
  }, [categoryGroups, sortBy])

  // Flatten categories for flat view
  const flatCategories = useMemo(() => {
    return sortedGroups.flatMap(group => 
      group.categories.map(cat => ({ ...cat, groupName: group.name }))
    )
  }, [sortedGroups])

  const handleEditCategory = (category: CategoryBudgetItem) => {
    setEditingCategory(category.id)
    setEditingAmount(category.assigned)
  }

  const handleSaveEdit = async (categoryId: string) => {
    try {
      await onAssignAmount(categoryId, editingAmount)
      setEditingCategory(null)
    } catch (error) {
      console.error('Error saving assignment:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditingCategory(null)
    setEditingAmount(0)
  }

  const canAssign = (requestedAmount: number, currentAssigned: number) => {
    const difference = requestedAmount - currentAssigned
    return allowOverAssign || (readyToAssign >= difference)
  }

  if (viewMode === 'flat') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {flatCategories.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                isEditing={editingCategory === category.id}
                editingAmount={editingAmount}
                onEditingAmountChange={setEditingAmount}
                onEdit={() => handleEditCategory(category)}
                onSave={() => handleSaveEdit(category.id)}
                onCancel={handleCancelEdit}
                onToggleRollover={(rollover) => onToggleRollover(category.id, rollover)}
                canAssign={(amount) => canAssign(amount, category.assigned)}
                showGroup
              />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {sortedGroups.map((group) => (
        <Card key={group.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{group.icon}</span>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {group.name}
                    {group.isDefault && (
                      <Badge variant="secondary" className="text-xs">System</Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {group.categories.length} categories • 
                    {formatCurrency(group.categories.reduce((sum, cat) => sum + cat.assigned, 0))} assigned
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Category
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit Group</DropdownMenuItem>
                    <DropdownMenuItem>Reorder Categories</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {!group.isDefault && (
                      <DropdownMenuItem className="text-red-600">
                        Delete Group
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {group.categories.map((category) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  isEditing={editingCategory === category.id}
                  editingAmount={editingAmount}
                  onEditingAmountChange={setEditingAmount}
                  onEdit={() => handleEditCategory(category)}
                  onSave={() => handleSaveEdit(category.id)}
                  onCancel={handleCancelEdit}
                  onToggleRollover={(rollover) => onToggleRollover(category.id, rollover)}
                  canAssign={(amount) => canAssign(amount, category.assigned)}
                />
              ))}
              
              {group.categories.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No categories in this group</p>
                  <Button variant="ghost" size="sm" className="mt-2">
                    <Plus className="h-4 w-4 mr-1" />
                    Add First Category
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

interface CategoryRowProps {
  category: CategoryBudgetItem
  isEditing: boolean
  editingAmount: number
  onEditingAmountChange: (amount: number) => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onToggleRollover: (rollover: boolean) => void
  canAssign: (amount: number) => boolean
  showGroup?: boolean
}

function CategoryRow({
  category,
  isEditing,
  editingAmount,
  onEditingAmountChange,
  onEdit,
  onSave,
  onCancel,
  onToggleRollover,
  canAssign,
  showGroup = false
}: CategoryRowProps) {
  const progress = calcProgress(category.spent, category.assigned)
  const isOverspent = category.spent > category.assigned
  const remaining = category.assigned - category.spent

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  return (
    <div className={cn(
      'flex items-center justify-between p-4 rounded-lg border transition-colors',
      isOverspent ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800' : 'bg-muted/50 hover:bg-muted'
    )}>
      {/* Left side - Category info */}
      <div className="flex items-center gap-4 flex-1">
        {/* Drag handle */}
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
        
        {/* Priority stars */}
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                'h-3 w-3',
                star <= category.priority 
                  ? 'text-yellow-400 fill-current' 
                  : 'text-muted-foreground'
              )}
            />
          ))}
        </div>

        {/* Category name and details */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{category.name}</h4>
            {showGroup && (
              <Badge variant="outline" className="text-xs">
                {category.groupName}
              </Badge>
            )}
            {category.rollover && (
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-xs">Rollover</Badge>
                <InfoHint
                  title={FINANCIAL_EXPLANATIONS.rollover.title}
                  content={FINANCIAL_EXPLANATIONS.rollover.content}
                  learnMoreUrl={FINANCIAL_EXPLANATIONS.rollover.learnMoreUrl}
                />
              </div>
            )}
          </div>
          
          {/* Progress bar */}
          <div className="mt-2 space-y-1">
            <Progress 
              value={progress} 
              className={cn(
                'h-2',
                isOverspent && 'bg-red-100 dark:bg-red-900'
              )}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Spent: {formatCurrency(category.spent)}</span>
              <span className={cn(
                'font-medium',
                remaining < 0 ? 'text-red-600' : remaining === 0 ? 'text-green-600' : 'text-blue-600'
              )}>
                {remaining < 0 ? 'Over' : 'Left'}: {formatCurrency(Math.abs(remaining))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Assignment controls */}
      <div className="flex items-center gap-3">
        {/* Rollover toggle */}
        <div className="flex items-center gap-2">
          <Switch
            checked={category.rollover}
            onCheckedChange={onToggleRollover}
            size="sm"
          />
          <span className="text-xs text-muted-foreground">Roll</span>
        </div>

        {/* Assignment amount */}
        <div className="w-32">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <AmountInput
                value={editingAmount}
                onChange={onEditingAmountChange}
                className="h-8 text-sm"
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={onSave}
                disabled={!canAssign(editingAmount)}
                className="h-8 w-8 p-0"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onCancel}
                className="h-8 w-8 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              onClick={onEdit}
              className="h-8 px-3 justify-start font-mono text-sm"
            >
              {formatCurrency(category.assigned)}
            </Button>
          )}
        </div>

        {/* More options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Amount
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ArrowUp className="h-4 w-4 mr-2" />
              Move Up
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ArrowDown className="h-4 w-4 mr-2" />
              Move Down
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              Delete Category
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

function calcProgress(spent: number, assigned: number): number {
  if (assigned === 0) return 0
  return Math.min((spent / assigned) * 100, 100)
}
