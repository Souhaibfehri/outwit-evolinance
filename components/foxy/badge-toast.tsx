'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Trophy, Star, Sparkles } from 'lucide-react'
import { BADGE_RARITIES } from '@/lib/foxy/badges'

interface BadgeToastProps {
  badge: {
    id: string
    title: string
    description: string
    icon: string
    rarity: 'common' | 'rare' | 'epic' | 'legendary'
    color: string
  } | null
  onClose: () => void
  duration?: number
}

export function BadgeToast({ badge, onClose, duration = 5000 }: BadgeToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (badge) {
      setIsVisible(true)
      
      // Auto-dismiss after duration
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 300) // Wait for exit animation
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [badge, duration, onClose])

  if (!badge) return null

  const rarityStyle = BADGE_RARITIES[badge.rarity]

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[200]"
        >
          <div className={`
            bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 p-6 max-w-sm
            ${rarityStyle.glow} ${rarityStyle.color}
          `}>
            {/* Confetti effect */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    opacity: 1,
                    scale: 0,
                    x: Math.random() * 200 - 100,
                    y: Math.random() * 200 - 100
                  }}
                  animate={{ 
                    opacity: 0,
                    scale: 1,
                    x: (Math.random() * 400 - 200),
                    y: (Math.random() * 400 - 200)
                  }}
                  transition={{ 
                    duration: 2,
                    delay: i * 0.1,
                    ease: 'easeOut'
                  }}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: ['#ff8c42', '#22c55e', '#3b82f6', '#f59e0b'][i % 4]
                  }}
                />
              ))}
            </div>

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    Badge Unlocked! 🎉
                  </h3>
                  <Badge className={`${rarityStyle.color} text-xs`}>
                    {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
                  </Badge>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsVisible(false)}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Badge details */}
            <div className="text-center space-y-2">
              <div className="text-2xl mb-2">
                {badge.icon === 'Trophy' ? '🏆' : 
                 badge.icon === 'Target' ? '🎯' : 
                 badge.icon === 'Zap' ? '⚡' : 
                 badge.icon === 'Crown' ? '👑' : 
                 badge.icon === 'Flame' ? '🔥' : 
                 badge.icon === 'Shield' ? '🛡️' : '⭐'}
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {badge.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {badge.description}
              </p>
            </div>

            {/* Sparkle effects */}
            <div className="absolute top-2 right-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="h-4 w-4 text-yellow-500" />
              </motion.div>
            </div>
            <div className="absolute bottom-2 left-2">
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              >
                <Star className="h-3 w-3 text-yellow-400" />
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
