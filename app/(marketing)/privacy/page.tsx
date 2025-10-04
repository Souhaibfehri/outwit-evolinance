import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Shield, Lock, Eye, Database } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy - Outwit Budget',
  description: 'Learn how Outwit Budget protects your privacy and keeps your financial data secure.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
            <Shield className="mr-1 h-3 w-3" />
            Privacy Policy
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Your Privacy is Our 
            <span className="text-orange-500"> Priority</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            We believe your financial data should remain private. Here's how we protect your information.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Last updated: September 19, 2025
          </p>
        </div>

        {/* Privacy Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <Lock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Bank-Grade Encryption
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                All your data is encrypted both in transit and at rest using industry-standard AES-256 encryption.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  No Data Sharing
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                We never sell, rent, or share your personal financial information with third parties.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Minimal Data Collection
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                We only collect what's necessary to provide our service. No tracking, no profiling, no ads.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  GDPR Compliant
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Full compliance with GDPR, CCPA, and other privacy regulations. You control your data.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Policy */}
        <div className="space-y-8">
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Information We Collect</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Account Information</h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Email address (for account access)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Display name (optional)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Timezone and currency preferences</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Financial Data</h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Budget categories and amounts</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Transaction records (encrypted)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Goals and debt information</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">How We Protect Your Data</h2>
              
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p>
                  <strong className="text-gray-900 dark:text-white">Encryption:</strong> All data is encrypted using AES-256 encryption both in transit (HTTPS) and at rest.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Access Controls:</strong> Strict access controls ensure only you can access your financial data.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Regular Audits:</strong> We conduct regular security audits and vulnerability assessments.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">No Third-Party Access:</strong> We never grant third-party access to your personal financial information.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Rights</h2>
              
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p>
                  <strong className="text-gray-900 dark:text-white">Data Access:</strong> You can request a copy of all your data at any time.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Data Deletion:</strong> You can delete your account and all associated data permanently.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Data Portability:</strong> Export your data in standard formats to move to other services.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Correction:</strong> Update or correct any inaccurate information in your account.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact */}
        <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Questions About Privacy?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Contact our privacy team if you have any questions about how we handle your data.
            </p>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              Contact Privacy Team
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
