'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AppCard, MetricCard } from '@/components/ui/app-card'
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  DollarSign,
  CreditCard,
  Target,
  TrendingUp,
  Calendar,
  Settings,
  Trash2,
  BellOff,
  Check,
  X
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface Notification {
  id: string
  type: 'budget_alert' | 'bill_reminder' | 'goal_milestone' | 'large_transaction' | 'system'
  title: string
  message: string
  severity: 'info' | 'warning' | 'error' | 'success'
  createdAt: Date
  read: boolean
  actionable: boolean
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'actionable'>('all')

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      // Mock notifications data
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'budget_alert',
          title: 'Budget Alert: Groceries',
          message: "You've spent 95% of your Groceries budget for this month. Consider reviewing your spending.",
          severity: 'warning',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          read: false,
          actionable: true
        },
        {
          id: '2',
          type: 'bill_reminder',
          title: 'Bill Due Tomorrow',
          message: 'Your Electric Bill ($125.00) is due tomorrow. Would you like to mark it as paid?',
          severity: 'info',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          read: false,
          actionable: true
        },
        {
          id: '3',
          type: 'goal_milestone',
          title: 'Goal Achievement! 🎉',
          message: 'Congratulations! You\'ve reached 75% of your Emergency Fund goal. Keep it up!',
          severity: 'success',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          read: true,
          actionable: false
        },
        {
          id: '4',
          type: 'large_transaction',
          title: 'Large Transaction Detected',
          message: 'We noticed a large expense of $450.00 at Target. Make sure to categorize it properly.',
          severity: 'info',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          read: true,
          actionable: true
        },
        {
          id: '5',
          type: 'system',
          title: 'Welcome to Outwit Budget!',
          message: 'Thanks for joining! Complete your onboarding to get personalized insights.',
          severity: 'info',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
          read: true,
          actionable: false
        }
      ]
      
      await new Promise(resolve => setTimeout(resolve, 500))
      setNotifications(mockNotifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    ))
    toast.success('Marked as read')
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))
    toast.success('All notifications marked as read')
  }

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
    toast.success('Notification deleted')
  }

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read
    if (filter === 'actionable') return notif.actionable
    return true
  })

  const calculateStats = () => {
    const unreadCount = notifications.filter(n => !n.read).length
    const actionableCount = notifications.filter(n => n.actionable && !n.read).length
    const todayCount = notifications.filter(n => {
      const today = new Date()
      const notifDate = new Date(n.createdAt)
      return notifDate.toDateString() === today.toDateString()
    }).length

    return { unreadCount, actionableCount, todayCount }
  }

  const getNotificationIcon = (type: string, severity: string) => {
    switch (type) {
      case 'budget_alert':
        return DollarSign
      case 'bill_reminder':
        return CreditCard
      case 'goal_milestone':
        return Target
      case 'large_transaction':
        return TrendingUp
      default:
        return severity === 'warning' ? AlertTriangle : severity === 'error' ? X : Info
    }
  }

  const getNotificationColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
      case 'success':
        return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
      default:
        return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  const { unreadCount, actionableCount, todayCount } = calculateStats()

  if (loading) {
    return <NotificationsSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Notifications
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Stay updated on your financial activity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="card-hover" onClick={handleMarkAllAsRead}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
          <Button variant="outline" size="sm" className="card-hover">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Unread"
          value={unreadCount.toString()}
          subtitle="Need your attention"
          icon={Bell}
          status={unreadCount > 5 ? "warn" : "info"}
        />
        <MetricCard
          title="Actionable"
          value={actionableCount.toString()}
          subtitle="Require action"
          icon={AlertTriangle}
          status={actionableCount > 0 ? "warn" : "success"}
        />
        <MetricCard
          title="Today"
          value={todayCount.toString()}
          subtitle="Received today"
          icon={Calendar}
          status="info"
        />
        <MetricCard
          title="Total"
          value={notifications.length.toString()}
          subtitle="All notifications"
          icon={Bell}
          status="info"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Filter:</label>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as any)}
            className="text-sm border rounded px-3 py-1 bg-white dark:bg-gray-800"
          >
            <option value="all">All Notifications</option>
            <option value="unread">Unread Only</option>
            <option value="actionable">Actionable Only</option>
          </select>
        </div>
        <Badge variant="outline" className="text-xs">
          {filteredNotifications.length} notifications
        </Badge>
      </div>

      {/* Notifications List */}
      <AppCard
        title="Your Notifications"
        subtitle={`${filteredNotifications.length} notifications`}
        icon={Bell}
        elevated
      >
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">You're all caught up! ✨</h3>
            <p className="text-muted-foreground text-sm">
              {filter === 'unread' ? 'No unread notifications' : 
               filter === 'actionable' ? 'No actionable notifications' : 
               'No notifications to show'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification, index) => {
              const Icon = getNotificationIcon(notification.type, notification.severity)
              const colorClass = getNotificationColor(notification.severity)
              
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    notification.read 
                      ? 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30'
                      : 'border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/30'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-sm">{notification.title}</h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1" />
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        {notification.actionable && (
                          <Button size="sm" className="btn-primary text-xs">
                            Take Action
                          </Button>
                        )}
                        {!notification.read && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Mark Read
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteNotification(notification.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </AppCard>
    </div>
  )
}

function NotificationsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-10 w-48 bg-muted rounded animate-pulse" />
          <div className="h-6 w-64 bg-muted rounded animate-pulse mt-2" />
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-24 bg-muted rounded animate-pulse" />
          <div className="h-9 w-24 bg-muted rounded animate-pulse" />
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="space-y-3">
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            </div>
          </Card>
        ))}
      </div>
      
      <Card className="p-6">
        <div className="space-y-4">
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 border rounded-lg">
              <div className="w-8 h-8 bg-muted rounded-lg animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                <div className="h-6 w-20 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
