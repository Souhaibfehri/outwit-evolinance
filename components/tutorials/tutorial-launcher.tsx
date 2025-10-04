'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Play,
  BookOpen,
  Trophy,
  X,
  Gauge,
  Wallet,
  DollarSign,
  CalendarCheck,
  Sword,
  Target,
  TrendingUp,
  LineChart,
  Receipt,
  Rocket,
  RotateCcw
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAllTutorialPages, getTutorialProgress } from '@/lib/tutorials/tutorial-configs'
import { BADGES, calculateBadgeProgress } from '@/lib/tutorials/badge-system'
import { useRouter } from 'next/navigation'

interface TutorialLauncherProps {
  onStartTutorial: (page: string) => void
  onRestartAllTutorials: () => void
  earnedBadges: string[]
  completedTutorials: string[]
  className?: string
  position?: 'bottom-right' | 'bottom-left'
}

const PAGE_ICONS: Record<string, any> = {
  dashboard: Gauge,
  budget: Wallet,
  income: DollarSign,
  transactions: Receipt,
  bills: CalendarCheck,
  debts: Sword,
  goals: Target,
  reports: TrendingUp,
  investments: LineChart,
  notifications: BookOpen
}

const PAGE_NAMES: Record<string, string> = {
  dashboard: 'Dashboard',
  budget: 'Budget',
  income: 'Income',
  transactions: 'Transactions',
  bills: 'Bills',
  debts: 'Debts',
  goals: 'Goals',
  reports: 'Reports',
  investments: 'Investments',
  notifications: 'Notifications'
}

export function TutorialLauncher({ 
  onStartTutorial,
  onRestartAllTutorials,
  earnedBadges,
  completedTutorials,
  className = '',
  position = 'bottom-right'
}: TutorialLauncherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showFullMenu, setShowFullMenu] = useState(false)
  const router = useRouter()

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6'
  }

  const allPages = getAllTutorialPages()
  const progress = getTutorialProgress(completedTutorials)
  const badgeProgress = calculateBadgeProgress(earnedBadges)

  const handleTutorialStart = (page: string) => {
    setIsOpen(false)
    setShowFullMenu(false)
    
    // Navigate to the page first, then start tutorial
    const currentPath = window.location.pathname.replace(/\/$/, '') // Remove trailing slash
    const targetPath = `/${page}`
    
    if (currentPath !== targetPath) {
      // Show loading state
      const loadingToast = setTimeout(() => {
        // Force navigation
        router.push(targetPath)
        
        // Wait for navigation and DOM to be ready
        setTimeout(() => {
          // Ensure we're on the right page before starting
          if (window.location.pathname.includes(page)) {
            onStartTutorial(page)
          } else {
            // Retry navigation
            router.replace(targetPath)
            setTimeout(() => onStartTutorial(page), 300)
          }
        }, 800)
      }, 100)
    } else {
      // Already on the page, start immediately with small delay for DOM
      setTimeout(() => onStartTutorial(page), 200)
    }
  }

  const handleRestartAll = () => {
    setIsOpen(false)
    setShowFullMenu(false)
    onRestartAllTutorials()
  }

  return (
    <>
      {/* Main launcher button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`fixed ${positionClasses[position]} z-40 ${className}`}
      >
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              size="lg"
              className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-2 border-white/20 relative"
            >
              <BookOpen className="h-6 w-6" />
              
              {/* Progress indicator */}
              {progress > 0 && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {Math.floor(progress / 10)}
                  </span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent 
            align={position === 'bottom-right' ? 'end' : 'start'} 
            className="w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl"
          >
            <DropdownMenuLabel className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-orange-600" />
                Tutorial Center
              </div>
              <Badge variant="outline" className="text-xs">
                {completedTutorials.length}/{allPages.length}
              </Badge>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />

            {/* Quick stats */}
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg m-2">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-orange-600">
                    {completedTutorials.length}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Tutorials Done
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-600">
                    {earnedBadges.length}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Badges Earned
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick actions */}
            <DropdownMenuItem 
              onClick={() => setShowFullMenu(true)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Play className="h-4 w-4 text-green-600" />
              <div>
                <div className="font-medium">Browse All Tutorials</div>
                <div className="text-xs text-gray-500">Choose what to learn</div>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={handleRestartAll}
              className="flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4 text-blue-600" />
              <div>
                <div className="font-medium">Restart All Progress</div>
                <div className="text-xs text-gray-500">Start fresh</div>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* Recent badges */}
            {earnedBadges.length > 0 && (
              <div className="p-2">
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Latest Badges ({earnedBadges.length} total)
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {earnedBadges.slice(-3).reverse().map((badgeId) => {
                    const badge = BADGES[badgeId]
                    if (!badge) return null
                    
                    return (
                      <div
                        key={badgeId}
                        className="flex items-center gap-2 text-xs bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 text-orange-800 dark:text-orange-200 px-3 py-2 rounded-lg border border-orange-200 dark:border-orange-800"
                      >
                        <span className="text-base">{badge.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{badge.name}</div>
                          <div className="text-xs text-orange-600 dark:text-orange-400 capitalize">
                            {badge.rarity} • {badge.category.replace('-', ' ')}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {earnedBadges.length > 3 && (
                  <div className="text-center mt-2">
                    <button 
                      onClick={() => setShowFullMenu(true)}
                      className="text-xs text-orange-600 dark:text-orange-400 hover:underline"
                    >
                      View all {earnedBadges.length} badges
                    </button>
                  </div>
                )}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      {/* Full tutorial menu modal */}
      <AnimatePresence>
        {showFullMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setShowFullMenu(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Tutorial Center
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Master every feature of Outwit Budget
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowFullMenu(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Progress overview */}
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Your Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {progress}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Complete
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {earnedBadges.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Badges
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {completedTutorials.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Tutorials
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tutorial list */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Available Tutorials
                </h3>
                
                <div className="grid gap-2">
                  {allPages.map((page) => {
                    const Icon = PAGE_ICONS[page] || BookOpen
                    const isCompleted = completedTutorials.includes(page)
                    
                    return (
                      <motion.button
                        key={page}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleTutorialStart(page)}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                          isCompleted
                            ? 'border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800'
                            : 'border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isCompleted 
                            ? 'bg-green-100 dark:bg-green-900' 
                            : 'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          <Icon className={`h-5 w-5 ${
                            isCompleted 
                              ? 'text-green-600' 
                              : 'text-gray-600 dark:text-gray-400'
                          }`} />
                        </div>
                        
                        <div className="flex-1">
                          <div className={`font-medium ${
                            isCompleted 
                              ? 'text-green-800 dark:text-green-200' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {PAGE_NAMES[page]} Tutorial
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {isCompleted ? 'Completed ✓' : 'Click to start'}
                          </div>
                        </div>

                        {isCompleted && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            Done
                          </Badge>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Badge showcase */}
              {earnedBadges.length > 0 && (
                <Card className="mt-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      Your Badges ({earnedBadges.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {earnedBadges.map((badgeId) => {
                        const badge = BADGES[badgeId]
                        if (!badge) return null
                        
                        return (
                          <div
                            key={badgeId}
                            className="flex flex-col items-center p-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800 text-center"
                          >
                            <div className="text-2xl mb-1">{badge.emoji}</div>
                            <div className="text-xs font-medium text-gray-900 dark:text-white truncate w-full">
                              {badge.name}
                            </div>
                            <div className="text-xs text-orange-600 dark:text-orange-400 capitalize">
                              {badge.rarity}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Next badge preview */}
              {badgeProgress.nextBadge && (
                <Card className="mt-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Rocket className="h-5 w-5 text-blue-500" />
                      Next Badge to Unlock
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="text-2xl opacity-50">
                        {badgeProgress.nextBadge.emoji}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {badgeProgress.nextBadge.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {badgeProgress.nextBadge.description}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 capitalize">
                          {badgeProgress.nextBadge.rarity} • {badgeProgress.nextBadge.category.replace('-', ' ')}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
