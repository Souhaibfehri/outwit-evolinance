'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckSquare, 
  Square, 
  DollarSign, 
  ArrowRight,
  Zap,
  Target
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { MobileCategoryItem, useMultiSelect } from './mobile-gestures'
import { SelectionToolbar } from '@/components/budget/selection-toolbar'
import { formatCurrency } from '@/lib/budget/calcs'

interface MobileBudgetListProps {
  categories: any[]
  budgetItems: any[]
  onAssignFunds: (categoryId: string) => void
  onMoveFunds: (categoryId: string) => void
  onBulkAssign: (categoryIds: string[], amount: number) => void
  className?: string
}

export function MobileBudgetList({
  categories,
  budgetItems,
  onAssignFunds,
  onMoveFunds,
  onBulkAssign,
  className
}: MobileBudgetListProps) {
  const {
    selectedItems,
    isMultiSelectMode,
    toggleItem,
    selectAll,
    selectNone,
    enterMultiSelectMode,
    exitMultiSelectMode,
    selectedCount
  } = useMultiSelect<any>()

  const [showUnderfundedOnly, setShowUnderfundedOnly] = useState(false)

  // Group categories by status for YNAB-style organization
  const categorizedItems = categories.map(category => {
    const budgetItem = budgetItems.find(item => 
      item.categoryId === category.id
    )
    
    const assigned = parseFloat(budgetItem?.assigned) || 0
    const spent = parseFloat(budgetItem?.spent) || 0
    const available = assigned - spent

    return {
      ...category,
      budgetItem,
      assigned,
      spent,
      available,
      status: available < 0 ? 'overspent' : 
              available < assigned * 0.1 ? 'needs' : 'funded'
    }
  })

  // Filter and sort by YNAB priority: overspent > needs > funded
  const filteredItems = showUnderfundedOnly 
    ? categorizedItems.filter(item => item.status !== 'funded')
    : categorizedItems

  const sortedItems = filteredItems.sort((a, b) => {
    const statusPriority = { overspent: 3, needs: 2, funded: 1 }
    const priorityA = statusPriority[a.status as keyof typeof statusPriority]
    const priorityB = statusPriority[b.status as keyof typeof statusPriority]
    
    if (priorityA !== priorityB) {
      return priorityB - priorityA
    }
    
    // Within same status, sort by available amount (most urgent first)
    if (a.status === 'overspent' || a.status === 'needs') {
      return a.available - b.available
    }
    
    return a.name.localeCompare(b.name)
  })

  // Calculate underfunded amount for selected items
  const selectedUnderfundedAmount = selectedItems.reduce((sum, categoryId) => {
    const item = categorizedItems.find(cat => cat.id === categoryId)
    if (!item || item.status === 'funded') return sum
    
    if (item.status === 'overspent') {
      return sum + Math.abs(item.available)
    }
    
    if (item.status === 'needs' && item.assigned > 0) {
      const targetFunding = item.assigned * 0.9 // 90% funding target
      return sum + Math.max(0, targetFunding - (item.assigned + item.available))
    }
    
    return sum
  }, 0)

  const handleCategoryTap = (categoryId: string) => {
    if (isMultiSelectMode) {
      toggleItem(categoryId)
    } else {
      // Navigate to category details or open assign modal
      onAssignFunds(categoryId)
    }
  }

  const handleBulkAssign = () => {
    if (selectedCount === 0) return
    onBulkAssign(selectedItems, selectedUnderfundedAmount)
    exitMultiSelectMode()
  }

  // Status counts for summary
  const statusCounts = {
    overspent: categorizedItems.filter(item => item.status === 'overspent').length,
    needs: categorizedItems.filter(item => item.status === 'needs').length,
    funded: categorizedItems.filter(item => item.status === 'funded').length
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Status Summary */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="font-medium">{statusCounts.overspent}</span>
              <span className="text-muted-foreground">overspent</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="font-medium">{statusCounts.needs}</span>
              <span className="text-muted-foreground">need funds</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="font-medium">{statusCounts.funded}</span>
              <span className="text-muted-foreground">funded</span>
            </div>
          </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowUnderfundedOnly(!showUnderfundedOnly)}
          className="text-xs"
        >
          {showUnderfundedOnly ? 'Show All' : 'Underfunded Only'}
        </Button>
      </div>

      {/* Multi-Select Header */}
      <AnimatePresence>
        {isMultiSelectMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-sm">
                  {selectedCount} categories selected
                </span>
                {selectedUnderfundedAmount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {formatCurrency(selectedUnderfundedAmount)} needed
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={selectAll} className="text-xs">
                  All
                </Button>
                <Button variant="outline" size="sm" onClick={exitMultiSelectMode} className="text-xs">
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories List */}
      <div className="space-y-2">
        <AnimatePresence>
          {sortedItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <MobileCategoryItem
                category={item}
                budgetItem={item.budgetItem}
                isSelected={selectedItems.includes(item.id)}
                onAssign={onAssignFunds}
                onMoveFunds={onMoveFunds}
                onToggleSelect={(categoryId) => {
                  if (!isMultiSelectMode) {
                    enterMultiSelectMode(categoryId)
                  } else {
                    toggleItem(categoryId)
                  }
                }}
                onTap={handleCategoryTap}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {sortedItems.length === 0 && (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {showUnderfundedOnly ? 'All Categories Funded!' : 'No Categories'}
          </h3>
          <p className="text-muted-foreground">
            {showUnderfundedOnly 
              ? 'Great job! All your categories are properly funded.'
              : 'Create budget categories to start tracking your spending.'
            }
          </p>
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      {isMultiSelectMode && selectedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-medium">
                  {selectedCount} selected
                </Badge>
                {selectedUnderfundedAmount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {formatCurrency(selectedUnderfundedAmount)} needed
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedUnderfundedAmount > 0 && (
                  <Button size="sm" onClick={handleBulkAssign}>
                    <Zap className="h-3 w-3 mr-1" />
                    Fund Selected
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={exitMultiSelectMode}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gesture Hints */}
      {!isMultiSelectMode && (
        <div className="p-3 bg-muted rounded-lg text-center">
          <p className="text-xs text-muted-foreground mb-2">Mobile Gestures:</p>
          <div className="flex justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <ArrowRight className="h-3 w-3 text-blue-600" />
              <span>Swipe right to assign</span>
            </div>
            <div className="flex items-center gap-1">
              <ArrowRight className="h-3 w-3 text-blue-600 rotate-180" />
              <span>Swipe left to move</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckSquare className="h-3 w-3 text-orange-600" />
              <span>Long press to select</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
