import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import { 
  PiggyBank, 
  TrendingDown, 
  Target, 
  CreditCard, 
  BarChart3, 
  Shield,
  CheckCircle,
  Zap,
  Building2,
  Bell,
  Sparkles,
  ArrowRight
} from 'lucide-react'

const features = [
  {
    id: 'budgeting',
    icon: PiggyBank,
    title: 'Zero-Based Budgeting',
    subtitle: 'Assign every dollar a purpose',
    description: 'Master the proven zero-based budgeting method where every dollar of income is assigned to categories before you spend. Track your Ready-to-Assign amount and ensure your budget always balances.',
    benefits: [
      'Assign every dollar to categories for complete control',
      'Real-time Ready-to-Assign tracking',
      'Category groups (Essentials, Lifestyle, Savings)',
      'Rollover logic for unused budget',
      'Budget vs actual comparisons with visual indicators'
    ],
    badge: 'Core Feature',
    color: 'text-teal-600 dark:text-teal-400'
  },
  {
    id: 'debts',
    icon: TrendingDown,
    title: 'Smart Debt Payoff',
    subtitle: 'Become debt-free faster with proven strategies',
    description: 'Compare Avalanche vs Snowball debt payoff methods with interactive calculators. See exactly when you\'ll be debt-free and how much you\'ll save in interest.',
    benefits: [
      'Avalanche method for minimum interest paid',
      'Snowball method for psychological wins',
      'Interactive payoff timeline calculator',
      'Interest savings projections',
      'Support for loans and credit cards',
      'Optional minimum payment tracking'
    ],
    badge: 'Advanced',
    color: 'text-red-600 dark:text-red-400'
  },
  {
    id: 'goals',
    icon: Target,
    title: 'Goal Tracking',
    subtitle: 'Achieve your financial dreams',
    description: 'Set and track savings goals with beautiful progress visualization. Prioritize goals, set deadlines, and celebrate milestones as you work toward financial freedom.',
    benefits: [
      'Visual progress tracking with animated bars',
      '5-star priority system for goal ranking',
      'Quick money additions with instant updates',
      'Auto-save features for automated funding',
      'Deadline tracking with status indicators',
      'Milestone celebrations at 25%, 50%, 75%, 100%'
    ],
    badge: 'Popular',
    color: 'text-purple-600 dark:text-purple-400'
  },
  {
    id: 'transactions',
    icon: CreditCard,
    title: 'Transaction Management',
    subtitle: 'Track every penny with ease',
    description: 'Comprehensive transaction management with support for multiple accounts. Import bank statements via CSV or add transactions manually with smart categorization.',
    benefits: [
      'Full CRUD operations for all transactions',
      'Multiple account support with balance tracking',
      'CSV import/export for bank statements',
      'Smart categorization with budget integration',
      'Income, expense, and transfer support',
      'Transaction search and filtering'
    ],
    badge: 'Essential',
    color: 'text-blue-600 dark:text-blue-400'
  },
  {
    id: 'reports',
    icon: BarChart3,
    title: 'Detailed Reports',
    subtitle: 'Insights that drive better decisions',
    description: 'Get comprehensive insights into your spending patterns, budget performance, and financial health. Make data-driven decisions about your money.',
    benefits: [
      'Financial health scoring system',
      'Spending pattern analysis',
      'Budget vs actual performance reports',
      'Goal progress tracking over time',
      'Debt-to-income ratio monitoring',
      'Custom date range reporting'
    ],
    badge: 'Insights',
    color: 'text-green-600 dark:text-green-400'
  },
  {
    id: 'privacy',
    icon: Shield,
    title: 'Privacy-First',
    subtitle: 'Your data stays yours, always',
    description: 'Built with privacy as a core principle. Your financial data is encrypted, never shared, and you maintain complete control. No ads, no data selling, no compromises.',
    benefits: [
      'Bank-grade encryption for all data',
      'No data sharing or selling ever',
      'Local data processing when possible',
      'Transparent privacy policy',
      'GDPR and CCPA compliant',
      'You own your data completely'
    ],
    badge: 'Guaranteed',
    color: 'text-orange-600 dark:text-orange-400'
  }
]

export default function FeaturesPage() {
  return (
    <div className="py-20 lg:py-32">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="text-center mb-20">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
            Powerful features for{' '}
            <span className="bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent">
              complete financial control
            </span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Everything you need to budget smarter, pay off debt faster, and achieve your financial goals—all in one beautiful, privacy-first application.
          </p>
        </div>

        {/* Feature Sections */}
        <div className="space-y-32">
          {features.map((feature, index) => {
            const Icon = feature.icon
            const isEven = index % 2 === 0
            
            return (
              <section key={feature.id} id={feature.id} className="scroll-mt-20">
                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${isEven ? '' : 'lg:grid-flow-col-dense'}`}>
                  {/* Content */}
                  <div className={`space-y-6 ${isEven ? '' : 'lg:col-start-2'}`}>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700`}>
                          <Icon className={`h-6 w-6 ${feature.color}`} />
                        </div>
                        <Badge 
                          variant="secondary" 
                          className="bg-gray-100/80 text-gray-700 dark:bg-gray-800/80 dark:text-gray-300"
                        >
                          {feature.badge}
                        </Badge>
                      </div>
                      
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white lg:text-4xl">
                        {feature.title}
                      </h2>
                      
                      <p className="text-xl text-gray-600 dark:text-gray-300">
                        {feature.subtitle}
                      </p>
                    </div>

                    <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>

                    <ul className="space-y-3">
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-start space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Screenshot Placeholder */}
                  <div className={`${isEven ? '' : 'lg:col-start-1 lg:row-start-1'}`}>
                    <Card className="bg-white/80 backdrop-blur-xl border border-gray-200/50 dark:bg-gray-900/80 dark:border-gray-800/50 overflow-hidden shadow-2xl">
                      <CardContent className="p-0">
                        <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                          <div className="text-center space-y-4">
                            <Icon className={`h-16 w-16 ${feature.color} mx-auto`} />
                            <div className="space-y-2">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {feature.title} Screenshot
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Interactive demo coming soon
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </section>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-32 text-center">
          <Card className="bg-white/80 backdrop-blur-xl border border-gray-200/50 dark:bg-gray-900/80 dark:border-gray-800/50 p-12">
            <CardContent className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Ready to experience these features?
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Start your 7-day free trial and see how Outwit Budget can transform your financial life.
              </p>
              <Link href="/signup">
                <Button 
                  size="lg"
                  className="bg-teal-600 hover:bg-teal-700 text-white dark:bg-teal-500 dark:hover:bg-teal-600 px-8 py-3 text-lg font-semibold"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
