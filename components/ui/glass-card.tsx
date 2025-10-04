'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  delay?: number
}

export function GlassCard({ children, className, hover = true, delay = 0 }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={hover ? { scale: 1.02, y: -5 } : undefined}
      className={cn(
        // Glass morphism base styles
        'backdrop-blur-xl bg-white/5 border border-white/10',
        'shadow-2xl shadow-black/20',
        // Gradient overlay for depth
        'bg-gradient-to-br from-white/10 via-white/5 to-transparent',
        // Rounded corners and overflow
        'rounded-2xl overflow-hidden',
        // Transition for smooth hover effects
        'transition-all duration-300 ease-out',
        className
      )}
    >
      {/* Inner glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-transparent to-purple-500/10 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  )
}

export function GlassButton({ 
  children, 
  className, 
  variant = 'default',
  ...props 
}: any) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'backdrop-blur-xl bg-white/10 border border-white/20',
        'shadow-lg shadow-black/25',
        'rounded-xl px-4 py-2 text-white font-medium',
        'transition-all duration-200 ease-out',
        'hover:bg-white/20 hover:border-white/30',
        variant === 'primary' && 'bg-teal-500/20 border-teal-400/30 hover:bg-teal-500/30',
        variant === 'danger' && 'bg-red-500/20 border-red-400/30 hover:bg-red-500/30',
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  )
}

export function AnimatedNumber({ 
  value, 
  prefix = '', 
  suffix = '',
  className 
}: {
  value: number
  prefix?: string
  suffix?: string
  className?: string
}) {
  return (
    <motion.div
      key={value}
      initial={{ scale: 1.2, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={className}
    >
      {prefix}{value.toLocaleString()}{suffix}
    </motion.div>
  )
}

export function ProgressBarAnimated({ 
  value, 
  className,
  color = 'teal'
}: {
  value: number
  className?: string
  color?: 'teal' | 'green' | 'red' | 'blue' | 'purple'
}) {
  const colorClasses = {
    teal: 'from-teal-400 to-teal-600',
    green: 'from-green-400 to-green-600',
    red: 'from-red-400 to-red-600',
    blue: 'from-blue-400 to-blue-600',
    purple: 'from-purple-400 to-purple-600',
  }

  return (
    <div className={cn('w-full bg-white/10 rounded-full h-2 overflow-hidden', className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(value, 100)}%` }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        className={cn(
          'h-full rounded-full bg-gradient-to-r',
          colorClasses[color]
        )}
      />
    </div>
  )
}

export function FloatingCard({ 
  children, 
  className,
  delay = 0 
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateX: -15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ 
        duration: 0.6, 
        delay,
        ease: [0.25, 0.25, 0, 1] // Custom easing for smooth entry
      }}
      whileHover={{ 
        y: -10, 
        rotateX: 5,
        transition: { duration: 0.2 }
      }}
      className={cn(
        'backdrop-blur-2xl bg-gradient-to-br from-white/10 via-white/5 to-white/5',
        'border border-white/20 rounded-3xl shadow-2xl shadow-black/25',
        'transform-gpu perspective-1000',
        className
      )}
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
    </motion.div>
  )
}
