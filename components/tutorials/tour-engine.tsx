'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowRight, 
  ArrowLeft,
  SkipForward, 
  X, 
  Play,
  ExternalLink,
  Trophy,
  ArrowDown,
  ArrowUp,
  ArrowRightFromLine,
  ArrowLeftFromLine
} from 'lucide-react'

export interface TourStep {
  target: string // CSS selector
  title: string
  content: string
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  arrow?: boolean
  allowClicksThruHole?: boolean
  disableBeacon?: boolean
  hideCloseButton?: boolean
  showProgress?: boolean
  showSkipButton?: boolean
}

interface TourEngineProps {
  steps: TourStep[]
  isActive: boolean
  onComplete: () => void
  onSkip: () => void
  onClose: () => void
  title?: string
  subtitle?: string
}

export function TourEngine({ 
  steps, 
  isActive, 
  onComplete, 
  onSkip, 
  onClose,
  title = "Tutorial",
  subtitle = "Learn how to use this page"
}: TourEngineProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const [placement, setPlacement] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom')
  const tooltipRef = useRef<HTMLDivElement>(null)

  const currentStep = steps[currentStepIndex]
  const isLastStep = currentStepIndex === steps.length - 1
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  // Calculate optimal tooltip position
  const calculateTooltipPosition = useCallback((element: HTMLElement, preferredPlacement: string = 'bottom') => {
    if (!element) return { top: 0, left: 0, placement: 'bottom' }

    const rect = element.getBoundingClientRect()
    const scrollTop = window.pageYOffset
    const scrollLeft = window.pageXOffset
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    const tooltipWidth = 400 // Approximate tooltip width
    const tooltipHeight = 200 // Approximate tooltip height
    const margin = 20

    let top = 0
    let left = 0
    let finalPlacement = preferredPlacement

    // Calculate positions for each placement
    const positions = {
      bottom: {
        top: rect.bottom + scrollTop + margin,
        left: rect.left + scrollLeft + rect.width / 2 - tooltipWidth / 2,
        fits: rect.bottom + tooltipHeight + margin < viewportHeight
      },
      top: {
        top: rect.top + scrollTop - tooltipHeight - margin,
        left: rect.left + scrollLeft + rect.width / 2 - tooltipWidth / 2,
        fits: rect.top - tooltipHeight - margin > 0
      },
      right: {
        top: rect.top + scrollTop + rect.height / 2 - tooltipHeight / 2,
        left: rect.right + scrollLeft + margin,
        fits: rect.right + tooltipWidth + margin < viewportWidth
      },
      left: {
        top: rect.top + scrollTop + rect.height / 2 - tooltipHeight / 2,
        left: rect.left + scrollLeft - tooltipWidth - margin,
        fits: rect.left - tooltipWidth - margin > 0
      }
    }

    // Try preferred placement first
    if (positions[preferredPlacement as keyof typeof positions]?.fits) {
      const pos = positions[preferredPlacement as keyof typeof positions]
      top = pos.top
      left = pos.left
      finalPlacement = preferredPlacement
    } else {
      // Find best fitting placement
      const fallbackOrder = ['bottom', 'top', 'right', 'left']
      for (const placement of fallbackOrder) {
        if (positions[placement as keyof typeof positions].fits) {
          const pos = positions[placement as keyof typeof positions]
          top = pos.top
          left = pos.left
          finalPlacement = placement
          break
        }
      }
    }

    // Ensure tooltip stays within viewport bounds
    left = Math.max(margin, Math.min(left, viewportWidth - tooltipWidth - margin))
    top = Math.max(margin, Math.min(top, viewportHeight - tooltipHeight - margin))

    return { top, left, placement: finalPlacement }
  }, [])

  // Highlight target element and position tooltip
  const highlightElement = useCallback((selector: string, preferredPlacement: string = 'bottom') => {
    // Remove previous highlights
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight')
    })

    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      setHighlightedElement(element)
      
      // Scroll element into view
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      })
      
      // Add highlight class
      element.classList.add('tour-highlight')
      
      // Calculate tooltip position
      setTimeout(() => {
        const position = calculateTooltipPosition(element, preferredPlacement)
        setTooltipPosition({ top: position.top, left: position.left })
        setPlacement(position.placement as 'top' | 'bottom' | 'left' | 'right')
      }, 100) // Small delay to ensure scroll is complete
      
      return () => {
        element.classList.remove('tour-highlight')
      }
    }
    return () => {}
  }, [calculateTooltipPosition])

  useEffect(() => {
    if (isActive && currentStep) {
      const cleanup = highlightElement(currentStep.target, currentStep.placement)
      return cleanup
    }
  }, [isActive, currentStep, highlightElement])

  // Handle window resize
  useEffect(() => {
    if (!isActive || !highlightedElement) return

    const handleResize = () => {
      const position = calculateTooltipPosition(highlightedElement, currentStep?.placement)
      setTooltipPosition({ top: position.top, left: position.left })
      setPlacement(position.placement as 'top' | 'bottom' | 'left' | 'right')
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isActive, highlightedElement, currentStep, calculateTooltipPosition])

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
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight')
    })
    onClose()
  }

  const getArrowIcon = () => {
    switch (placement) {
      case 'top': return <ArrowDown className="h-4 w-4" />
      case 'bottom': return <ArrowUp className="h-4 w-4" />
      case 'left': return <ArrowRightFromLine className="h-4 w-4" />
      case 'right': return <ArrowLeftFromLine className="h-4 w-4" />
      default: return <ArrowDown className="h-4 w-4" />
    }
  }

  if (!isActive) return null

  return (
    <>
      {/* Dark backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[100]"
      />

      {/* Highlighted element border */}
      {highlightedElement && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed z-[101] rounded-lg pointer-events-none border-4 border-orange-500 shadow-lg"
          style={{
            top: highlightedElement.getBoundingClientRect().top + window.pageYOffset - 4,
            left: highlightedElement.getBoundingClientRect().left + window.pageXOffset - 4,
            width: highlightedElement.getBoundingClientRect().width + 8,
            height: highlightedElement.getBoundingClientRect().height + 8,
            boxShadow: '0 0 0 2px rgba(255, 140, 66, 0.3), 0 0 20px rgba(255, 140, 66, 0.5)'
          }}
        />
      )}

      {/* Tutorial tooltip */}
      <motion.div
        ref={tooltipRef}
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        className="fixed z-[102] w-96 max-w-[90vw]"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 relative">
          {/* Arrow pointing to highlighted element */}
          {currentStep?.arrow !== false && (
            <div 
              className={`absolute text-orange-500 ${
                placement === 'top' ? '-bottom-2 left-1/2 -translate-x-1/2' :
                placement === 'bottom' ? '-top-2 left-1/2 -translate-x-1/2' :
                placement === 'left' ? '-right-2 top-1/2 -translate-y-1/2' :
                '-left-2 top-1/2 -translate-y-1/2'
              }`}
            >
              {getArrowIcon()}
            </div>
          )}

          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <span className="text-white text-lg">🦊</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {currentStep.title}
                </h3>
                <Badge variant="outline" className="text-xs mt-1">
                  Step {currentStepIndex + 1} of {steps.length}
                </Badge>
              </div>
            </div>
            {!currentStep?.hideCloseButton && (
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Progress */}
          {currentStep?.showProgress !== false && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {title}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {progress.toFixed(0)}%
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Content */}
          <div className="mb-6">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {currentStep.content}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {currentStepIndex > 0 && (
              <Button variant="outline" onClick={handlePrevious} size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            
            <Button 
              onClick={handleNext} 
              className="btn-primary flex-1"
              size="sm"
            >
              {isLastStep ? (
                <>
                  <Trophy className="h-4 w-4 mr-2" />
                  Complete
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Next
                </>
              )}
            </Button>
            
            {(currentStep?.showSkipButton !== false) && (
              <Button variant="outline" onClick={onSkip} size="sm">
                <SkipForward className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tour styles */}
      <style jsx global>{`
        .tour-highlight {
          position: relative;
          z-index: 102 !important;
          animation: tour-pulse 2s infinite;
        }
        
        @keyframes tour-pulse {
          0%, 100% { 
            box-shadow: 0 0 0 0 rgba(255, 140, 66, 0.4);
          }
          50% { 
            box-shadow: 0 0 0 8px rgba(255, 140, 66, 0.1);
          }
        }
      `}</style>
    </>
  )
}
