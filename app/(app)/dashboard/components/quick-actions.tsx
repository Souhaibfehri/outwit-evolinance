'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  CreditCard,
  Target,
  Download,
  Upload,
  PiggyBank,
  TrendingUp,
  BarChart3,
  ArrowRight
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

const quickActions = [
  {
    title: 'Add Transaction',
    description: 'Record a new income or expense',
    icon: Plus,
    href: '/transactions',
    gradient: 'gradient-primary',
    shortcut: 'T'
  },
  {
    title: 'Pay Bill',
    description: 'Mark a bill as paid',
    icon: CreditCard,
    href: '/bills',
    gradient: 'gradient-info',
    shortcut: 'B'
  },
  {
    title: 'Add to Goal',
    description: 'Contribute to savings goal',
    icon: Target,
    href: '/goals',
    gradient: 'gradient-purple',
    shortcut: 'G'
  },
  {
    title: 'Review Budget',
    description: 'Adjust your budget allocations',
    icon: PiggyBank,
    href: '/budget',
    gradient: 'gradient-success',
    shortcut: 'R'
  },
  {
    title: 'Investment',
    description: 'Make an investment contribution',
    icon: TrendingUp,
    href: '/investments',
    gradient: 'gradient-teal',
    shortcut: 'I'
  },
  {
    title: 'View Reports',
    description: 'See your financial insights',
    icon: BarChart3,
    href: '/reports',
    gradient: 'gradient-warning',
    shortcut: 'V'
  }
]

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="card-gradient border-0" data-testid="quick-actions">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-orange-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              
              return (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link href={action.href}>
                    <Card className="card-hover cursor-pointer border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${action.gradient}`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm">{action.title}</h4>
                              <Badge variant="outline" className="text-xs px-2 py-0">
                                {action.shortcut}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {action.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              )
            })}
          </div>
          
          {/* Bottom Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" className="card-hover">
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </Button>
                <Button variant="outline" size="sm" className="card-hover">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground">
                💡 Tip: Use keyboard shortcuts for faster navigation
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function QuickActionsSkeleton() {
  return (
    <Card className="card-gradient border-0">
      <CardHeader className="pb-4">
        <div className="h-5 w-32 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-muted rounded-xl animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}