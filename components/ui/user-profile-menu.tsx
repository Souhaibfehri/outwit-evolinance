'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  User,
  Settings, 
  LogOut,
  Trophy,
  Star
} from 'lucide-react'
import { getFirstName } from '@/lib/utils/name-utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { BADGES, calculateBadgeProgress } from '@/lib/tutorials/badge-system'

interface UserProfileMenuProps {
  userEmail: string
  userId: string
  signOutAction: () => Promise<void>
}

export function UserProfileMenu({ userEmail, userId, signOutAction }: UserProfileMenuProps) {
  const [earnedBadges, setEarnedBadges] = useState<string[]>([])

  useEffect(() => {
    // Load earned tutorial badges from localStorage
    const savedState = localStorage.getItem(`tutorial-state-${userId}`)
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        setEarnedBadges(parsed.earnedBadges || [])
      } catch (error) {
        console.error('Failed to load badge state:', error)
      }
    }
  }, [userId])

  const badgeProgress = calculateBadgeProgress(earnedBadges)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white relative">
          <User className="w-5 h-5 mr-2" />
          <span className="hidden sm:inline">{userEmail}</span>
          {earnedBadges.length > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {earnedBadges.length}
              </span>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <DropdownMenuLabel className="text-gray-900 dark:text-gray-300">
          <div className="flex items-center justify-between">
            <span>My Account</span>
            {earnedBadges.length > 0 && (
              <Badge variant="outline" className="text-xs">
                <Trophy className="h-3 w-3 mr-1" />
                {earnedBadges.length} badges
              </Badge>
            )}
          </div>
        </DropdownMenuLabel>
        
        {/* Badge showcase */}
        {earnedBadges.length > 0 && (
          <>
            <div className="px-2 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                <Star className="h-3 w-3" />
                Recent Achievements
              </div>
              <div className="grid grid-cols-4 gap-2">
                {earnedBadges.slice(-8).reverse().map((badgeId) => {
                  const badge = BADGES[badgeId]
                  if (!badge) return null
                  
                  return (
                    <div
                      key={badgeId}
                      className="flex flex-col items-center p-2 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800 text-center group relative"
                      title={`${badge.name} - ${badge.description}`}
                    >
                      <div className="text-lg mb-1">{badge.emoji}</div>
                      <div className="text-xs font-medium text-gray-900 dark:text-white truncate w-full">
                        {getFirstName(badge.name, 'Badge')}
                      </div>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                        {badge.name}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {badgeProgress.percentage > 0 && (
                <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{badgeProgress.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${badgeProgress.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {badgeProgress.earned} of {badgeProgress.total} badges earned
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        
        <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
        <DropdownMenuItem asChild>
          <Link href="/settings" className="text-gray-900 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white cursor-pointer">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <form action={signOutAction}>
            <button className="flex w-full items-center text-gray-900 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
