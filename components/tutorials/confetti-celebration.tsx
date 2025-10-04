'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, Sparkles } from 'lucide-react'

interface ConfettiCelebrationProps {
  badge: {
    id: string
    name: string
    description: string
    icon: string
  }
  onComplete: () => void
  duration?: number
}

export function ConfettiCelebration({ 
  badge, 
  onComplete, 
  duration = 3000 
}: ConfettiCelebrationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onComplete, 500) // Wait for exit animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onComplete])

  // Generate confetti particles
  const confettiColors = ['#ff8c42', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']
  const confettiParticles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    color: confettiColors[i % confettiColors.length],
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    startX: Math.random() * 100,
    startY: Math.random() * 20,
    endX: Math.random() * 100,
    endY: 100 + Math.random() * 20,
    rotation: Math.random() * 720,
    size: 4 + Math.random() * 8
  }))

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none bg-black/20 backdrop-blur-sm"
        >
          {/* Confetti particles */}
          {confettiParticles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                opacity: 1,
                x: `${particle.startX}vw`,
                y: `${particle.startY}vh`,
                rotate: 0,
                scale: 1
              }}
              animate={{
                opacity: 0,
                x: `${particle.endX}vw`,
                y: `${particle.endY}vh`,
                rotate: particle.rotation,
                scale: 0.5
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                ease: 'easeOut'
              }}
              className="absolute rounded-sm"
              style={{
                backgroundColor: particle.color,
                width: particle.size,
                height: particle.size
              }}
            />
          ))}

          {/* Main celebration card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.3, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.3, y: 100 }}
            transition={{ delay: 0.2, type: 'spring', damping: 12, duration: 0.8 }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border-4 border-orange-400 dark:border-orange-600 p-12 max-w-2xl mx-4 pointer-events-auto relative overflow-hidden"
          >
            {/* Floating decorations */}
            <div className="absolute -top-4 -right-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center"
              >
                <Star className="h-5 w-5 text-white" />
              </motion.div>
            </div>
            
            <div className="absolute -top-2 -left-2">
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center"
              >
                <Sparkles className="h-4 w-4 text-white" />
              </motion.div>
            </div>

            {/* Content */}
            <div className="text-center space-y-8">
              {/* Badge icon with pulse */}
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-9xl"
              >
                {badge.icon}
              </motion.div>

              {/* Success message */}
              <div className="space-y-4">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, type: 'spring', damping: 10 }}
                  className="text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight"
                >
                  🎉 BADGE UNLOCKED! 🎉
                </motion.h2>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, type: 'spring', damping: 10 }}
                  className="space-y-4"
                >
                  <h3 className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {badge.name}
                  </h3>
                  <p className="text-xl text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
                    {badge.description}
                  </p>
                </motion.div>
              </div>

              {/* Motivational messages */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, type: 'spring', damping: 15 }}
                className="space-y-4"
              >
                <div className="text-2xl font-black text-transparent bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text">
                  🔥 YOU&apos;RE ON FIRE! 🔥
                </div>
                <div className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  Keep learning to unlock more badges and master your finances!
                </div>
              </motion.div>

              {/* Pulsing glow effect */}
              <motion.div
                animate={{ 
                  boxShadow: [
                    '0 0 20px rgba(255, 140, 66, 0.3)',
                    '0 0 40px rgba(255, 140, 66, 0.6)',
                    '0 0 20px rgba(255, 140, 66, 0.3)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-2xl pointer-events-none"
              />
            </div>
          </motion.div>

          {/* Background sparkles */}
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={`sparkle-${i}`}
              initial={{
                opacity: 0,
                scale: 0,
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 800),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 600)
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                rotate: Math.random() * 360
              }}
              transition={{
                duration: 1.5 + Math.random(),
                delay: Math.random() * 2,
                repeat: Infinity,
                repeatDelay: Math.random() * 3
              }}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full pointer-events-none"
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}