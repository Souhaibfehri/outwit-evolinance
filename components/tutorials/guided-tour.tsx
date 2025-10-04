'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowRight, 
  SkipForward, 
  X, 
  Play,
  ExternalLink,
  Lightbulb,
  Trophy
} from 'lucide-react'
import { TutorialConfig, TutorialStep } from '@/lib/tutorials/tutorial-configs'
import { QuizModal } from './quiz-modal'
import { ConfettiCelebration } from './confetti-celebration'

interface GuidedTourProps {
  config: TutorialConfig
  isActive: boolean
  onComplete: (badgeId: string) => void
  onSkip: () => void
  onClose: () => void
}

export function GuidedTour({ 
  config, 
  isActive, 
  onComplete, 
  onSkip, 
  onClose 
}: GuidedTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [showQuiz, setShowQuiz] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null)

  const currentStep = config.steps[currentStepIndex]
  const isLastStep = currentStepIndex === config.steps.length - 1
  const progress = ((currentStepIndex + 1) / config.steps.length) * 100

  // Highlight target element
  const highlightElement = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      setHighlightedElement(element)
      
      // Scroll into view
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
    }
    return () => {}
  }, [])

  useEffect(() => {
    if (isActive && currentStep) {
      const cleanup = highlightElement(currentStep.target)
      return cleanup
    }
  }, [isActive, currentStep, highlightElement])

  const handleNext = () => {
    if (isLastStep) {
      // Start quiz
      setShowQuiz(true)
    } else {
      setCurrentStepIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }

  const handleQuizComplete = (passed: boolean) => {
    setShowQuiz(false)
    if (passed) {
      setShowCelebration(true)
      setTimeout(() => {
        onComplete(config.badge.id)
        setShowCelebration(false)
      }, 3000)
    }
  }

  const getStepPosition = () => {
    if (!highlightedElement) return { top: '50%', left: '50%' }
    
    const rect = highlightedElement.getBoundingClientRect()
    const scrollTop = window.pageYOffset
    const scrollLeft = window.pageXOffset
    
    const placement = currentStep.placement || 'bottom'
    
    switch (placement) {
      case 'top':
        return {
          top: rect.top + scrollTop - 120,
          left: rect.left + scrollLeft + rect.width / 2 - 200
        }
      case 'bottom':
        return {
          top: rect.bottom + scrollTop + 20,
          left: rect.left + scrollLeft + rect.width / 2 - 200
        }
      case 'left':
        return {
          top: rect.top + scrollTop + rect.height / 2 - 60,
          left: rect.left + scrollLeft - 420
        }
      case 'right':
        return {
          top: rect.top + scrollTop + rect.height / 2 - 60,
          left: rect.right + scrollLeft + 20
        }
      default:
        return {
          top: rect.bottom + scrollTop + 20,
          left: rect.left + scrollLeft + rect.width / 2 - 200
        }
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

      {/* Spotlight on highlighted element */}
      {highlightedElement && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed z-[101] rounded-lg pointer-events-none"
          style={{
            top: highlightedElement.getBoundingClientRect().top + window.pageYOffset - 8,
            left: highlightedElement.getBoundingClientRect().left + window.pageXOffset - 8,
            width: highlightedElement.getBoundingClientRect().width + 16,
            height: highlightedElement.getBoundingClientRect().height + 16,
            boxShadow: '0 0 0 4px rgba(255, 140, 66, 0.8), 0 0 0 9999px rgba(0, 0, 0, 0.6)',
            border: '2px solid #ff8c42'
          }}
        />
      )}

      {/* Tutorial step card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        className="fixed z-[102] w-96 max-w-[90vw]"
        style={{
          ...getStepPosition(),
          transform: 'translateX(-50%)'
        }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
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
                  Step {currentStepIndex + 1} of {config.steps.length}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {config.title}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {progress.toFixed(0)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

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
                  Take Quiz
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Next
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={onSkip} size="sm">
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* YouTube link for full tutorial */}
          {config.youtubeVideo && isLastStep && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <a
                href={config.youtubeVideo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                <Play className="h-4 w-4" />
                Watch Full Tutorial
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      </motion.div>

      {/* Quiz Modal */}
      <QuizModal
        isOpen={showQuiz}
        config={config}
        onComplete={handleQuizComplete}
        onClose={() => setShowQuiz(false)}
      />

      {/* Celebration */}
      {showCelebration && (
        <ConfettiCelebration
          badge={config.badge}
          onComplete={() => setShowCelebration(false)}
        />
      )}

      {/* Tutorial styles */}
      <style jsx global>{`
        .tutorial-highlight {
          position: relative;
          z-index: 102;
          animation: tutorial-pulse 2s infinite;
        }
        
        @keyframes tutorial-pulse {
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
