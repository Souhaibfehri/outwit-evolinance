'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, SkipForward, X } from 'lucide-react'

interface TourOverlayProps {
  isActive: boolean
  targetSelector: string
  title: string
  content: string
  step: number
  totalSteps: number
  onNext: () => void
  onSkip?: () => void
  onClose: () => void
  showSkip?: boolean
}

export function TourOverlay({
  isActive,
  targetSelector,
  title,
  content,
  step,
  totalSteps,
  onNext,
  onSkip,
  onClose,
  showSkip = true
}: TourOverlayProps) {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [overlayStyle, setOverlayStyle] = useState<any>({})

  useEffect(() => {
    if (!isActive || !targetSelector) return

    const findAndHighlightElement = () => {
      const element = document.querySelector(targetSelector) as HTMLElement
      if (element) {
        setTargetElement(element)
        
        const rect = element.getBoundingClientRect()
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
        
        setOverlayStyle({
          top: rect.top + scrollTop - 8,
          left: rect.left + scrollLeft - 8,
          width: rect.width + 16,
          height: rect.height + 16
        })

        // Scroll element into view if needed
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        })
      }
    }

    // Try to find element immediately
    findAndHighlightElement()

    // Retry after a short delay in case element is still rendering
    const timer = setTimeout(findAndHighlightElement, 100)

    // Listen for window resize/scroll
    const handleResize = () => findAndHighlightElement()
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize)
    }
  }, [isActive, targetSelector])

  if (!isActive) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100]"
        style={{ pointerEvents: 'none' }}
      >
        {/* Dark backdrop */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Spotlight on target element */}
        {targetElement && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="absolute rounded-lg"
            style={{
              ...overlayStyle,
              boxShadow: '0 0 0 4px rgba(255, 140, 66, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.6)',
              pointerEvents: 'none'
            }}
          />
        )}

        {/* Tour card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ delay: 0.2 }}
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-80 max-w-[90vw]"
          style={{ pointerEvents: 'auto' }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🦊</span>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {title}
                  </h3>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Step {step} of {totalSteps}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
              {content}
            </p>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={onNext} className="btn-primary flex-1">
                <ArrowRight className="h-4 w-4 mr-2" />
                Got it!
              </Button>
              {showSkip && onSkip && (
                <Button variant="outline" onClick={onSkip}>
                  <SkipForward className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-1 mt-4">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index < step 
                      ? 'bg-orange-500' 
                      : index === step - 1
                        ? 'bg-orange-300'
                        : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
