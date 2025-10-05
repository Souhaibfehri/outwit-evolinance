'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { 
  AlertTriangle, 
  ArrowRight, 
  TrendingDown,
  TrendingUp,
  CheckCircle,
  X,
  Zap,
  Calendar,
  BarChart3
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { 
  RebalanceResult, 
  RebalanceMove, 
  DonorCategory,
  OverspentCategory,
  AlternativeOption
} from '@/lib/rebalance/engine'
import { formatCurrency } from '@/lib/budget/calcs'

interface CoverOverspendingDrawerProps {
  isOpen: boolean
  onClose: () => void
  rebalanceResult: RebalanceResult
  onApplyMoves: (moves: RebalanceMove[]) => void
  onPlanNextMonthReduction: (amount: number, categories: OverspentCategory[]) => void
}

export function CoverOverspendingDrawer({
  isOpen,
  onClose,
  rebalanceResult,
  onApplyMoves,
  onPlanNextMonthReduction
}: CoverOverspendingDrawerProps) {
  const [selectedMoves, setSelectedMoves] = useState<RebalanceMove[]>([])
  const [showAlternatives, setShowAlternatives] = useState(false)

  useEffect(() => {
    if (rebalanceResult.suggestedMoves) {
      setSelectedMoves([...rebalanceResult.suggestedMoves])
    }
  }, [rebalanceResult])

  const handleToggleMove = (moveIndex: number) => {
    setSelectedMoves(prev => {
      const updated = [...prev]
      if (updated[moveIndex]) {
        updated.splice(moveIndex, 1)
      } else {
        updated.push(rebalanceResult.suggestedMoves[moveIndex])
      }
      return updated
    })
  }

  const handleApplyMoves = () => {
    if (selectedMoves.length === 0) {
      toast.error('No moves selected')
      return
    }

    onApplyMoves(selectedMoves)
    onClose()
    
    const totalAmount = selectedMoves.reduce((sum, move) => sum + move.amount, 0)
    toast.success(`Successfully moved ${formatCurrency(totalAmount)} to cover overspending`)
  }

  const handlePlanReduction = () => {
    onPlanNextMonthReduction(rebalanceResult.totalUncovered, rebalanceResult.overspentCategories)
    onClose()
    toast.info('Next month reduction planned')
  }

  const selectedTotal = selectedMoves.reduce((sum, move) => sum + move.amount, 0)
  const totalOverspent = rebalanceResult.overspentCategories.reduce((sum, cat) => sum + cat.overspent, 0)
  const coveragePercentage = totalOverspent > 0 ? (selectedTotal / totalOverspent) * 100 : 0

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Cover Overspending
          </SheetTitle>
          <SheetDescription>
            Smart rebalancing suggestions to cover overspent categories
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Overspending Summary */}
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-red-800 dark:text-red-200">
                Overspent Categories
              </h3>
              <Badge variant="destructive">
                {formatCurrency(totalOverspent)} over
              </Badge>
            </div>
            <div className="space-y-2">
              {rebalanceResult.overspentCategories.map(category => (
                <div key={category.categoryId} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{category.categoryName}</span>
                  <span className="text-red-600 font-semibold">
                    -{formatCurrency(category.overspent)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Coverage Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Coverage Progress</span>
              <span className="text-sm font-semibold">
                {coveragePercentage.toFixed(1)}%
              </span>
            </div>
            <Progress value={coveragePercentage} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Covered: {formatCurrency(selectedTotal)}</span>
              <span>Remaining: {formatCurrency(Math.max(0, totalOverspent - selectedTotal))}</span>
            </div>
          </div>

          {/* Suggested Moves */}
          {rebalanceResult.suggestedMoves.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-semibold">Suggested Fund Moves</h3>
              <div className="space-y-2">
                <AnimatePresence>
                  {rebalanceResult.suggestedMoves.map((move, index) => (
                    <motion.div
                      key={`${move.fromCategoryId}-${move.toCategoryId}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedMoves.includes(move) 
                          ? 'border-orange-300 bg-orange-50 dark:bg-orange-950/20' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleToggleMove(index)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className={`h-4 w-4 ${
                            selectedMoves.includes(move) ? 'text-orange-600' : 'text-gray-400'
                          }`} />
                          <span className="font-medium text-sm">
                            {formatCurrency(move.amount)}
                          </span>
                          <Badge variant="outline" className={`text-xs ${
                            move.impact === 'low' ? 'text-blue-600' :
                            move.impact === 'medium' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {move.impact} impact
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <span className="truncate">{move.fromCategoryName}</span>
                        <ArrowRight className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{move.toCategoryName}</span>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">{move.reason}</p>
                      
                      {/* Future Impact Sparkline */}
                      {move.futureImpact && (
                        <div className="mt-2 pt-2 border-t">
                          <div className="flex items-center gap-2 mb-1">
                            <BarChart3 className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Future Impact</span>
                          </div>
                          <div className="flex items-center gap-1 h-4">
                            {move.futureImpact.sparklineData.slice(0, 6).map((value, i) => (
                              <div
                                key={i}
                                className={`flex-1 rounded-sm ${
                                  value < 0 ? 'bg-red-300' : 
                                  value > 0 ? 'bg-green-300' : 'bg-gray-200'
                                }`}
                                style={{ 
                                  height: `${Math.max(2, Math.abs(value) / 100 * 16)}px` 
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Donor Categories Available</h3>
              <p className="text-muted-foreground mb-4">
                No categories have sufficient flexible funds to cover the overspending.
              </p>
              <Button variant="outline" onClick={() => setShowAlternatives(true)}>
                View Alternative Options
              </Button>
            </div>
          )}

          {/* Alternative Options */}
          {(showAlternatives || rebalanceResult.suggestedMoves.length === 0) && 
           rebalanceResult.alternativeOptions.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Alternative Options</h3>
              <div className="space-y-3">
                {rebalanceResult.alternativeOptions.map((option, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{option.description}</h4>
                      <Badge variant="outline" className="text-xs">
                        {formatCurrency(option.amount)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="font-medium text-blue-600 mb-1">Pros:</div>
                        <ul className="space-y-1">
                          {option.pros.map((pro, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <CheckCircle className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                              <span>{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="font-medium text-red-600 mb-1">Cons:</div>
                        <ul className="space-y-1">
                          {option.cons.map((con, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <X className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                              <span>{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    {option.type === 'next_month_reduction' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePlanReduction}
                        className="w-full mt-3"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Plan Next Month Reduction
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
            Cancel
          </Button>
          
          {selectedMoves.length > 0 && (
            <Button onClick={handleApplyMoves} className="flex-1 sm:flex-none">
              <Zap className="h-4 w-4 mr-2" />
              Apply {selectedMoves.length} Moves
            </Button>
          )}
          
          {rebalanceResult.totalUncovered > 0 && (
            <Button 
              variant="outline" 
              onClick={() => setShowAlternatives(!showAlternatives)}
              className="flex-1 sm:flex-none"
            >
              {showAlternatives ? 'Hide' : 'Show'} Alternatives
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
