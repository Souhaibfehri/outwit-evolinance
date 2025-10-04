'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Crown, Sparkles, ArrowLeft, CreditCard } from 'lucide-react'

const planDetails = {
  monthly: {
    name: 'Monthly Plan',
    price: '$9',
    period: 'per month',
    description: 'Full access, billed monthly',
    features: ['All budgeting features', 'Debt payoff calculator', 'Goal tracking', 'Priority support'],
    total: '$9.00'
  },
  yearly: {
    name: 'Yearly Plan',
    price: '$39',
    period: 'per year',
    description: 'Save 64% with annual billing',
    features: ['All monthly features', 'Save $69 per year', '2 months free', 'Priority support'],
    total: '$39.00',
    savings: 'Save $69 vs monthly'
  },
  lifetime: {
    name: 'Lifetime Access',
    price: '$49',
    period: 'one-time payment',
    description: 'Pay once, own forever',
    features: ['All yearly features', 'Lifetime access', 'All future updates', 'Premium support for life'],
    total: '$49.00',
    savings: 'Save $146+ over 5 years'
  }
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') as keyof typeof planDetails || 'monthly'
  const selectedPlan = planDetails[plan]

  if (!selectedPlan) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Invalid Plan</h1>
        <Link href="/pricing">
          <Button>Back to Pricing</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="py-20 lg:py-32">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/pricing" className="inline-flex items-center text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pricing
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Complete Your Order
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            You're one step away from taking control of your finances
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card className="bg-white/80 backdrop-blur-xl border border-gray-200/50 dark:bg-gray-900/80 dark:border-gray-800/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  Order Summary
                </CardTitle>
                {plan === 'yearly' && (
                  <Badge className="bg-teal-600 text-white">
                    <Crown className="mr-1 h-3 w-3" />
                    Best Value
                  </Badge>
                )}
                {plan === 'lifetime' && (
                  <Badge className="bg-purple-600 text-white">
                    <Sparkles className="mr-1 h-3 w-3" />
                    Limited Time
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{selectedPlan.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedPlan.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 dark:text-white">{selectedPlan.price}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{selectedPlan.period}</div>
                  </div>
                </div>

                {selectedPlan.savings && (
                  <div className="bg-green-50/50 dark:bg-green-900/20 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        {selectedPlan.savings}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200/50 dark:border-gray-800/50 pt-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">What's included:</h4>
                <ul className="space-y-2">
                  {selectedPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-gray-200/50 dark:border-gray-800/50 pt-4">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span className="text-gray-900 dark:text-white">Total:</span>
                  <span className="text-gray-900 dark:text-white">{selectedPlan.total}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Checkout Form Placeholder */}
          <Card className="bg-white/80 backdrop-blur-xl border border-gray-200/50 dark:bg-gray-900/80 dark:border-gray-800/50">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Payment Details</span>
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Secure checkout powered by Stripe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Placeholder for Stripe Elements */}
              <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-lg p-8 text-center space-y-4">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto" />
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Payment Integration Coming Soon
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Stripe checkout will be integrated here for secure payment processing
                  </p>
                </div>
                
                {/* Placeholder checkout button */}
                <div className="space-y-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 bg-yellow-50/50 dark:bg-yellow-900/20 rounded p-2">
                    {/* TODO: Integrate Stripe Checkout */}
                    {/* This is where Stripe Elements would be rendered */}
                    {/* const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!) */}
                    {/* const { error } = await stripe.redirectToCheckout({ sessionId }) */}
                  </div>
                  
                  <Link href={`/signup?plan=${plan}`}>
                    <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                      Continue to Sign Up
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="space-y-3 text-center">
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                    <span>SSL Encrypted</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="h-2 w-2 bg-blue-500 rounded-full" />
                    <span>30-day guarantee</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Secure payment processing by Stripe. Cancel anytime.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="py-20 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
