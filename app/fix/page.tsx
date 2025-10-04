'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Zap, 
  ArrowRight,
  Database,
  RefreshCw
} from 'lucide-react'

export default function FixPage() {
  useEffect(() => {
    // Auto-redirect to header fix after 3 seconds
    const timer = setTimeout(() => {
      window.location.href = '/fix-headers'
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="container mx-auto py-12 px-4 max-w-2xl">
      <div className="text-center mb-8">
        <Zap className="h-16 w-16 text-orange-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Fix Production Errors</h1>
        <p className="text-muted-foreground">
          Resolving header size and middleware errors...
        </p>
      </div>

      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-center text-orange-800">
            🚨 Detected Production Issues
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div>
            <p className="text-orange-700 mb-4">
              You're experiencing header size errors. We'll help you fix this immediately.
            </p>
            
            <div className="flex items-center justify-center gap-2 text-sm text-orange-600 mb-4">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Auto-redirecting to fix page in 3 seconds...</span>
            </div>
          </div>

          <div className="grid gap-3">
            <Button 
              onClick={() => window.location.href = '/fix-headers'}
              className="bg-orange-600 hover:bg-orange-700 text-white"
              size="lg"
            >
              <Zap className="h-4 w-4 mr-2" />
              Fix Header Size Issues
            </Button>
            
            <Button 
              onClick={() => window.location.href = '/migrate-simple'}
              variant="outline"
              size="lg"
            >
              <Database className="h-4 w-4 mr-2" />
              Advanced Migration
            </Button>
            
            <Button 
              onClick={() => window.location.href = '/dashboard'}
              variant="ghost"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Try Dashboard Anyway
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="text-xs text-gray-600 space-y-2">
            <div><strong>Common Error Codes:</strong></div>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>HTTP 431:</strong> REQUEST_HEADER_TOO_LARGE</li>
              <li><strong>HTTP 500:</strong> MIDDLEWARE_INVOCATION_FAILED</li>
              <li><strong>HTTP 431:</strong> This Request has too large of headers</li>
            </ul>
            <div className="mt-3 p-2 bg-gray-50 rounded text-center">
              <strong>Solution:</strong> Reduce metadata size to under 16KB per header
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
