'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowRight, 
  ArrowLeft,
  SkipForward, 
  X, 
  Trophy,
  ArrowDown,
  ArrowUp,
  ArrowRightFromLine,
  ArrowLeftFromLine,
  Target,
  CheckCircle
} from 'lucide-react'

export interface TutorialStep {
  target: string // CSS selector
  title: string
  content: string
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  arrow?: boolean
}

interface TutorialPanelProps {
  steps: TutorialStep[]
  isActive: boolean
  onComplete: () => void
  onSkip: () => void
  onClose: () => void
  title?: string
  subtitle?: string
}

export function TutorialPanel({ 
  steps, 
  isActive, 
  onComplete, 
  onSkip, 
  onClose,
  title = "Tutorial",
  subtitle = "Learn how to use this page"
}: TutorialPanelProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null)
  const [isMinimized, setIsMinimized] = useState(false)

  const currentStep = steps[currentStepIndex]
  const isLastStep = currentStepIndex === steps.length - 1
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  // Highlight target element
  const highlightElement = useCallback((selector: string) => {
    // Remove previous highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight')
    })

    // Try multiple selectors if comma-separated
    const selectors = selector.split(',').map(s => s.trim())
    let element: HTMLElement | null = null
    
    for (const sel of selectors) {
      element = document.querySelector(sel) as HTMLElement
      if (element) break
    }
    
    if (element) {
      setHighlightedElement(element)
      
      // Scroll element into view
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      })
      
      // Add highlight class
      element.classList.add('tutorial-highlight')
      
      return () => {
        element.classList.remove('tutorial-highlight')
      }
    } else {
      console.warn(`Tutorial: Could not find element with selectors: ${selector}`)
    }
    return () => {}
  }, [])

  useEffect(() => {
    if (isActive && currentStep && !isMinimized) {
      // Add a small delay to ensure DOM elements are ready
      const timer = setTimeout(() => {
        const cleanup = highlightElement(currentStep.target)
        return cleanup
      }, 100)
      
      return () => {
        clearTimeout(timer)
        // Clean up any existing highlights
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
          el.classList.remove('tutorial-highlight')
        })
      }
    }
  }, [isActive, currentStep, highlightElement, isMinimized])

  // ESC key support
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isActive) {
        handleClose()
      }
    }

    if (isActive) {
      document.addEventListener('keydown', handleEscKey)
      return () => document.removeEventListener('keydown', handleEscKey)
    }
  }, [isActive])

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      setCurrentStepIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }

  const handleClose = () => {
    // Clean up highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight')
    })
    onClose()
  }

  const getArrowDirection = () => {
    if (!highlightedElement) return null
    
    const rect = highlightedElement.getBoundingClientRect()
    const panelWidth = isMinimized ? 64 : 384
    const panelRect = { x: 0, y: 0, width: panelWidth, height: window.innerHeight }
    
    // Determine arrow direction based on element position relative to left panel
    if (rect.left > panelRect.width) {
      return 'right' // Element is to the right of panel
    } else if (rect.top > panelRect.height / 2) {
      return 'up' // Element is below panel center
    } else {
      return 'down' // Element is above panel center
    }
  }

  const getArrowIcon = () => {
    const direction = getArrowDirection()
    switch (direction) {
      case 'up': return <ArrowUp className="h-5 w-5" />
      case 'down': return <ArrowDown className="h-5 w-5" />
      case 'right': return <ArrowRightFromLine className="h-5 w-5" />
      default: return <Target className="h-5 w-5" />
    }
  }

  if (!isActive) return null

  return (
    <>
      {/* Subtle backdrop - only show when not minimized */}
      {!isMinimized && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 z-[100] pointer-events-none"
        />
      )}

      {/* Enhanced highlighted element border with animations */}
      {highlightedElement && !isMinimized && (
        <>
            {/* Outer glow ring with enhanced breathing effect */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: [0.2, 0.7, 0.2], 
                scale: [0.92, 1.12, 0.92] 
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="fixed z-[100] rounded-xl pointer-events-none"
              style={{
                top: highlightedElement.getBoundingClientRect().top + window.pageYOffset - 20,
                left: highlightedElement.getBoundingClientRect().left + window.pageXOffset - 20,
                width: highlightedElement.getBoundingClientRect().width + 40,
                height: highlightedElement.getBoundingClientRect().height + 40,
                background: 'radial-gradient(circle, rgba(255, 140, 66, 0.3) 0%, rgba(255, 140, 66, 0.15) 40%, rgba(255, 140, 66, 0.05) 70%, transparent 100%)',
                border: '3px solid rgba(255, 140, 66, 0.5)',
                filter: 'blur(1px)'
              }}
            />
          
          {/* Main highlight border */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed z-[101] rounded-lg pointer-events-none"
            style={{
              top: highlightedElement.getBoundingClientRect().top + window.pageYOffset - 4,
              left: highlightedElement.getBoundingClientRect().left + window.pageXOffset - 4,
              width: highlightedElement.getBoundingClientRect().width + 8,
              height: highlightedElement.getBoundingClientRect().height + 8,
              border: '3px solid #ff8c42',
              boxShadow: '0 0 0 2px rgba(255, 140, 66, 0.3), 0 0 20px rgba(255, 140, 66, 0.4), inset 0 0 20px rgba(255, 140, 66, 0.1)',
              background: 'rgba(255, 140, 66, 0.05)'
            }}
          />
          
          {/* Simplified corner indicators */}
          <motion.div
            animate={{ 
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="fixed z-[102] w-3 h-3 pointer-events-none rounded-full bg-orange-500"
            style={{
              top: highlightedElement.getBoundingClientRect().top + window.pageYOffset - 6,
              left: highlightedElement.getBoundingClientRect().left + window.pageXOffset - 6,
              boxShadow: '0 0 8px rgba(255, 140, 66, 0.8)'
            }}
          />
        </>
      )}

      {/* Tutorial Panel - Left Side */}
      <motion.div
        initial={{ opacity: 0, x: '-100%' }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed left-0 top-0 z-[102] h-full ${isMinimized ? 'w-16' : 'w-96'} max-w-[90vw] bg-white dark:bg-gray-900 shadow-2xl border-r border-gray-200 dark:border-gray-800`}
      >
        {isMinimized ? (
          // Minimized state
          <div className="p-4 h-full flex flex-col items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(false)}
              className="mb-4 p-2"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
            
            <div className="writing-mode-vertical text-sm font-medium text-gray-600 dark:text-gray-400">
              Tutorial {currentStepIndex + 1}/{steps.length}
            </div>
            
            <div className="mt-4 w-2 flex-1 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div 
                className="w-full bg-orange-500 rounded-full transition-all duration-300"
                style={{ height: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          // Full panel
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                    <span className="text-white text-xl">🦊</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      {title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {subtitle}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsMinimized(true)} title="Minimize tutorial">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={onSkip} className="text-orange-600 hover:text-orange-700" title="Skip tutorial">
                    <X className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleClose} className="text-red-600 hover:text-red-700" title="Close tutorial">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Step {currentStepIndex + 1} of {steps.length}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {progress.toFixed(0)}%
                  </span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
            </div>

            {/* Current Step */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Step indicator with arrow */}
                <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="text-orange-600 dark:text-orange-400">
                    {getArrowIcon()}
                  </div>
                  <div className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    Look at the highlighted element
                  </div>
                </div>

                {/* Step content */}
                <Card className="border-2 border-orange-200 dark:border-orange-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <span className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-orange-600 dark:text-orange-400 text-sm font-bold">
                        {currentStepIndex + 1}
                      </span>
                      {currentStep.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {currentStep.content}
                    </p>
                  </CardContent>
                </Card>

              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-3">
                {currentStepIndex > 0 && (
                  <Button variant="outline" onClick={handlePrevious} className="flex-1">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                )}
                
                <Button 
                  onClick={handleNext} 
                  className="btn-primary flex-1"
                >
                  {isLastStep ? (
                    <>
                      <Trophy className="h-4 w-4 mr-2" />
                      Complete Tutorial
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Next Step
                    </>
                  )}
                </Button>
              </div>
              
              <Button 
                variant="ghost" 
                onClick={onSkip} 
                className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700"
              >
                <SkipForward className="h-4 w-4 mr-2" />
                Skip Tutorial
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Tutorial styles */}
      <style jsx global>{`
        .tutorial-highlight {
          position: relative;
          z-index: 102 !important;
          animation: tutorial-pulse 2s infinite;
        }
        
        @keyframes tutorial-pulse {
          0%, 100% { 
            box-shadow: 0 0 0 0 rgba(255, 140, 66, 0.6);
          }
          50% { 
            box-shadow: 0 0 0 12px rgba(255, 140, 66, 0.1);
          }
        }
        
        .writing-mode-vertical {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
      `}</style>
    </>
  )
}
