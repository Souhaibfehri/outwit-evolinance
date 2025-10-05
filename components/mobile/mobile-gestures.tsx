// Mobile Gestures Hook and Components
// Swipe right = assign; swipe left = move funds; long-press = multi-select

'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, PanInfo, useAnimation } from 'framer-motion'

export interface GestureHandlers {
  onSwipeRight?: () => void
  onSwipeLeft?: () => void
  onLongPress?: () => void
  onTap?: () => void
}

export interface SwipeableItemProps {
  children: React.ReactNode
  handlers: GestureHandlers
  disabled?: boolean
  swipeThreshold?: number
  longPressDelay?: number
  className?: string
}

export function SwipeableItem({
  children,
  handlers,
  disabled = false,
  swipeThreshold = 100,
  longPressDelay = 500,
  className = ''
}: SwipeableItemProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLongPressing, setIsLongPressing] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const controls = useAnimation()

  const handlePanStart = useCallback(() => {
    if (disabled) return
    setIsDragging(true)
    
    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      setIsLongPressing(true)
      handlers.onLongPress?.()
      // Haptic feedback on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
    }, longPressDelay)
  }, [disabled, handlers.onLongPress, longPressDelay])

  const handlePanEnd = useCallback((event: any, info: PanInfo) => {
    if (disabled) return
    
    setIsDragging(false)
    setIsLongPressing(false)
    
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }

    const { offset, velocity } = info
    const swipeDistance = Math.abs(offset.x)
    const swipeVelocity = Math.abs(velocity.x)

    // Determine if it's a valid swipe
    const isValidSwipe = swipeDistance > swipeThreshold || swipeVelocity > 500

    if (isValidSwipe) {
      if (offset.x > 0) {
        // Swipe right - assign funds
        handlers.onSwipeRight?.()
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(30)
        }
      } else {
        // Swipe left - move funds
        handlers.onSwipeLeft?.()
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(30)
        }
      }
    } else if (swipeDistance < 10 && !isLongPressing) {
      // Small movement = tap
      handlers.onTap?.()
    }

    // Animate back to center
    controls.start({ x: 0 })
  }, [disabled, handlers, swipeThreshold, isLongPressing, controls])

  const handlePan = useCallback((event: any, info: PanInfo) => {
    if (disabled) return

    // Cancel long press if user starts dragging
    if (Math.abs(info.offset.x) > 10 && longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      setIsLongPressing(false)
    }
  }, [disabled])

  return (
    <motion.div
      className={`relative ${className} ${isDragging ? 'select-none' : ''} ${
        isLongPressing ? 'ring-2 ring-orange-400 ring-opacity-50' : ''
      }`}
      animate={controls}
      onPanStart={handlePanStart}
      onPan={handlePan}
      onPanEnd={handlePanEnd}
      drag="x"
      dragConstraints={{ left: -200, right: 200 }}
      dragElastic={0.2}
      whileDrag={{ scale: 0.98 }}
    >
      {/* Swipe Right Action Hint */}
      <motion.div
        className="absolute left-0 top-0 h-full w-16 bg-green-500 rounded-l-lg flex items-center justify-center opacity-0"
        animate={{
          opacity: isDragging && !isLongPressing ? 0.8 : 0
        }}
      >
        <span className="text-white text-xs font-medium">Assign</span>
      </motion.div>

      {/* Swipe Left Action Hint */}
      <motion.div
        className="absolute right-0 top-0 h-full w-16 bg-blue-500 rounded-r-lg flex items-center justify-center opacity-0"
        animate={{
          opacity: isDragging && !isLongPressing ? 0.8 : 0
        }}
      >
        <span className="text-white text-xs font-medium">Move</span>
      </motion.div>

      {/* Long Press Overlay */}
      {isLongPressing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-orange-400 bg-opacity-20 rounded-lg flex items-center justify-center"
        >
          <span className="text-orange-800 text-sm font-medium">Multi-Select Mode</span>
        </motion.div>
      )}

      {children}
    </motion.div>
  )
}

// Hook for managing multi-select state
export function useMultiSelect<T extends { id: string }>() {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)

  const toggleItem = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      
      // Exit multi-select mode if no items selected
      if (newSet.size === 0) {
        setIsMultiSelectMode(false)
      }
      
      return newSet
    })
  }, [])

  const selectAll = useCallback((items: T[]) => {
    const allIds = new Set(items.map(item => item.id))
    setSelectedItems(allIds)
    setIsMultiSelectMode(true)
  }, [])

  const selectNone = useCallback(() => {
    setSelectedItems(new Set())
    setIsMultiSelectMode(false)
  }, [])

  const enterMultiSelectMode = useCallback((initialItemId?: string) => {
    setIsMultiSelectMode(true)
    if (initialItemId) {
      setSelectedItems(new Set([initialItemId]))
    }
  }, [])

  const exitMultiSelectMode = useCallback(() => {
    setIsMultiSelectMode(false)
    setSelectedItems(new Set())
  }, [])

  return {
    selectedItems: Array.from(selectedItems),
    selectedItemsSet: selectedItems,
    isMultiSelectMode,
    toggleItem,
    selectAll,
    selectNone,
    enterMultiSelectMode,
    exitMultiSelectMode,
    selectedCount: selectedItems.size
  }
}

// Mobile-optimized category item with gestures
interface MobileCategoryItemProps {
  category: any
  budgetItem: any
  isSelected?: boolean
  onAssign: (categoryId: string) => void
  onMoveFunds: (categoryId: string) => void
  onToggleSelect: (categoryId: string) => void
  onTap: (categoryId: string) => void
}

export function MobileCategoryItem({
  category,
  budgetItem,
  isSelected = false,
  onAssign,
  onMoveFunds,
  onToggleSelect,
  onTap
}: MobileCategoryItemProps) {
  const assigned = parseFloat(budgetItem?.assigned) || 0
  const spent = parseFloat(budgetItem?.spent) || 0
  const available = assigned - spent

  const status = available < 0 ? 'overspent' : 
               available < assigned * 0.1 ? 'needs' : 'funded'

  const statusColor = status === 'overspent' ? 'bg-red-500' :
                     status === 'needs' ? 'bg-orange-500' : 'bg-blue-500'

  const handlers: GestureHandlers = {
    onSwipeRight: () => onAssign(category.id),
    onSwipeLeft: () => onMoveFunds(category.id),
    onLongPress: () => onToggleSelect(category.id),
    onTap: () => onTap(category.id)
  }

  return (
    <SwipeableItem handlers={handlers} className="mb-2">
      <div className={`p-4 bg-white dark:bg-gray-800 rounded-lg border transition-all ${
        isSelected ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/20' : 'border-gray-200 dark:border-gray-700'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Status Indicator */}
            <div className={`w-3 h-3 rounded-full ${statusColor}`} />
            
            {/* Category Info */}
            <div>
              <h3 className="font-medium text-sm">{category.name}</h3>
              <p className="text-xs text-muted-foreground">
                {assigned > 0 ? `${formatCurrency(spent)} of ${formatCurrency(assigned)}` : 'Not budgeted'}
              </p>
            </div>
          </div>

          {/* Available Amount */}
          <div className="text-right">
            <p className={`font-semibold text-sm ${
              available < 0 ? 'text-red-600' :
              available < assigned * 0.1 ? 'text-orange-600' : 'text-blue-600'
            }`}>
              {formatCurrency(available)}
            </p>
            <p className="text-xs text-muted-foreground">available</p>
          </div>

          {/* Selection Indicator */}
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center"
            >
              <span className="text-white text-xs font-bold">✓</span>
            </motion.div>
          )}
        </div>
      </div>
    </SwipeableItem>
  )
}

// Helper function
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}
