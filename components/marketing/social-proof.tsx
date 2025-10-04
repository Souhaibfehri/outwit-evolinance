'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Star } from 'lucide-react'
import { motion } from 'framer-motion'

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Marketing Manager',
    content: 'Finally found a budgeting app that actually works for me. The debt payoff calculator helped me save $3,000 in interest!',
    rating: 5,
    initials: 'SJ'
  },
  {
    name: 'Mike Chen',
    role: 'Software Engineer',
    content: 'Love the zero-based approach. I can see exactly where every dollar goes and the goal tracking keeps me motivated.',
    rating: 5,
    initials: 'MC'
  },
  {
    name: 'Emily Rodriguez',
    role: 'Teacher',
    content: 'The privacy-first approach sold me. My financial data stays mine, and the interface is so much cleaner than other apps.',
    rating: 5,
    initials: 'ER'
  }
]

export function SocialProof() {
  return (
    <section className="py-20 lg:py-32 bg-gray-50/50 dark:bg-gray-900/50">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl lg:text-5xl"
          >
            Loved by{' '}
            <span className="bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent">
              thousands of users
            </span>
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="mt-4 flex items-center justify-center space-x-1"
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="h-6 w-6 text-yellow-400 fill-current" />
            ))}
            <span className="ml-2 text-lg text-gray-600 dark:text-gray-300 font-medium">
              4.9/5 average rating
            </span>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full bg-white/80 backdrop-blur-xl border border-gray-200/50 dark:bg-gray-900/80 dark:border-gray-800/50 hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  {/* Rating */}
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`h-4 w-4 ${
                          star <= testimonial.rating 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300 dark:text-gray-600'
                        }`} 
                      />
                    ))}
                  </div>

                  {/* Content */}
                  <blockquote className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    "{testimonial.content}"
                  </blockquote>

                  {/* Author */}
                  <div className="flex items-center space-x-3 pt-4 border-t border-gray-200/50 dark:border-gray-800/50">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                        {testimonial.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
