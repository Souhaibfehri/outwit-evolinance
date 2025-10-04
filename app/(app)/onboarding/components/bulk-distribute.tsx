'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  PieChart, 
  Zap, 
  AlertCircle, 
  CheckCircle,
  RefreshCw,
  X
} from 'lucide-react'
import { createQuickCapture, distributeByHeuristic } from '../actions'
import { toast } from 'sonner'

interface CategoryBreakdown {
  categoryId: string
  categoryName: string
  percentage: number
  amount: number
  color: string
}

interface BulkDistributeProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  daysInactive?: number
}

export function BulkDistribute({ 
  isOpen, 
  onClose, 
  onComplete, 
  daysInactive = 7 
}: BulkDistributeProps) {
  const [step, setStep] = useState(1)
  const [totalAmount, setTotalAmount] = useState(0)
  const [method, setMethod] = useState<'smart' | 'manual'>('smart')
  const [periodDays, setPeriodDays] = useState(daysInactive)
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Default categories for distribution
  const defaultCategories = [
    { id: 'essentials', name: 'Essentials', color: 'bg-blue-500' },
    { id: 'food', name: 'Food & Dining', color: 'bg-green-500' },
    { id: 'transport', name: 'Transportation', color: 'bg-yellow-500' },
    { id: 'lifestyle', name: 'Lifestyle', color: 'bg-purple-500' },
    { id: 'entertainment', name: 'Entertainment', color: 'bg-red-500' },
    { id: 'other', name: 'Other', color: 'bg-gray-500' }
  ]

  // Initialize breakdown when amount changes
  useEffect(() => {
    if (totalAmount > 0 && method === 'smart') {
      const smartDistribution = distributeByHeuristic(totalAmount, defaultCategories.map(c => c.id))
      setBreakdown(defaultCategories.map((cat, index) => ({
        categoryId: cat.id,
        categoryName: cat.name,
        percentage: Math.round((smartDistribution[index]?.amount || 0) / totalAmount * 100),
        amount: smartDistribution[index]?.amount || 0,
        color: cat.color
      })))
    } else if (totalAmount > 0 && method === 'manual') {
      const equalPercentage = Math.round(100 / defaultCategories.length)
      setBreakdown(defaultCategories.map(cat => ({
        categoryId: cat.id,
        categoryName: cat.name,
        percentage: equalPercentage,
        amount: (totalAmount * equalPercentage) / 100,
        color: cat.color
      })))
    }
  }, [totalAmount, method])

  const updateCategoryPercentage = (index: number, percentage: number) => {
    const newBreakdown = [...breakdown]
    newBreakdown[index] = {
      ...newBreakdown[index],
      percentage,
      amount: (totalAmount * percentage) / 100
    }
    setBreakdown(newBreakdown)
  }

  const resetToSmart = () => {
    setMethod('smart')
    const smartDistribution = distributeByHeuristic(totalAmount, defaultCategories.map(c => c.id))
    setBreakdown(defaultCategories.map((cat, index) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      percentage: Math.round((smartDistribution[index]?.amount || 0) / totalAmount * 100),
      amount: smartDistribution[index]?.amount || 0,
      color: cat.color
    })))
  }

  const resetToEqual = () => {
    const equalPercentage = Math.round(100 / defaultCategories.length)
    setBreakdown(defaultCategories.map(cat => ({
      categoryId: cat.id,
      categoryName: cat.name,
      percentage: equalPercentage,
      amount: (totalAmount * equalPercentage) / 100,
      color: cat.color
    })))
  }

  const totalPercentage = breakdown.reduce((sum, cat) => sum + cat.percentage, 0)
  const isValidDistribution = totalPercentage >= 95 && totalPercentage <= 105

  const handleComplete = async () => {
    if (!isValidDistribution) {
      toast.error('Please adjust percentages to total 100%')
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('data', JSON.stringify({
        total: totalAmount,
        method,
        periodFrom: new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString(),
        periodTo: new Date().toISOString(),
        breakdown: breakdown.map(cat => ({
          categoryId: cat.categoryId,
          categoryName: cat.categoryName,
          amount: cat.amount
        }))
      }))

      const result = await createQuickCapture(formData)
      
      if (result.success) {
        toast.success(result.message)
        onComplete()
        onClose()
      } else {
        toast.error(result.error || 'Failed to create quick capture')
      }
    } catch (error) {
      console.error('Error creating quick capture:', error)
      toast.error('Failed to create quick capture')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-white/95 backdrop-blur-xl border border-gray-200/50 dark:bg-gray-900/95 dark:border-gray-800/50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <PieChart className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Quick Bulk Capture
              </DialogTitle>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-gray-600 dark:text-gray-300">
            Been inactive for {daysInactive} days? Quickly log your spending across categories.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Total Amount */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-700 dark:text-gray-300">
                  How much did you spend total in the last {periodDays} days?
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={totalAmount || ''}
                  onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                  className="mt-2"
                />
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {[100, 250, 500, 1000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    onClick={() => setTotalAmount(amount)}
                    className="text-sm"
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Distribution */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  How was the ${totalAmount} distributed?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Adjust the sliders to match your spending pattern
                </p>
              </div>

              {/* Method Toggle */}
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant={method === 'smart' ? 'default' : 'outline'}
                  size="sm"
                  onClick={resetToSmart}
                  className={method === 'smart' ? 'bg-orange-500 text-white' : ''}
                >
                  <Zap className="h-4 w-4 mr-1" />
                  Smart Split
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetToEqual}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Equal Split
                </Button>
              </div>

              {/* Category Sliders */}
              <div className="space-y-4">
                {breakdown.map((category, index) => (
                  <div key={category.categoryId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${category.color}`} />
                        <Label className="text-gray-700 dark:text-gray-300">{category.categoryName}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {category.percentage}%
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          ${category.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <Slider
                      value={[category.percentage]}
                      onValueChange={([value]) => updateCategoryPercentage(index, value)}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>

              {/* Validation */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">Total:</span>
                  <div className="flex items-center space-x-2">
                    <span className={`font-bold ${
                      isValidDistribution 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {totalPercentage}%
                    </span>
                    {isValidDistribution ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
                {!isValidDistribution && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    Total should be between 95-105%. We'll normalize for you.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200/50 dark:border-gray-800/50">
            <div>
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                >
                  Previous
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Step {step} of 2
              </span>
            </div>

            <div>
              {step < 2 ? (
                <Button
                  onClick={() => setStep(2)}
                  disabled={totalAmount <= 0}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={!isValidDistribution || isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Create Transactions
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
