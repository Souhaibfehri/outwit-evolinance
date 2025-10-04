'use client'

import { forwardRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AppCardProps {
  title?: string
  subtitle?: string
  icon?: LucideIcon
  status?: 'info' | 'warn' | 'danger' | 'success'
  elevated?: boolean
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}

const statusStyles = {
  info: 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/50',
  warn: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/50',
  danger: 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/50',
  success: 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/50'
}

const statusIconColors = {
  info: 'text-blue-600 dark:text-blue-400',
  warn: 'text-yellow-600 dark:text-yellow-400',
  danger: 'text-red-600 dark:text-red-400',
  success: 'text-green-600 dark:text-green-400'
}

export const AppCard = forwardRef<HTMLDivElement, AppCardProps>(({
  title,
  subtitle,
  icon: Icon,
  status,
  elevated = false,
  actions,
  children,
  className,
  ...props
}, ref) => {
  return (
    <Card
      ref={ref}
      className={cn(
        // Base styles - unified across light/dark
        'rounded-2xl transition-all duration-200',
        
        // Light mode: clean white with subtle border
        'bg-white border-slate-200 shadow-sm',
        
        // Dark mode: glass effect with backdrop blur
        'dark:bg-slate-900/60 dark:border-slate-700 dark:backdrop-blur-sm',
        
        // Elevated variant for important cards
        elevated && 'shadow-lg hover:shadow-xl dark:shadow-slate-900/20',
        
        // Status-specific styling
        status && statusStyles[status],
        
        // Hover effects
        'hover:shadow-md dark:hover:shadow-slate-900/30',
        
        className
      )}
      {...props}
    >
      {(title || subtitle || Icon || actions) && (
        <CardHeader className="p-5 md:p-6 pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {Icon && (
                <div className={cn(
                  'p-2 rounded-xl bg-slate-100 dark:bg-slate-800',
                  status && statusIconColors[status]
                )}>
                  <Icon className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                {title && (
                  <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {title}
                  </CardTitle>
                )}
                {subtitle && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            {actions && (
              <div className="flex items-center gap-2 ml-4 shrink-0">
                {actions}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      
      <CardContent className="p-5 md:p-6 pt-0">
        {children}
      </CardContent>
    </Card>
  )
})

AppCard.displayName = 'AppCard'

// Convenience components for common card types
export interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  icon?: LucideIcon
  status?: 'info' | 'warn' | 'danger' | 'success'
  className?: string
}

export const MetricCard = forwardRef<HTMLDivElement, MetricCardProps>(({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  status,
  className,
  ...props
}, ref) => {
  return (
    <AppCard
      ref={ref}
      elevated
      status={status}
      className={className}
      {...props}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && (
              <Icon className={cn(
                'h-4 w-4',
                status ? statusIconColors[status] : 'text-slate-600 dark:text-slate-400'
              )} />
            )}
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {title}
            </span>
          </div>
          {trend && (
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                trend.isPositive ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'
              )}
            >
              {trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}%
            </Badge>
          )}
        </div>
        
        <div>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {value}
          </div>
          {subtitle && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </AppCard>
  )
})

MetricCard.displayName = 'MetricCard'
