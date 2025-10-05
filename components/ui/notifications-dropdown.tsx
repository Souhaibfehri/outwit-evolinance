'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Bell,
  BellRing,
  ExternalLink
} from 'lucide-react'
import { motion } from 'framer-motion'

interface Notification {
  id: string
  type: 'budget_alert' | 'bill_reminder' | 'goal_achievement' | 'large_transaction' | 'info'
  title: string
  message: string
  timestamp: Date
  read: boolean
  priority: 'low' | 'medium' | 'high'
  actionUrl?: string
}

const sampleNotifications: Notification[] = [
  {
    id: '1',
    type: 'budget_alert',
    title: 'Budget Alert',
    message: "You've spent 95% of your Groceries budget for this month",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: false,
    priority: 'high',
    actionUrl: '/budget'
  },
  {
    id: '2',
    type: 'bill_reminder',
    title: 'Bill Reminder',
    message: 'Electric bill ($120) is due in 3 days',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    read: false,
    priority: 'medium',
    actionUrl: '/bills'
  },
  {
    id: '3',
    type: 'goal_achievement',
    title: 'Goal Achievement',
    message: "Congratulations! You've reached your Emergency Fund goal",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    read: true,
    priority: 'low',
    actionUrl: '/goals'
  },
  {
    id: '4',
    type: 'large_transaction',
    title: 'Large Transaction',
    message: 'Large expense detected: $500 at Target',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    read: true,
    priority: 'medium',
    actionUrl: '/transactions'
  }
]

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications)
  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          {unreadCount > 0 ? (
            <BellRing className="w-5 h-5" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
            >
              <span className="text-xs font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </motion.div>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl max-h-[70vh] overflow-y-auto"
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-orange-600" />
            Notifications
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs h-6 px-2"
              >
                Mark all read
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />

        <div className="p-6 text-center">
          <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : 'No new notifications'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.location.href = '/notifications'
              setIsOpen(false)
            }}
            className="text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300"
          >
            See All Notifications
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
