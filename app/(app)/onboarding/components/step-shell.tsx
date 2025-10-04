'use client'

import { ReactNode, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProgressRing } from './progress-ring'
import { ArrowLeft, ArrowRight, Save, Check, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface StepShellProps {
  children: ReactNode
  step: number
  totalSteps: number
  title: string
  subtitle: string
  onNext?: () => void
  onPrevious?: () => void
  onSaveAndExit?: () => void
  canGoNext?: boolean
  isLoading?: boolean
}

export function StepShell({
  children,
  step,
  totalSteps,
  title,
  subtitle,
  onNext,
  onPrevious,
  onSaveAndExit,
  canGoNext = true,
  isLoading = false
}: StepShellProps) {
  const [autoSaved, setAutoSaved] = useState(false)
  const [showAutoSave, setShowAutoSave] = useState(false)

  const progress = (step / totalSteps) * 100

  // Simulate autosave
  useEffect(() => {
    const timer = setTimeout(() => {
      setAutoSaved(true)
      setShowAutoSave(true)
      
      setTimeout(() => {
        setShowAutoSave(false)
      }, 2000)
    }, 1000)

    return () => clearTimeout(timer)
  }, [step])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-8">
            <ProgressRing progress={progress} />
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-center space-x-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
              <AnimatePresence>
                {showAutoSave && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      <Check className="mr-1 h-3 w-3" />
                      Saved
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {subtitle}
            </p>
            
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Step {step} of {totalSteps}</span>
              <span>•</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
          </motion.div>
        </div>

        {/* Content */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200/50 dark:bg-gray-900/80 dark:border-gray-800/50 rounded-2xl p-8 shadow-2xl"
        >
          {children}
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <div className="flex items-center space-x-4">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={onPrevious}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            )}
            
            <Button
              variant="ghost"
              onClick={onSaveAndExit}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Save className="mr-2 h-4 w-4" />
              Save & Exit
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            {/* Progress dots */}
            <div className="hidden sm:flex items-center space-x-2">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    i < step 
                      ? 'bg-teal-500' 
                      : i === step 
                      ? 'bg-teal-300 dark:bg-teal-400' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>

            {step < totalSteps ? (
              <Button
                onClick={onNext}
                disabled={!canGoNext || isLoading}
                className="bg-teal-600 hover:bg-teal-700 text-white dark:bg-teal-500 dark:hover:bg-teal-600"
              >
                {isLoading ? (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={onNext}
                disabled={!canGoNext || isLoading}
                className="bg-gradient-to-r from-teal-600 to-purple-600 hover:from-teal-700 hover:to-purple-700 text-white px-8"
              >
                {isLoading ? (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    Complete Setup
                    <Check className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
