'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, X, Crown, Star } from 'lucide-react'
import { motion } from 'framer-motion'

const features = [
  { name: 'Zero-Based Budgeting', outwit: true, ynab: true, everydollar: true },
  { name: 'Smart Debt Payoff Strategies', outwit: true, ynab: false, everydollar: false },
  { name: 'Flexible Goal Tracking', outwit: true, ynab: true, everydollar: true },
  { name: 'CSV Import/Export', outwit: true, ynab: true, everydollar: false },
  { name: 'Privacy-First (No Data Sharing)', outwit: true, ynab: true, everydollar: false },
  { name: 'Lifetime Purchase Option', outwit: true, ynab: false, everydollar: false },
  { name: 'Educational Financial Tips', outwit: true, ynab: false, everydollar: false },
  { name: 'Quick Catch-Up Features', outwit: true, ynab: false, everydollar: false },
  { name: 'Bank Sync', outwit: 'Coming Soon', ynab: true, everydollar: true },
  { name: 'Mobile Apps', outwit: 'Coming Soon', ynab: true, everydollar: true },
]

const pricing = [
  { name: 'Free Trial', outwit: '7 days', ynab: '34 days', everydollar: 'Limited' },
  { name: 'Monthly Price', outwit: '$9', ynab: '$14', everydollar: '$8' },
  { name: 'Yearly Price', outwit: '$39/year', ynab: '$99/year', everydollar: '$80/year' },
  { name: 'Lifetime Option', outwit: '$49 once', ynab: '—', everydollar: '—' },
]

function FeatureIcon({ value }: { value: boolean | string }) {
  if (value === true) {
    return <Check className="h-5 w-5 text-green-500" />
  } else if (value === false) {
    return <X className="h-5 w-5 text-gray-400" />
  } else if (typeof value === 'string' && value !== '—') {
    return <Badge variant="outline" className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
      {value}
    </Badge>
  } else {
    return <span className="text-gray-400 text-sm">—</span>
  }
}

export function Comparison() {
  return (
    <section className="py-20 lg:py-32 gradient-background">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl lg:text-5xl mb-4"
          >
            How we{' '}
            <span className="bg-gradient-to-r from-orange-500 to-teal-600 bg-clip-text text-transparent">
              compare
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
          >
            See how Outwit Budget stacks up against the competition
          </motion.p>
        </div>

        {/* Feature Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <Card className="card-gradient border-0 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-6 px-6 font-semibold text-gray-900 dark:text-white">
                        Features
                      </th>
                      <th className="text-center py-6 px-4 relative">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-2 mb-2">
                            <Crown className="h-5 w-5 text-orange-500" />
                            <span className="font-bold text-gray-900 dark:text-white">Outwit Budget</span>
                          </div>
                          <Badge className="gradient-primary text-white border-0 text-xs">
                            That's us!
                          </Badge>
                        </div>
                        {/* Highlight column */}
                        <div className="absolute inset-0 bg-gradient-to-b from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 opacity-20 -z-10" />
                      </th>
                      <th className="text-center py-6 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        YNAB
                      </th>
                      <th className="text-center py-6 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        EveryDollar
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {features.map((feature, index) => (
                      <motion.tr
                        key={feature.name}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        viewport={{ once: true }}
                        className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                          index % 2 === 0 ? 'bg-gray-25 dark:bg-gray-900/25' : ''
                        }`}
                      >
                        <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">
                          {feature.name}
                        </td>
                        <td className="text-center py-4 px-4 relative">
                          <FeatureIcon value={feature.outwit} />
                          <div className="absolute inset-0 bg-gradient-to-b from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 opacity-10 -z-10" />
                        </td>
                        <td className="text-center py-4 px-4">
                          <FeatureIcon value={feature.ynab} />
                        </td>
                        <td className="text-center py-4 px-4">
                          <FeatureIcon value={feature.everydollar} />
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pricing Comparison Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Pricing Comparison
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Choose the plan that works best for you
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Outwit Budget Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              viewport={{ once: true }}
            >
              <Card className="card-hover card-gradient border-0 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 gradient-primary" />
                <div className="absolute top-4 right-4">
                  <Badge className="gradient-primary text-white border-0">
                    <Star className="h-3 w-3 mr-1" />
                    Best Value
                  </Badge>
                </div>
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Outwit Budget
                    </h4>
                    <div className="text-3xl font-bold gradient-primary bg-clip-text text-transparent mb-2">
                      $39/year
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      or $49 lifetime
                    </p>
                  </div>
                  <div className="space-y-3 mb-8">
                    {pricing.map((item) => (
                      <div key={item.name} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-300">{item.name}:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{item.outwit}</span>
                      </div>
                    ))}
                  </div>
                  <button className="btn-primary w-full py-3 px-6 rounded-xl font-semibold">
                    Start Free Trial
                  </button>
                </CardContent>
              </Card>
            </motion.div>

            {/* YNAB Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="card-hover card-gradient border-0">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      YNAB
                    </h4>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      $99/year
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      No lifetime option
                    </p>
                  </div>
                  <div className="space-y-3 mb-8">
                    {pricing.map((item) => (
                      <div key={item.name} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-300">{item.name}:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{item.ynab}</span>
                      </div>
                    ))}
                  </div>
                  <button className="w-full py-3 px-6 rounded-xl font-semibold border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    Visit YNAB
                  </button>
                </CardContent>
              </Card>
            </motion.div>

            {/* EveryDollar Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              viewport={{ once: true }}
            >
              <Card className="card-hover card-gradient border-0">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      EveryDollar
                    </h4>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      $80/year
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      No lifetime option
                    </p>
                  </div>
                  <div className="space-y-3 mb-8">
                    {pricing.map((item) => (
                      <div key={item.name} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-300">{item.name}:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{item.everydollar}</span>
                      </div>
                    ))}
                  </div>
                  <button className="w-full py-3 px-6 rounded-xl font-semibold border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    Visit EveryDollar
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            Ready to take control of your financial future?
          </p>
          <button className="btn-primary px-8 py-4 rounded-xl font-semibold text-lg">
            Start Your Free Trial Today
          </button>
        </motion.div>
      </div>
    </section>
  )
}