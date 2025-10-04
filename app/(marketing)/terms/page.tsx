import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Scale, Users, AlertTriangle } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service - Outwit Budget',
  description: 'Terms and conditions for using Outwit Budget personal finance management software.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
            <FileText className="mr-1 h-3 w-3" />
            Terms of Service
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Terms of 
            <span className="text-orange-500"> Service</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Fair, transparent terms that protect both you and us while you use Outwit Budget.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Last updated: September 19, 2025
          </p>
        </div>

        {/* Key Points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="border-orange-200 dark:border-orange-800">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Scale className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Fair Usage
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Use Outwit Budget for personal financial management within reasonable limits.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Account Sharing
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Each account is for individual use. Family plans available for multiple users.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Service Availability
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                We strive for 99.9% uptime but cannot guarantee uninterrupted service.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Terms */}
        <div className="space-y-8">
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">1. Acceptance of Terms</h2>
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p>
                  By accessing and using Outwit Budget, you accept and agree to be bound by the terms and provision of this agreement.
                </p>
                <p>
                  If you do not agree to abide by the above, please do not use this service.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">2. Service Description</h2>
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p>
                  Outwit Budget is a personal finance management application that provides budgeting, expense tracking, 
                  debt management, and goal-setting tools.
                </p>
                <p>
                  We provide the software and hosting infrastructure, but you are responsible for the accuracy 
                  of your financial data and decisions made based on the information in the app.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">3. User Responsibilities</h2>
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p>
                  <strong className="text-gray-900 dark:text-white">Account Security:</strong> You are responsible for maintaining the confidentiality of your account and password.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Accurate Information:</strong> Provide accurate and complete information when using our service.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Lawful Use:</strong> Use the service only for lawful purposes and in accordance with these terms.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Backup:</strong> While we maintain backups, you should keep your own records of important financial data.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">4. Payment Terms</h2>
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p>
                  <strong className="text-gray-900 dark:text-white">Free Trial:</strong> New users receive a 7-day free trial with full access to all features.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Subscription Plans:</strong> Monthly ($9) and yearly ($39) subscriptions are billed in advance.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Lifetime Plan:</strong> One-time payment of $49 for lifetime access to the current version.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Refunds:</strong> 30-day money-back guarantee for all paid plans.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">5. Limitation of Liability</h2>
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p>
                  Outwit Budget is provided "as is" without any warranties. We are not liable for any financial 
                  decisions made based on information in the app.
                </p>
                <p>
                  Our liability is limited to the amount you paid for the service in the 12 months preceding any claim.
                </p>
                <p>
                  <strong className="text-orange-600 dark:text-orange-400">Important:</strong> Outwit Budget is a tool to help you manage your finances, 
                  but it does not constitute financial advice. Always consult with qualified professionals for financial planning.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">6. Contact Information</h2>
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p>
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <ul className="space-y-2">
                  <li><strong>Email:</strong> legal@outwitbudget.com</li>
                  <li><strong>Address:</strong> [Company Address]</li>
                  <li><strong>Response Time:</strong> We aim to respond within 48 hours</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact */}
        <Card className="mt-12 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Questions About These Terms?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Our legal team is here to help clarify any questions you may have.
            </p>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              Contact Legal Team
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
