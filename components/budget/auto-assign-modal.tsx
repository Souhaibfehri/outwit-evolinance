'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Calculator, 
  Zap, 
  Lock, 
  X,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Clock,
  Target
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { 
  AllocationSuggestion, 
  AutoAssignResult 
} from '@/lib/auto-assign/engine'
import { formatCurrency } from '@/lib/budget/calcs'

interface AutoAssignModalProps {
  isOpen: boolean
  onClose: () => void
  suggestions: AutoAssignResult
  availableRTA: number
  onApprove: (suggestions: AllocationSuggestion[]) => void
  onApproveAndLock: (suggestions: AllocationSuggestion[]) => void
  onReject: () => void
}

export function AutoAssignModal({
  isOpen,
  onClose,
  suggestions,
  availableRTA,
  onApprove,
  onApproveAndLock,
  onReject
}: AutoAssignModalProps) {
  const [adjustedSuggestions, setAdjustedSuggestions] = useState<AllocationSuggestion[]>([])
  const [totalAdjusted, setTotalAdjusted] = useState(0)

  useEffect(() => {
    if (suggestions.suggestions) {
      setAdjustedSuggestions([...suggestions.suggestions])
      setTotalAdjusted(suggestions.totalSuggested)
    }
  }, [suggestions])

  const handleSliderChange = (categoryId: string, value: number[]) => {
    const newAmount = value[0]
    const updated = adjustedSuggestions.map(s => 
      s.categoryId === categoryId 
        ? { ...s, suggestedAmount: newAmount }
        : s
    )
    
    setAdjustedSuggestions(updated)
    setTotalAdjusted(updated.reduce((sum, s) => sum + s.suggestedAmount, 0))
  }

  const handleApprove = () => {
    onApprove(adjustedSuggestions)
    onClose()
    toast.success(`Allocated ${formatCurrency(totalAdjusted)} across ${adjustedSuggestions.length} categories`)
  }

  const handleApproveAndLock = () => {
    const lockedSuggestions = adjustedSuggestions.map(s => ({ ...s, isLocked: true }))
    onApproveAndLock(lockedSuggestions)
    onClose()
    toast.success(`Allocated and locked ${formatCurrency(totalAdjusted)} across ${adjustedSuggestions.length} categories`)
  }

  const handleReject = () => {
    onReject()
    onClose()
    toast.info('Auto-assign suggestions rejected')
  }

  const remainingRTA = availableRTA - totalAdjusted
  const isOverAllocated = remainingRTA < 0

  if (!suggestions.suggestions || suggestions.suggestions.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-orange-600" />
              Auto-Assign Suggestions
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Suggestions Available</h3>
            <p className="text-muted-foreground">
              {availableRTA <= 0 
                ? "You don't have any Ready to Assign funds available."
                : "All your targets are fully funded or no eligible categories found."
              }
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-orange-600" />
            Smart Auto-Assign Suggestions
          </DialogTitle>
          <DialogDescription>
            AI-powered allocation suggestions based on your targets, due dates, and spending patterns
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Strategy Info */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {suggestions.strategy.replace('_', ' ')}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {suggestions.confidence}% confidence
              </span>
            </div>
            <div className="text-sm font-medium">
              {adjustedSuggestions.length} categories
            </div>
          </div>

          {/* RTA Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Available RTA</div>
              <div className="font-semibold text-blue-600">
                {formatCurrency(availableRTA)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Suggested</div>
              <div className="font-semibold text-blue-600">
                {formatCurrency(totalAdjusted)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Remaining</div>
              <div className={`font-semibold ${
                isOverAllocated ? 'text-red-600' : 'text-orange-600'
              }`}>
                {formatCurrency(remainingRTA)}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">RTA Utilization</span>
              <span className="font-medium">
                {((totalAdjusted / availableRTA) * 100).toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={Math.min(100, (totalAdjusted / availableRTA) * 100)} 
              className="h-2"
            />
          </div>

          {/* Suggestions List */}
          <div className="space-y-3">
            <h4 className="font-medium">Allocation Suggestions</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              <AnimatePresence>
                {adjustedSuggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.categoryId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 border rounded-lg space-y-3"
                  >
                    {/* Category Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{suggestion.categoryName}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            suggestion.confidence === 'high' ? 'text-blue-600' :
                            suggestion.confidence === 'medium' ? 'text-yellow-600' : 'text-red-600'
                          }`}
                        >
                          {suggestion.confidence}
                        </Badge>
                      </div>
                      <div className="text-sm font-medium">
                        {formatCurrency(suggestion.suggestedAmount)}
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {suggestion.reason.includes('Due') && <Clock className="h-3 w-3" />}
                      {suggestion.reason.includes('target') && <Target className="h-3 w-3" />}
                      {suggestion.reason.includes('increasing') && <TrendingUp className="h-3 w-3" />}
                      {suggestion.reason}
                    </div>

                    {/* Amount Slider */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span>Adjust Amount</span>
                        <span className="font-medium">
                          {formatCurrency(suggestion.suggestedAmount)}
                        </span>
                      </div>
                      <Slider
                        value={[suggestion.suggestedAmount]}
                        onValueChange={(value) => handleSliderChange(suggestion.categoryId, value)}
                        max={Math.min(availableRTA, suggestion.suggestedAmount * 2)}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>$0</span>
                        <span>{formatCurrency(Math.min(availableRTA, suggestion.suggestedAmount * 2))}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Over-allocation Warning */}
          {isOverAllocated && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Over-allocated by {formatCurrency(Math.abs(remainingRTA))}
                </span>
              </div>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                Reduce some allocations to stay within your available RTA.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleReject} className="flex-1 sm:flex-none">
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button 
              variant="outline" 
              onClick={handleApproveAndLock} 
              disabled={isOverAllocated}
              className="flex-1 sm:flex-none"
            >
              <Lock className="h-4 w-4 mr-2" />
              Approve & Lock
            </Button>
            <Button 
              onClick={handleApprove} 
              disabled={isOverAllocated}
              className="flex-1 sm:flex-none"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
