'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Trash2,
  Shield,
  Database,
  Cookie,
  Clock
} from 'lucide-react'

interface HealthStatus {
  status: 'healthy' | 'warning' | 'error'
  timestamp: string
  responseTime: string
  headers: {
    totalSize: number
    limit: number
    percentage: number
    breakdown: Record<string, number>
  }
  cookies: {
    totalSize: number
    limit: number
    percentage: number
    breakdown: Record<string, number>
    count: number
  }
  supabase: {
    status: string
    auth: string
  }
  recommendations: string[]
}

export default function EmergencyDashboard() {
  const [status, setStatus] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const checkStatus = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/emergency/status')
      const data = await response.json()
      setStatus(data)
    } catch (err) {
      setError('Failed to check status')
      console.error('Status check error:', err)
    } finally {
      setLoading(false)
    }
  }

  const clearAllCookies = async () => {
    try {
      await fetch('/api/emergency/clear-cookies', { method: 'POST' })
      // Clear client-side as well
      document.cookie.split(';').forEach(cookie => {
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;`
      })
      localStorage.clear()
      sessionStorage.clear()
      
      // Refresh status after clearing
      setTimeout(checkStatus, 1000)
    } catch (err) {
      console.error('Clear cookies error:', err)
    }
  }

  useEffect(() => {
    checkStatus()
    
    if (autoRefresh) {
      const interval = setInterval(checkStatus, 5000) // Check every 5 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Emergency Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and fix 494 REQUEST_HEADER_TOO_LARGE errors
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Checking...</span>
                </div>
              ) : status ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.status)}
                    <span className={`font-medium ${getStatusColor(status.status)}`}>
                      {status.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p>Response Time: {status.responseTime}</p>
                    <p>Last Check: {new Date(status.timestamp).toLocaleTimeString()}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={checkStatus} 
                      size="sm" 
                      variant="outline"
                      disabled={loading}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Refresh
                    </Button>
                    
                    <Button 
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      size="sm"
                      variant={autoRefresh ? "default" : "outline"}
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      {autoRefresh ? 'Auto ON' : 'Auto OFF'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-red-600">Failed to load status</div>
              )}
            </CardContent>
          </Card>

          {/* Header Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Header Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {status ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Total Size</span>
                      <span>{status.headers.totalSize.toLocaleString()} / {status.headers.limit.toLocaleString()} bytes</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          status.headers.percentage > 80 ? 'bg-red-500' : 
                          status.headers.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(status.headers.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {status.headers.percentage}% of limit
                    </div>
                  </div>

                  {Object.entries(status.headers.breakdown)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([name, size]) => (
                      <div key={name} className="flex justify-between text-xs">
                        <span className="truncate">{name}</span>
                        <span>{size.toLocaleString()}b</span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-gray-500">No data</div>
              )}
            </CardContent>
          </Card>

          {/* Cookie Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-5 w-5" />
                Cookie Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {status ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Cookie Size</span>
                      <span>{status.cookies.totalSize.toLocaleString()} / {status.cookies.limit.toLocaleString()} bytes</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          status.cookies.percentage > 80 ? 'bg-red-500' : 
                          status.cookies.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(status.cookies.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {status.cookies.percentage}% of limit ({status.cookies.count} cookies)
                    </div>
                  </div>

                  {Object.entries(status.cookies.breakdown)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([name, size]) => (
                      <div key={name} className="flex justify-between text-xs">
                        <span className="truncate">{name}</span>
                        <span>{size.toLocaleString()}b</span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-gray-500">No data</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Supabase Status */}
        {status && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Supabase Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Badge variant={status.supabase.status === 'connected' ? 'default' : 'destructive'}>
                  {status.supabase.status}
                </Badge>
                <Badge variant={status.supabase.auth === 'authenticated' ? 'default' : 'secondary'}>
                  {status.supabase.auth}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {status && status.recommendations.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {status.recommendations.map((rec, index) => (
                  <Alert key={index}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{rec}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Emergency Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Emergency Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button 
                onClick={clearAllCookies}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Cookies
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/emergency-clear'}
                variant="outline"
              >
                <Shield className="h-4 w-4 mr-2" />
                Emergency Clear Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
