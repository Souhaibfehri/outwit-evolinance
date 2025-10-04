'use client'

import { Card, CardContent } from '@/components/ui/card'
import { UserPlus, Settings, Target } from 'lucide-react'
import { motion } from 'framer-motion'

const steps = [
  {
    icon: UserPlus,
    title: 'Sign Up',
    description: 'Create your account in under 60 seconds. No credit card required for the 7-day trial.'
  },
  {
    icon: Settings,
    title: 'Quick Setup',
    description: 'Complete our 6-step onboarding wizard. Add your income, bills, debts, and goals.'
  },
  {
    icon: Target,
    title: 'Take Control',
    description: 'Start budgeting with confidence. Track progress and achieve your financial goals.'
  }
]

export function Steps() {
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
            Get started in{' '}
            <span className="bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent">
              3 simple steps
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="mt-4 text-xl text-gray-600 dark:text-gray-300"
          >
            From signup to full financial control in under 5 minutes
          </motion.p>
        </div>

        <div className="relative">
          {/* Connection Lines */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-500/20 via-purple-500/20 to-blue-500/20 -translate-y-1/2" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <Card className="bg-white/80 backdrop-blur-xl border border-gray-200/50 dark:bg-gray-900/80 dark:border-gray-800/50 hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 text-center p-8">
                    <CardContent className="space-y-6">
                      {/* Step Number */}
                      <div className="relative">
                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-purple-600 text-white font-bold text-xl shadow-lg">
                          {index + 1}
                        </div>
                        <div className="absolute -inset-4 bg-gradient-to-br from-teal-500/20 to-purple-600/20 rounded-full blur-xl -z-10" />
                      </div>

                      {/* Icon */}
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                        <Icon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                      </div>

                      {/* Content */}
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {step.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
