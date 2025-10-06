'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  AlertTriangle,
  ExternalLink
} from 'lucide-react'

export default function ProductionFixPage() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<any>(null)

  const testEndpoints = async () => {
    setTesting(true)
    setResults(null)

    const endpoints = [
      { name: 'Health Check', url: '/api/health-check' },
      { name: 'Budget API', url: '/api/budget' },
      { name: 'Dashboard API', url: '/api/dashboard/summary' },
      { name: 'Forecast API', url: '/api/forecast' },
      { name: 'Settings Test', url: '/settings' },
      { name: 'Budget Page', url: '/budget' }
    ]

    const results = []

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint.url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        results.push({
          name: endpoint.name,
          url: endpoint.url,
          status: response.status,
          success: response.ok,
          error: response.ok ? null : `HTTP ${response.status}`
        })
      } catch (error) {
        results.push({
          name: endpoint.name,
          url: endpoint.url,
          status: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    setResults(results)
    setTesting(false)
  }

  const clearCookies = async () => {
    try {
      await fetch('/api/emergency/clear-cookies', { method: 'POST' })
      alert('Cookies cleared! Please refresh the page.')
      window.location.reload()
    } catch (error) {
      alert('Failed to clear cookies: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              Production Fix & Diagnostics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This page helps diagnose and fix production issues. Error ID 3769306171 indicates a runtime error.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={testEndpoints} 
                disabled={testing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {testing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Test All Endpoints
                  </>
                )}
              </Button>

              <Button 
                onClick={clearCookies}
                variant="outline"
                className="border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Clear All Cookies
              </Button>
            </div>
          </CardContent>
        </Card>

        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.map((result: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <div className="font-medium">{result.name}</div>
                        <div className="text-sm text-muted-foreground">{result.url}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {result.success ? (
                        <span className="text-green-600 font-medium">✓ Working</span>
                      ) : (
                        <div>
                          <div className="text-red-600 font-medium">✗ Failed</div>
                          <div className="text-xs text-red-500">{result.error}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <h3 className="font-semibold mb-2">Next Steps:</h3>
                <ul className="text-sm space-y-1">
                  <li>• If most endpoints fail, there's a general server issue</li>
                  <li>• If only auth endpoints fail, there's an authentication problem</li>
                  <li>• If pages fail but APIs work, there's a client-side issue</li>
                  <li>• Try clearing cookies and testing again</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Fixes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/clear-cookies'}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Go to Cookie Clearing Page
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/fix-now'}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Go to Emergency Fix Page
            </Button>

            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/dashboard'}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Try Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
