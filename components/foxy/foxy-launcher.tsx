'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Sparkles, X } from 'lucide-react'

interface FoxyLauncherProps {
  onOpen: () => void
  isOpen: boolean
  hasNewMessage?: boolean
  tutorialProgress?: number
  unreadCount?: number
}

export function FoxyLauncher({ 
  onOpen, 
  isOpen, 
  hasNewMessage = false, 
  tutorialProgress = 0,
  unreadCount = 0 
}: FoxyLauncherProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [showPulse, setShowPulse] = useState(false)

  useEffect(() => {
    // Show pulse animation for new messages or tutorial prompts
    if (hasNewMessage || (tutorialProgress < 100 && tutorialProgress > 0)) {
      setShowPulse(true)
      const timer = setTimeout(() => setShowPulse(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [hasNewMessage, tutorialProgress])

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <div className="relative">
          {/* Pulse animation for attention */}
          {showPulse && (
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.3, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-orange-500 rounded-full"
            />
          )}

          {/* Main launcher button */}
          <Button
            onClick={onOpen}
            size="lg"
            className={`
              relative w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300
              ${isOpen 
                ? 'bg-orange-600 hover:bg-orange-700' 
                : 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
              }
              text-white border-2 border-white/20
            `}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-6 w-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="foxy"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center"
                >
                  {/* Foxy emoji or icon */}
                  <span className="text-2xl">🦊</span>
                </motion.div>
              )}
            </AnimatePresence>
          </Button>

          {/* Notification badges */}
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute -top-2 -right-2"
              >
                <Badge className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tutorial progress indicator */}
          {tutorialProgress > 0 && tutorialProgress < 100 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
            >
              <div className="bg-white dark:bg-gray-800 rounded-full px-2 py-1 shadow-md border">
                <div className="flex items-center gap-1">
                  <div className="w-8 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${tutorialProgress}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {tutorialProgress}%
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* New message indicator */}
          {hasNewMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute -top-1 -left-1"
            >
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <Sparkles className="h-2.5 w-2.5 text-white" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Floating tooltip for first-time users */}
        {tutorialProgress === 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2, duration: 0.5 }}
            className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 px-3 py-2 max-w-48"
          >
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Hi! I'm Foxy 🦊
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Click me to start your guided tour!
            </div>
            {/* Arrow pointing to button */}
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-white dark:border-l-gray-800 border-y-4 border-y-transparent" />
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
