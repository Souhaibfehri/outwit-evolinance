'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  PiggyBank, 
  TrendingDown, 
  Target, 
  BarChart3, 
  Building2, 
  Shield,
  Zap,
  CheckCircle
} from 'lucide-react'
import { motion } from 'framer-motion'

const features = [
  {
    icon: PiggyBank,
    title: 'Zero-Based Budgeting',
    description: 'Assign every dollar a purpose. Track Ready-to-Assign and ensure your income equals your outflow.',
    badge: 'Core Feature',
    color: 'text-teal-600 dark:text-teal-400'
  },
  {
    icon: TrendingDown,
    title: 'Smart Debt Payoff',
    description: 'Compare Avalanche vs Snowball strategies. See exactly when you\'ll be debt-free with interactive calculators.',
    badge: 'Advanced',
    color: 'text-red-600 dark:text-red-400'
  },
  {
    icon: Target,
    title: 'Goal Tracking',
    description: 'Set savings goals with deadlines and priorities. Track progress with beautiful visualizations.',
    badge: 'Popular',
    color: 'text-purple-600 dark:text-purple-400'
  },
  {
    icon: BarChart3,
    title: 'Detailed Reports',
    description: 'Get insights into spending patterns, budget performance, and financial health with comprehensive analytics.',
    badge: 'Insights',
    color: 'text-blue-600 dark:text-blue-400'
  },
  {
    icon: Building2,
    title: 'Bank Sync',
    description: 'Import transactions via CSV or connect your bank accounts for automatic transaction syncing.',
    badge: 'Coming Soon',
    color: 'text-green-600 dark:text-green-400'
  },
  {
    icon: Shield,
    title: 'Privacy-First',
    description: 'Your financial data stays yours. Bank-grade encryption with no data sharing or selling.',
    badge: 'Guaranteed',
    color: 'text-orange-600 dark:text-orange-400'
  }
]

export function FeatureGrid() {
  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl lg:text-5xl"
          >
            Everything you need to
            <span className="bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent">
              {' '}master your money
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
          >
            Comprehensive financial management tools designed to help you budget smarter, pay off debt faster, and achieve your goals.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full bg-white/80 backdrop-blur-xl border border-gray-200/50 dark:bg-gray-900/80 dark:border-gray-800/50 hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 group">
                  <CardHeader className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 group-hover:scale-110 transition-transform duration-200`}>
                        <Icon className={`h-6 w-6 ${feature.color}`} />
                      </div>
                      <Badge 
                        variant="secondary" 
                        className="bg-gray-100/80 text-gray-700 dark:bg-gray-800/80 dark:text-gray-300"
                      >
                        {feature.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
