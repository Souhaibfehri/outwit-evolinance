import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { GitBranch, Calendar, Star, ArrowRight, Zap } from 'lucide-react'

export const metadata = {
  title: 'Changelog - Outwit Budget',
  description: 'Track all updates, new features, and improvements to Outwit Budget.',
}

export default function ChangelogPage() {
  const updates = [
    {
      version: '1.0.0',
      date: 'September 19, 2025',
      type: 'major',
      title: 'Initial Launch',
      description: 'Complete budgeting platform with zero-based budgeting, debt payoff, and goal tracking.',
      features: [
        'Zero-based budgeting with Ready to Assign tracking',
        'Advanced debt payoff calculator (Avalanche/Snowball)',
        'Goal tracking with progress visualization',
        'Transaction management with CSV import/export',
        'Comprehensive dashboard with financial insights',
        'Dark/light theme support',
        'Mobile-responsive design'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
            <GitBranch className="mr-1 h-3 w-3" />
            Changelog
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Product 
            <span className="text-orange-500"> Updates</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Stay up to date with new features, improvements, and bug fixes for Outwit Budget.
          </p>
        </div>

        {/* Updates */}
        <div className="space-y-8">
          {updates.map((update, index) => (
            <Card key={index} className="border-orange-200 dark:border-orange-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge 
                      className={`${
                        update.type === 'major' 
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' 
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}
                    >
                      v{update.version}
                    </Badge>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {update.title}
                    </h2>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span>{update.date}</span>
                  </div>
                </div>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  {update.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">New Features & Improvements:</h3>
                  <ul className="space-y-2">
                    {update.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                        <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Subscribe to Updates */}
        <Card className="mt-12 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-8 text-center">
            <Star className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Stay Updated
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Be the first to know about new features, improvements, and financial tips.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                <Zap className="mr-2 h-4 w-4" />
                Subscribe to Updates
              </Button>
              <Link href="/signup">
                <Button variant="outline">
                  Try Outwit Budget
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
