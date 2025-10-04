'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Database,
  Shield,
  ExternalLink
} from 'lucide-react'

export default function ErrorPage() {
  const [errorInfo, setErrorInfo] = useState<any>(null)

  useEffect(() => {
    // Get error info from URL params
    const params = new URLSearchParams(window.location.search)
    setErrorInfo({
      code: params.get('code'),
      message: params.get('message'),
      id: params.get('id'),
      timestamp: new Date().toISOString()
    })
  }, [])

  const handleRetry = () => {
    window.location.href = '/dashboard'
  }

  const handleMigrate = () => {
    window.location.href = '/migrate'
  }

  const clearBrowserData = () => {
    if (confirm('This will clear all browser data for this site. Continue?')) {
      localStorage.clear()
      sessionStorage.clear()
      // Clear cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      })
      alert('Browser data cleared! Refreshing...')
      window.location.reload()
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="text-center mb-8">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Application Error</h1>
        <p className="text-muted-foreground">
          We encountered an issue while loading the application
        </p>
      </div>

      <div className="space-y-6">
        {/* Error Details */}
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <div>
              <strong>Error Code:</strong> {errorInfo?.code || 'UNKNOWN'}<br />
              <strong>Error ID:</strong> {errorInfo?.id || 'N/A'}<br />
              <strong>Time:</strong> {errorInfo?.timestamp}
            </div>
          </AlertDescription>
        </Alert>

        {/* Common Solutions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                Header Size Issue?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                If you're seeing REQUEST_HEADER_TOO_LARGE or 431 errors, 
                your data needs to be migrated to the database.
              </p>
              <Button 
                onClick={handleMigrate}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Database className="h-4 w-4 mr-2" />
                Fix with Migration
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-green-600" />
                Browser Issue?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Sometimes clearing browser data resolves authentication 
                and caching issues.
              </p>
              <Button 
                onClick={clearBrowserData}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Browser Data
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleRetry}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Home className="h-4 w-4 mr-2" />
                Try Dashboard Again
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/login'}
                className="flex-1"
              >
                <Shield className="h-4 w-4 mr-2" />
                Re-authenticate
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.open('mailto:support@outwitbudget.com', '_blank')}
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Technical Information */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <div><strong>Error Code:</strong> {errorInfo?.code || 'MIDDLEWARE_INVOCATION_FAILED'}</div>
              <div><strong>Common Causes:</strong></div>
              <ul className="list-disc list-inside ml-4 space-y-1 text-gray-600">
                <li>Large user metadata causing header size limits</li>
                <li>Authentication service timeout</li>
                <li>Network connectivity issues</li>
                <li>Browser cache corruption</li>
              </ul>
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <strong>Recommended:</strong> Try the migration option first, as it solves the most common cause of this error.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
