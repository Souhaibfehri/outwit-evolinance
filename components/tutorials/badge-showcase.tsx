'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, Award, Medal, Crown, Zap, Target, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BADGES, getBadgeDetails } from '@/lib/tutorials/badge-system'

interface BadgeShowcaseProps {
  userId: string
  className?: string
  position?: 'left' | 'right'
}

export function BadgeShowcase({ 
  userId, 
  className = '', 
  position = 'left' 
}: BadgeShowcaseProps) {
  const [earnedBadges, setEarnedBadges] = useState<string[]>([])
  const [isMinimized, setIsMinimized] = useState(false)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    // Load earned badges from localStorage
    const savedState = localStorage.getItem(`tutorial-state-${userId}`)
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        setEarnedBadges(parsed.earnedBadges || [])
      } catch (error) {
        console.error('Failed to load badge state:', error)
      }
    }

    // Listen for new badges
    const handleBadgeEarned = () => {
      const updatedState = localStorage.getItem(`tutorial-state-${userId}`)
      if (updatedState) {
        try {
          const parsed = JSON.parse(updatedState)
          setEarnedBadges(parsed.earnedBadges || [])
        } catch (error) {
          console.error('Failed to update badge state:', error)
        }
      }
    }

    window.addEventListener('tutorial-badge-earned', handleBadgeEarned)
    return () => window.removeEventListener('tutorial-badge-earned', handleBadgeEarned)
  }, [userId])

  // Don't show if no badges earned
  if (earnedBadges.length === 0) {
    return null
  }

  const displayedBadges = showAll ? earnedBadges : earnedBadges.slice(-3)
  const hasMoreBadges = earnedBadges.length > 3

  return (
    <motion.div
      initial={{ opacity: 0, x: position === 'left' ? -100 : 100 }}
      animate={{ opacity: 1, x: 0 }}
      className={`fixed ${position === 'left' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 z-40 ${className}`}
    >
      <AnimatePresence>
        {!isMinimized ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="w-64"
          >
            <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border border-orange-200/50 dark:border-orange-800/50 shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Your Badges
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(true)}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {earnedBadges.length} badge{earnedBadges.length !== 1 ? 's' : ''} earned
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {displayedBadges.reverse().map((badgeId) => {
                  const badge = BADGES[badgeId]
                  if (!badge) return null

                  return (
                    <motion.div
                      key={badgeId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-orange-50/50 to-yellow-50/50 dark:from-orange-900/20 dark:to-yellow-900/20 border border-orange-200/30 dark:border-orange-800/30"
                    >
                      <div className="text-2xl">
                        {badge.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {badge.name}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {badge.description}
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs mt-1 ${
                            badge.rarity === 'legendary' ? 'border-purple-300 text-purple-700 dark:border-purple-600 dark:text-purple-300' :
                            badge.rarity === 'epic' ? 'border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300' :
                            badge.rarity === 'rare' ? 'border-green-300 text-green-700 dark:border-green-600 dark:text-green-300' :
                            'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300'
                          }`}
                        >
                          {badge.rarity}
                        </Badge>
                      </div>
                    </motion.div>
                  )
                })}

                {hasMoreBadges && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAll(!showAll)}
                    className="w-full text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
                  >
                    {showAll ? (
                      <>
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Show Recent
                      </>
                    ) : (
                      <>
                        View All {earnedBadges.length} Badges
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <Button
              onClick={() => setIsMinimized(false)}
              className="h-12 w-12 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <div className="flex flex-col items-center">
                <Trophy className="h-4 w-4" />
                <div className="text-xs font-bold">{earnedBadges.length}</div>
              </div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
