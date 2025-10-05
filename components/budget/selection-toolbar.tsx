'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarSeparator
} from '@/components/ui/toolbar'
import { 
  CheckSquare, 
  Square, 
  DollarSign, 
  Target,
  Zap,
  X,
  Calculator
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { TargetCalculation, calculateUnderfundedAmount } from '@/lib/targets/engine'
import { formatCurrency } from '@/lib/budget/calcs'

interface SelectionToolbarProps {
  selectedCategoryIds: string[]
  targetCalculations: TargetCalculation[]
  onSelectAll: () => void
  onSelectNone: () => void
  onFundSelected: () => void
  onAutoAssign: () => void
  className?: string
}

export function SelectionToolbar({
  selectedCategoryIds,
  targetCalculations,
  onSelectAll,
  onSelectNone,
  onFundSelected,
  onAutoAssign,
  className
}: SelectionToolbarProps) {
  const [underfundedAmount, setUnderfundedAmount] = useState(0)
  const [selectedUnderfundedCount, setSelectedUnderfundedCount] = useState(0)

  useEffect(() => {
    const amount = calculateUnderfundedAmount(selectedCategoryIds, targetCalculations)
    const count = targetCalculations.filter(
      calc => selectedCategoryIds.includes(calc.categoryId) && calc.isUnderfunded
    ).length
    
    setUnderfundedAmount(amount)
    setSelectedUnderfundedCount(count)
  }, [selectedCategoryIds, targetCalculations])

  const totalCategories = targetCalculations.length
  const selectedCount = selectedCategoryIds.length
  const allSelected = selectedCount === totalCategories
  const someSelected = selectedCount > 0

  if (!someSelected) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 ${className}`}
      >
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
          <div className="flex items-center gap-4">
            {/* Selection Info */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-medium">
                {selectedCount} selected
              </Badge>
              
              {selectedUnderfundedCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <Target className="h-3 w-3 mr-1" />
                  {selectedUnderfundedCount} underfunded
                </Badge>
              )}
            </div>

            {/* Underfunded Amount */}
            {underfundedAmount > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <DollarSign className="h-4 w-4 text-red-600" />
                <span className="font-semibold text-red-600">
                  {formatCurrency(underfundedAmount)} needed
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={allSelected ? onSelectNone : onSelectAll}
                className="text-xs"
              >
                {allSelected ? (
                  <>
                    <Square className="h-3 w-3 mr-1" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-3 w-3 mr-1" />
                    Select All
                  </>
                )}
              </Button>

              {underfundedAmount > 0 && (
                <Button
                  size="sm"
                  onClick={onFundSelected}
                  className="text-xs"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Fund Selected
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={onAutoAssign}
                className="text-xs"
              >
                <Calculator className="h-3 w-3 mr-1" />
                Auto-Assign
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onSelectNone}
                className="text-xs p-1"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Toolbar component (if not already available)
function Toolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {children}
    </div>
  )
}

function ToolbarContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function ToolbarItem({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center">{children}</div>
}

function ToolbarSeparator() {
  return <div className="w-px h-4 bg-border" />
}

export { Toolbar, ToolbarContent, ToolbarItem, ToolbarSeparator }
