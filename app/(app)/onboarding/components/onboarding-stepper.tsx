'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Circle, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

interface Step {
  key: string
  title: string
  description: string
}

const steps: Step[] = [
  { key: 'profile', title: 'Profile', description: 'Tell us about yourself' },
  { key: 'income', title: 'Income', description: 'Your money sources' },
  { key: 'bills', title: 'Bills', description: 'Recurring expenses' },
  { key: 'debts', title: 'Debts', description: 'What you owe' },
  { key: 'goals', title: 'Goals', description: 'What you\'re saving for' },
  { key: 'review', title: 'Review', description: 'All set!' }
]

export function OnboardingStepper() {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])

  // Load progress from localStorage or server
  useEffect(() => {
    const savedStep = localStorage.getItem('onboarding-current-step')
    const savedCompleted = localStorage.getItem('onboarding-completed-steps')
    
    if (savedStep) setCurrentStep(parseInt(savedStep))
    if (savedCompleted) setCompletedSteps(JSON.parse(savedCompleted))
  }, [])

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progress
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {Math.round(progress)}% complete
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-orange-500 to-teal-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>
      </div>

      {/* Step List */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.key)
          const isCurrent = index === currentStep
          const isAccessible = index <= currentStep

          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`p-3 rounded-lg border transition-all ${
                isCompleted
                  ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                  : isCurrent
                  ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
                  : isAccessible
                  ? 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                  : 'bg-gray-25 border-gray-100 dark:bg-gray-900 dark:border-gray-800 opacity-50'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1">
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : isCurrent ? (
                  <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-400" />
                )}
                <span className={`text-xs font-medium ${
                  isCompleted
                    ? 'text-green-700 dark:text-green-300'
                    : isCurrent
                    ? 'text-orange-700 dark:text-orange-300'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {step.title}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {step.description}
              </p>
            </motion.div>
          )
        })}
      </div>

      {/* Current Step Badge */}
      <div className="flex items-center justify-center">
        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 px-4 py-2">
          Step {currentStep + 1} of {steps.length}: {steps[currentStep]?.title}
        </Badge>
      </div>
    </div>
  )
}
