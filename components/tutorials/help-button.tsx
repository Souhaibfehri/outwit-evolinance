'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { 
  HelpCircle, 
  RotateCcw, 
  Play,
  BookOpen,
  Trophy,
  X
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HelpButtonProps {
  currentPage: string
  onStartTutorial: (page: string) => void
  onRestartAllTutorials: () => void
  earnedBadges: string[]
  className?: string
  position?: 'bottom-right' | 'bottom-left'
}

export function HelpButton({ 
  currentPage, 
  onStartTutorial, 
  onRestartAllTutorials,
  earnedBadges,
  className = '',
  position = 'bottom-left'
}: HelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showBadges, setShowBadges] = useState(false)

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6'
  }

  const pageNames: Record<string, string> = {
    dashboard: 'Dashboard',
    budget: 'Budget',
    income: 'Income',
    transactions: 'Transactions', 
    bills: 'Bills',
    debts: 'Debts',
    goals: 'Goals',
    reports: 'Reports',
    investments: 'Investments',
    notifications: 'Notifications',
    settings: 'Settings'
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`fixed ${positionClasses[position]} z-40 ${className}`}
      >
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              size="lg"
              className="w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-blue-600 hover:bg-blue-700 text-white border-2 border-white/20"
            >
              <HelpCircle className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent 
            align={position === 'bottom-right' ? 'end' : 'start'} 
            className="w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl"
          >
            <DropdownMenuLabel className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-blue-600" />
              Tutorial Help
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={() => onStartTutorial(currentPage)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Play className="h-4 w-4 text-green-600" />
              <div>
                <div className="font-medium">Tutorial: {pageNames[currentPage] || currentPage}</div>
                <div className="text-xs text-gray-500">Learn this page</div>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={onRestartAllTutorials}
              className="flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4 text-orange-600" />
              <div>
                <div className="font-medium">Restart All Tutorials</div>
                <div className="text-xs text-gray-500">Start from the beginning</div>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={() => setShowBadges(true)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Trophy className="h-4 w-4 text-yellow-600" />
              <div>
                <div className="font-medium">My Badges ({earnedBadges.length})</div>
                <div className="text-xs text-gray-500">View achievements</div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      {/* Badges Modal */}
      <AnimatePresence>
        {showBadges && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setShowBadges(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    My Badges
                  </h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowBadges(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {earnedBadges.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🏆</div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    No badges yet
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Complete tutorials and quizzes to earn your first badge!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {earnedBadges.map((badgeId, index) => (
                    <motion.div
                      key={badgeId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {badgeId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Earned {new Date().toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-2xl">
                        {getBadgeIcon(badgeId)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Complete more tutorials to unlock additional badges!
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function getBadgeIcon(badgeId: string): string {
  const icons: Record<string, string> = {
    dashboard_master: '📊',
    budget_boss: '💰',
    income_pro: '💵',
    bills_master: '📋',
    debt_destroyer: '⚔️',
    goal_getter: '🎯',
    analytics_ace: '📈',
    investment_guru: '📊',
    tutorial_complete: '🏆'
  }
  
  return icons[badgeId] || '🏅'
}
