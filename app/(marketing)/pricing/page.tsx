import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Check, Crown, Sparkles, Zap, Shield, Target, Star } from 'lucide-react'

const plans = [
  {
    name: 'Free Trial',
    price: 'Free',
    period: '7 days',
    description: 'Try all features risk-free',
    features: [
      'Complete zero-based budgeting',
      'Debt payoff calculator',
      'Goal tracking & progress',
      'Transaction management',
      'CSV import/export',
      'All reports & insights',
      'Email support'
    ],
    cta: 'Start Free Trial',
    href: '/signup?trial=true',
    popular: false,
    highlight: false,
    gradient: 'gradient-info',
    icon: Shield
  },
  {
    name: 'Yearly',
    price: '$39',
    period: 'per year',
    originalPrice: '$108',
    description: 'Best value - save 64%',
    features: [
      'Everything in Free Trial',
      'Unlimited accounts & categories',
      'Advanced debt strategies',
      'Priority goal tracking',
      'Custom reports & analytics',
      'Priority email support',
      'Mobile app access (coming soon)',
      '2 months free vs monthly'
    ],
    cta: 'Get Yearly Plan',
    href: '/checkout?plan=yearly',
    popular: true,
    highlight: true,
    gradient: 'gradient-success',
    icon: Star
  },
  {
    name: 'Monthly',
    price: '$9',
    period: 'per month',
    description: 'Full access, billed monthly',
    features: [
      'Everything in Free Trial',
      'Unlimited accounts & categories',
      'Advanced debt strategies',
      'Priority goal tracking',
      'Custom reports & analytics',
      'Priority email support',
      'Mobile app access (coming soon)'
    ],
    cta: 'Get Monthly',
    href: '/checkout?plan=monthly',
    popular: false,
    highlight: false,
    gradient: 'gradient-warning',
    icon: Zap
  },
  {
    name: 'Lifetime',
    price: '$49',
    period: 'one time',
    originalPrice: '$468',
    description: 'Pay once, own forever',
    features: [
      'Everything in Yearly Plan',
      'Lifetime access guarantee',
      'All future features included',
      'Priority feature requests',
      'Exclusive lifetime member perks',
      'No recurring payments ever',
      'Best long-term value'
    ],
    cta: 'Get Lifetime Access',
    href: '/checkout?plan=lifetime',
    popular: false,
    highlight: true,
    gradient: 'gradient-purple',
    icon: Crown
  }
]

const faqs = [
  {
    question: 'Can I switch plans anytime?',
    answer: 'Yes! You can upgrade, downgrade, or cancel your subscription at any time. Changes take effect at your next billing cycle.'
  },
  {
    question: 'What happens after my free trial?',
    answer: 'Your free trial gives you full access for 7 days. After that, you can choose a paid plan or your account will be limited to view-only mode.'
  },
  {
    question: 'Is the lifetime plan really lifetime?',
    answer: 'Absolutely! Pay once and get access forever, including all future features and updates. No recurring fees, ever.'
  },
  {
    question: 'Can I export my data?',
    answer: 'Yes! All plans include full data export capabilities. You can download your transactions, budgets, and reports as CSV files anytime.'
  },
  {
    question: 'Do you offer refunds?',
    answer: 'We offer a 30-day money-back guarantee on all paid plans. If you\'re not satisfied, we\'ll refund your payment in full.'
  },
  {
    question: 'Is my financial data secure?',
    answer: 'Your privacy is our priority. We use bank-grade encryption, never sell your data, and you can delete your account anytime.'
  }
]

export default function PricingPage() {
  return (
    <div className="gradient-background min-h-screen">
      <div className="container mx-auto max-w-7xl px-4 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl lg:text-6xl mb-6">
            Simple,{' '}
            <span className="bg-gradient-to-r from-orange-500 via-orange-600 to-teal-500 bg-clip-text text-transparent">
              Transparent
            </span>{' '}
            Pricing
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Choose the plan that fits your needs. Start with a free trial and upgrade anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-20">
          {plans.map((plan, index) => {
            const Icon = plan.icon
            return (
              <div
                key={plan.name}
                className="relative"
              >
                <Card className={`card-hover card-gradient border-0 relative overflow-hidden h-full ${
                  plan.highlight ? 'ring-2 ring-orange-500 ring-opacity-50' : ''
                }`}>
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 h-1 gradient-success" />
                  )}
                  {plan.popular && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="gradient-success text-white border-0 px-3 py-1">
                        <Star className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardContent className="p-8">
                    <div className="text-center mb-8">
                      <div className={`inline-flex p-3 rounded-2xl ${plan.gradient} mb-4`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {plan.name}
                      </h3>
                      <div className="mb-2">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                          {plan.price}
                        </span>
                        <span className="text-lg text-gray-600 dark:text-gray-300 ml-1">
                          {plan.period}
                        </span>
                      </div>
                      {plan.originalPrice && (
                        <div className="text-sm text-gray-500 line-through">
                          Was {plan.originalPrice}
                        </div>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                        {plan.description}
                      </p>
                    </div>

                    <div className="space-y-3 mb-8">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-3">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Link href={plan.href}>
                      <Button 
                        className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${
                          plan.highlight 
                            ? 'btn-primary' 
                            : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Everything you need to know about our pricing and features
            </p>
          </div>

          <Card className="card-gradient border-0">
            <CardContent className="p-8">
              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border-gray-200 dark:border-gray-700">
                    <AccordionTrigger className="text-left font-semibold text-gray-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Final CTA */}
        <div
          className="text-center mt-20"
        >
          <Card className="card-gradient border-0 max-w-2xl mx-auto">
            <CardContent className="p-12">
              <Sparkles className="h-12 w-12 text-orange-500 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Ready to transform your finances?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Join thousands of users who have taken control of their financial future with Outwit Budget.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button className="btn-primary px-8 py-3 rounded-xl font-semibold">
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button variant="outline" className="px-8 py-3 rounded-xl font-semibold">
                    View Demo
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Pricing - Outwit Budget',
  description: 'Simple, transparent pricing for personal finance management. Start with a free trial.',
}