import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Play, Monitor, ArrowRight, Eye } from 'lucide-react'

export const metadata = {
  title: 'Demo - Outwit Budget',
  description: 'See Outwit Budget in action with our interactive demo and feature walkthrough.',
}

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
            <Play className="mr-1 h-3 w-3" />
            Demo
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            See Outwit Budget in 
            <span className="text-orange-500"> Action</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Experience the power of zero-based budgeting with our interactive demo and feature walkthrough.
          </p>
        </div>

        {/* Demo Coming Soon */}
        <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Monitor className="h-10 w-10 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Interactive Demo Coming Soon!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              We're building an amazing interactive demo that will let you explore all of Outwit Budget's features 
              without signing up. In the meantime, why not start your free trial?
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3">
                  Start Free Trial Instead
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/features">
                <Button variant="outline">
                  <Eye className="mr-2 h-4 w-4" />
                  View Features
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* What the Demo Will Include */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            What the Demo Will Include
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  🎯 Zero-Based Budget Setup
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  See how to assign every dollar a job and reach that satisfying $0.00 Ready to Assign.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  💳 Smart Debt Payoff
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Compare Avalanche vs Snowball strategies and see how much you'll save in interest.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  🎯 Goal Tracking
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Set up financial goals and watch your progress with visual indicators and milestones.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  📊 Financial Insights
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Explore the dashboard with real-time financial health scores and actionable recommendations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
