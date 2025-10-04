import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  BookOpen, 
  Play, 
  FileText, 
  HelpCircle, 
  Zap,
  ArrowRight,
  CheckCircle
} from 'lucide-react'

export const metadata = {
  title: 'Documentation - Outwit Budget',
  description: 'Learn how to master your finances with Outwit Budget. Complete guides, tutorials, and best practices for zero-based budgeting.',
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
            <BookOpen className="mr-1 h-3 w-3" />
            Documentation
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Master Your Money with 
            <span className="text-orange-500"> Outwit Budget</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Everything you need to know to take control of your finances. From getting started to advanced strategies.
          </p>
        </div>

        {/* Quick Start */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Quick Start</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 dark:text-orange-400 font-bold">1</span>
                  </div>
                  <CardTitle className="text-lg">Sign Up & Onboard</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Create your account and complete our 6-step onboarding wizard to set up your financial foundation.
                </p>
                <Link href="/signup">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-teal-600 dark:text-teal-400 font-bold">2</span>
                  </div>
                  <CardTitle className="text-lg">Set Your Budget</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Assign every dollar a job using our zero-based budgeting system. Start with default categories or create your own.
                </p>
                <Button variant="outline">
                  Learn Zero-Based Budgeting
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 dark:text-purple-400 font-bold">3</span>
                  </div>
                  <CardTitle className="text-lg">Track & Optimize</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Log transactions, monitor progress, and use our smart recommendations to optimize your financial health.
                </p>
                <Button variant="outline">
                  View Features
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Documentation Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Getting Started */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Play className="h-5 w-5 text-orange-500" />
                <span>Getting Started</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Link href="#setup" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <span className="text-gray-900 dark:text-white">Account Setup</span>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </Link>
                <Link href="#onboarding" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <span className="text-gray-900 dark:text-white">Onboarding Guide</span>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </Link>
                <Link href="#first-budget" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <span className="text-gray-900 dark:text-white">Your First Budget</span>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Core Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-orange-500" />
                <span>Core Features</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Link href="#zero-based" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <span className="text-gray-900 dark:text-white">Zero-Based Budgeting</span>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </Link>
                <Link href="#debt-payoff" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <span className="text-gray-900 dark:text-white">Debt Payoff Strategies</span>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </Link>
                <Link href="#goals" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <span className="text-gray-900 dark:text-white">Goal Tracking</span>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What is zero-based budgeting?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Zero-based budgeting means every dollar you earn gets assigned a specific job before you spend it. 
                  Your income minus your outgo should equal zero. This ensures you're intentional with every dollar and helps prevent overspending.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How does Outwit Budget protect my privacy?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  We use bank-grade encryption and never share your data with third parties. Your financial information 
                  stays private and secure. We don't sell data to advertisers or use it for marketing purposes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I import data from other budgeting apps?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Yes! You can import transactions via CSV files from most banking and budgeting apps. 
                  We also provide migration guides for popular apps like YNAB, Mint, and EveryDollar.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact Support */}
        <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-8 text-center">
            <HelpCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Need More Help?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Can't find what you're looking for? Our support team is here to help you succeed.
            </p>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
