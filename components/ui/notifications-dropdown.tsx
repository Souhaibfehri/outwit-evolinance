'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Bell,
  BellRing,
  ExternalLink,
  Calendar,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Target,
  Info
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { NotificationData, getNotificationDisplayInfo } from '@/lib/notifications/engine'

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/notifications')
      const data = await response.json()

      if (data.success) {
        setNotifications(data.notifications)
      } else {
        console.error('Failed to load notifications:', data.error)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsSeen = async (notificationId: string) => {
    try {
      await fetch('/api/notifications/mark-seen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      })

      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, seenAt: new Date().toISOString() } : n
      ))
    } catch (error) {
      console.error('Error marking notification as seen:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-seen', {
        method: 'POST'
      })

      setNotifications(prev => prev.map(n => ({ 
        ...n, 
        seenAt: n.seenAt || new Date().toISOString() 
      })))
      
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Failed to mark all as read')
    }
  }

  const unreadCount = notifications.filter(n => !n.seenAt).length

  const getNotificationIcon = (type: NotificationData['type']) => {
    const iconMap: Record<string, any> = {
      Calendar, AlertTriangle, TrendingDown, DollarSign, Target, Info
    }
    
    const displayInfo = getNotificationDisplayInfo({ type } as NotificationData)
    return iconMap[displayInfo.icon] || Info
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

        {notifications.length === 0 ? (
          <div className="p-6 text-center">
            <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              No notifications yet
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
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.slice(0, 5).map((notification, index) => (
              <div
                key={notification.id}
                className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700/50 last:border-b-0 ${
                  !notification.seenAt ? 'bg-orange-50/50 dark:bg-orange-950/20' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </p>
                        {!notification.seenAt && (
                          <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 pr-8">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {notifications.length > 5 && (
              <>
                <div className="border-t" />
                <div className="p-3 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      window.location.href = '/notifications'
                      setIsOpen(false)
                    }}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    View All {notifications.length} Notifications
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
