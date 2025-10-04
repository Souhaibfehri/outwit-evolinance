'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { 
  Clock, 
  DollarSign, 
  PieChart, 
  CheckCircle, 
  AlertCircle,
  Zap,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface CatchUpData {
  daysAway: number
  totalSpent: number
  categories: Array<{
    name: string
    percentage: number
    amount: number
    color: string
  }>
}

const defaultCategories = [
  { name: 'Essentials', percentage: 30, amount: 0, color: 'bg-blue-500' },
  { name: 'Groceries', percentage: 25, amount: 0, color: 'bg-green-500' },
  { name: 'Transport', percentage: 15, amount: 0, color: 'bg-yellow-500' },
  { name: 'Dining Out', percentage: 15, amount: 0, color: 'bg-red-500' },
  { name: 'Shopping', percentage: 10, amount: 0, color: 'bg-purple-500' },
  { name: 'Misc', percentage: 5, amount: 0, color: 'bg-gray-500' }
]

interface CatchUpWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: CatchUpData) => void
  daysInactive?: number
}

export function CatchUpWizard({ 
  isOpen, 
  onClose, 
  onComplete, 
  daysInactive = 7 
}: CatchUpWizardProps) {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<CatchUpData>({
    daysAway: daysInactive,
    totalSpent: 0,
    categories: defaultCategories
  })

  const updateCategoryPercentage = (index: number, percentage: number) => {
    const newCategories = [...data.categories]
    newCategories[index] = {
      ...newCategories[index],
      percentage,
      amount: (data.totalSpent * percentage) / 100
    }
    setData({ ...data, categories: newCategories })
  }

  const updateTotalSpent = (total: number) => {
    const newCategories = data.categories.map(cat => ({
      ...cat,
      amount: (total * cat.percentage) / 100
    }))
    setData({ ...data, totalSpent: total, categories: newCategories })
  }

  const totalPercentage = data.categories.reduce((sum, cat) => sum + cat.percentage, 0)
  const isValidPercentage = totalPercentage >= 95 && totalPercentage <= 105

  const handleComplete = () => {
    onComplete(data)
    onClose()
    setStep(1) // Reset for next time
  }

  const useLastMonth = () => {
    // Simulate using last month's actuals
    const adjustedCategories = data.categories.map(cat => ({
      ...cat,
      percentage: Math.random() * 30 + 10 // Random between 10-40%
    }))
    
    // Normalize to 100%
    const total = adjustedCategories.reduce((sum, cat) => sum + cat.percentage, 0)
    const normalizedCategories = adjustedCategories.map(cat => ({
      ...cat,
      percentage: Math.round((cat.percentage / total) * 100),
      amount: (data.totalSpent * cat.percentage) / total
    }))
    
    setData({ ...data, categories: normalizedCategories })
  }

  const useEssentialsOnly = () => {
    const essentialsCategories = data.categories.map(cat => ({
      ...cat,
      percentage: ['Essentials', 'Groceries', 'Transport'].includes(cat.name) 
        ? Math.round(100 / 3) 
        : 0,
      amount: ['Essentials', 'Groceries', 'Transport'].includes(cat.name) 
        ? (data.totalSpent * 100 / 3) / 100 
        : 0
    }))
    
    setData({ ...data, categories: essentialsCategories })
  }

  const clearAll = () => {
    const clearedCategories = data.categories.map(cat => ({
      ...cat,
      percentage: 0,
      amount: 0
    }))
    setData({ ...data, categories: clearedCategories })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-white/95 backdrop-blur-xl border border-gray-200/50 dark:bg-gray-900/95 dark:border-gray-800/50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-teal-600" />
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Quick Catch-Up
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
            Quickly log your spending for the time you were away
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-2">
            {[1, 2, 3, 4].map((stepNum) => (
              <div
                key={stepNum}
                className={`h-2 w-8 rounded-full transition-colors ${
                  stepNum < step 
                    ? 'bg-green-500' 
                    : stepNum === step 
                    ? 'bg-teal-500' 
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Date Range */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    How long were you away?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    We'll help you estimate your spending for this period
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">Days away</Label>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={data.daysAway}
                      onChange={(e) => setData({ ...data, daysAway: parseInt(e.target.value) || 1 })}
                      className="mt-2"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setData({ ...data, daysAway: 7 })}
                      className={data.daysAway === 7 ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : ''}
                    >
                      7 days
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setData({ ...data, daysAway: 14 })}
                      className={data.daysAway === 14 ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : ''}
                    >
                      14 days
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setData({ ...data, daysAway: 30 })}
                      className={data.daysAway === 30 ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : ''}
                    >
                      30 days
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Total Amount */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    How much did you spend total?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Rough estimate for the {data.daysAway} days you were away
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">Total spent</Label>
                    <div className="relative mt-2">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={data.totalSpent || ''}
                        onChange={(e) => updateTotalSpent(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  {/* Quick amount buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    {[100, 200, 500, 1000].map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        onClick={() => updateTotalSpent(amount)}
                        className="text-sm"
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Category Distribution */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    How was it split across categories?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Adjust the percentages to match your spending pattern
                  </p>
                </div>
                
                {/* Quick toggles */}
                <div className="flex items-center justify-center space-x-2">
                  <Button variant="outline" size="sm" onClick={useLastMonth}>
                    Use Last Month
                  </Button>
                  <Button variant="outline" size="sm" onClick={useEssentialsOnly}>
                    Only Essentials
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAll}>
                    Clear
                  </Button>
                </div>
                
                {/* Category sliders */}
                <div className="space-y-4">
                  {data.categories.map((category, index) => (
                    <div key={category.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${category.color}`} />
                          <Label className="text-gray-700 dark:text-gray-300">{category.name}</Label>
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
                
                {/* Total validation */}
                <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">Total:</span>
                    <div className="flex items-center space-x-2">
                      <span className={`font-bold ${
                        isValidPercentage 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {totalPercentage}%
                      </span>
                      {isValidPercentage ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  {!isValidPercentage && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                      Total should be between 95-105%. We'll normalize for you.
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Review your catch-up
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    We'll create {data.categories.filter(c => c.amount > 0).length} estimated transactions
                  </p>
                </div>
                
                <Card className="bg-blue-50/50 dark:bg-blue-900/20">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900 dark:text-white">
                      Transaction Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {data.categories
                      .filter(category => category.amount > 0)
                      .map((category, index) => (
                        <div key={category.name} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${category.color}`} />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {category.name}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            -${category.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    
                    <div className="border-t border-gray-200/50 dark:border-gray-800/50 pt-3">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-gray-900 dark:text-white">Total:</span>
                        <span className="text-gray-900 dark:text-white">
                          -${data.totalSpent.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="bg-yellow-50/50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    <strong>Note:</strong> These will be marked as estimated transactions that you can refine later.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200/50 dark:border-gray-800/50">
            <div>
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Previous
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Step {step} of 4
              </span>
            </div>

            <div>
              {step < 4 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={
                    (step === 2 && data.totalSpent <= 0) ||
                    (step === 3 && !isValidPercentage)
                  }
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Create Transactions
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
