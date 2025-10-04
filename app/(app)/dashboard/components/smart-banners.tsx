'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  CheckCircle, 
  Target,
  Sparkles,
  TrendingUp,
  X,
  ArrowRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface SmartBanner {
  id: string
  type: 'success' | 'warning' | 'info' | 'celebration'
  title: string
  message: string
  actionText?: string
  actionHref?: string
  dismissible: boolean
  priority: number
}

export function SmartBanners() {
  // COMPLETELY DISABLED: No smart banners for now
  // Users should go through onboarding instead of seeing tutorial cards
  return null
  
  const [banners, setBanners] = useState<SmartBanner[]>([])
  const [dismissedBanners, setDismissedBanners] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBanners() {
      try {
        // DISABLED: No tutorial/welcome banners for new users
        // Users should go through onboarding first, then see relevant banners based on actual data
        const mockBanners: SmartBanner[] = [
          // Only show banners for users with actual data and specific conditions
          // Welcome banners removed - users get onboarding flow instead
        ]

        // Filter out dismissed banners
        const activeBanners = mockBanners.filter(banner => 
          !dismissedBanners.includes(banner.id)
        ).sort((a, b) => a.priority - b.priority)

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 600))
        setBanners(activeBanners)
      } catch (error) {
        console.error('Error fetching smart banners:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBanners()
  }, [dismissedBanners])

  const dismissBanner = (bannerId: string) => {
    setDismissedBanners(prev => [...prev, bannerId])
    setBanners(prev => prev.filter(banner => banner.id !== bannerId))
  }

  const getBannerIcon = (type: string) => {
    switch (type) {
      case 'success':
        return CheckCircle
      case 'warning':
        return AlertTriangle
      case 'celebration':
        return Sparkles
      default:
        return Target
    }
  }

  const getBannerGradient = (type: string) => {
    switch (type) {
      case 'success':
        return 'gradient-success'
      case 'warning':
        return 'gradient-warning'
      case 'celebration':
        return 'gradient-primary'
      default:
        return 'gradient-info'
    }
  }

  const getBannerBackground = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
      case 'celebration':
        return 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800'
      default:
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="card-gradient border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-48 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-3 w-64 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-8 w-24 bg-muted rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <AnimatePresence mode="popLayout">
      {banners.map((banner, index) => {
        const Icon = getBannerIcon(banner.type)
        const gradient = getBannerGradient(banner.type)
        const background = getBannerBackground(banner.type)
        
        return (
          <motion.div
            key={banner.id}
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            layout
          >
            <Card className={`card-gradient border-0 overflow-hidden ${background}`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${gradient}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {banner.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {banner.message}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {banner.actionText && banner.actionHref && (
                      <Link href={banner.actionHref}>
                        <Button size="sm" className="btn-primary rounded-lg">
                          {banner.actionText}
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    )}
                    
                    {banner.dismissible && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissBanner(banner.id)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </AnimatePresence>
  )
}