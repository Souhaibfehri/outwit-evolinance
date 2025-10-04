'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  ArrowRight,
  Database,
  Shield,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'

interface HeaderStatus {
  userId: string
  email: string
  metadataSize: number
  metadataSizeKB: number
  exceedsHeaderLimit: boolean
  exceedsTotalLimit: boolean
  recommendEmergencyFix: boolean
  isAlreadyFixed: boolean
  lastFixDate?: string
  headerLimitPercent: number
  totalLimitPercent: number
  dataBreakdown: Record<string, number>
}

export default function FixHeadersPage() {
  const [status, setStatus] = useState<HeaderStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [fixing, setFixing] = useState(false)
  const [fixProgress, setFixProgress] = useState(0)

  useEffect(() => {
    checkHeaderStatus()
  }, [])

  const checkHeaderStatus = async () => {
    try {
      const response = await fetch('/api/emergency-fix')
      const data = await response.json()
      
      if (response.ok) {
        setStatus(data)
      } else {
        toast.error('Failed to check header status')
      }
    } catch (error) {
      console.error('Error checking header status:', error)
      toast.error('Failed to check header status')
    } finally {
      setLoading(false)
    }
  }

  const applyEmergencyFix = async () => {
    if (!confirm('This will drastically reduce your metadata size to fix header errors. Continue?')) {
      return
    }

    setFixing(true)
    setFixProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setFixProgress(prev => Math.min(prev + 20, 80))
      }, 200)

      const response = await fetch('/api/emergency-fix', {
        method: 'POST'
      })

      clearInterval(progressInterval)
      setFixProgress(100)

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 3000)
      } else {
        toast.error(data.error || 'Emergency fix failed')
        setFixProgress(0)
      }
    } catch (error) {
      console.error('Error during emergency fix:', error)
      toast.error('Emergency fix failed')
      setFixProgress(0)
    } finally {
      setFixing(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Checking header size status...</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: HeaderStatus) => {
    if (status.exceedsHeaderLimit) return 'border-red-200 bg-red-50'
    if (status.recommendEmergencyFix) return 'border-yellow-200 bg-yellow-50'
    return 'border-green-200 bg-green-50'
  }

  const getStatusIcon = (status: HeaderStatus) => {
    if (status.exceedsHeaderLimit) return <AlertTriangle className="h-4 w-4 text-red-600" />
    if (status.recommendEmergencyFix) return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    return <CheckCircle className="h-4 w-4 text-green-600" />
  }

  const getStatusMessage = (status: HeaderStatus) => {
    if (status.isAlreadyFixed) {
      return (
        <div>
          <strong>✅ Already Fixed</strong><br />
          Emergency fix applied on {status.lastFixDate ? new Date(status.lastFixDate).toLocaleDateString() : 'unknown date'}. 
          Current size: {status.metadataSizeKB}KB
        </div>
      )
    }
    
    if (status.exceedsHeaderLimit) {
      return (
        <div>
          <strong>🚨 CRITICAL: Header Limit Exceeded</strong><br />
          Your metadata is {status.metadataSizeKB}KB ({status.headerLimitPercent}% of 16KB limit). 
          This causes REQUEST_HEADER_TOO_LARGE errors.
        </div>
      )
    }
    
    if (status.recommendEmergencyFix) {
      return (
        <div>
          <strong>⚠️ WARNING: Approaching Limit</strong><br />
          Your metadata is {status.metadataSizeKB}KB. Recommended to fix before reaching 16KB limit.
        </div>
      )
    }
    
    return (
      <div>
        <strong>✅ Header Size OK</strong><br />
        Your metadata is {status.metadataSizeKB}KB, which is within safe limits.
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🚨 Fix Header Size Errors</h1>
        <p className="text-muted-foreground">
          Resolve REQUEST_HEADER_TOO_LARGE and MIDDLEWARE_INVOCATION_FAILED errors
        </p>
      </div>

      <div className="space-y-6">
        {/* Status Alert */}
        {status && (
          <Alert className={getStatusColor(status)}>
            {getStatusIcon(status)}
            <AlertDescription>
              {getStatusMessage(status)}
            </AlertDescription>
          </Alert>
        )}

        {/* Header Size Breakdown */}
        {status && (
          <Card>
            <CardHeader>
              <CardTitle>Header Size Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Progress Bars */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Per-Header Limit (16KB)</span>
                    <span className={status.exceedsHeaderLimit ? 'text-red-600 font-bold' : 'text-gray-600'}>
                      {status.metadataSizeKB}KB / 16KB ({status.headerLimitPercent}%)
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(100, status.headerLimitPercent)} 
                    className={`h-3 ${status.exceedsHeaderLimit ? '[&>div]:bg-red-500' : status.headerLimitPercent > 75 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'}`}
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Total Headers Limit (32KB)</span>
                    <span className={status.exceedsTotalLimit ? 'text-red-600 font-bold' : 'text-gray-600'}>
                      {status.metadataSizeKB}KB / 32KB ({status.totalLimitPercent}%)
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(100, status.totalLimitPercent)} 
                    className={`h-3 ${status.exceedsTotalLimit ? '[&>div]:bg-red-500' : status.totalLimitPercent > 75 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'}`}
                  />
                </div>

                {/* Data Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  {Object.entries(status.dataBreakdown).map(([key, value]) => (
                    <div key={key} className={`p-3 rounded text-center ${value > 50 ? 'bg-red-50 border border-red-200' : value > 10 ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                      <div className="font-bold text-lg">{value}</div>
                      <div className="text-xs">{key.replace(/_/g, ' ')}</div>
                      {value > 50 && <div className="text-xs text-red-600 mt-1">🚨 Large</div>}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Emergency Fix Progress */}
        {fixing && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <Zap className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <h3 className="font-medium">Applying Emergency Fix...</h3>
                <p className="text-sm text-orange-700">
                  Reducing metadata to under 8KB to prevent header errors
                </p>
              </div>
              <Progress value={fixProgress} className="mb-2" />
              <div className="text-center text-sm text-orange-600">
                {fixProgress}% complete
              </div>
            </CardContent>
          </Card>
        )}

        {/* Emergency Fix Action */}
        {status && (status.exceedsHeaderLimit || status.recommendEmergencyFix) && !status.isAlreadyFixed && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <Zap className="h-5 w-5" />
                🚨 EMERGENCY FIX REQUIRED
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-white border border-red-300 rounded-lg">
                  <h4 className="font-bold text-red-800 mb-2">Critical Issue:</h4>
                  <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                    <li>Metadata size: <strong>{status.metadataSizeKB}KB</strong></li>
                    <li>Header limit: <strong>16KB per header</strong></li>
                    <li>Total limit: <strong>32KB for all headers</strong></li>
                    <li>Status: <strong>{status.exceedsHeaderLimit ? 'EXCEEDS LIMITS' : 'APPROACHING LIMITS'}</strong></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">🔧 Emergency Fix Will:</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside text-red-700">
                    <li>Reduce metadata to under 8KB (safe margin)</li>
                    <li>Keep essential profile settings</li>
                    <li>Preserve 2-3 sample items per category</li>
                    <li>Fix REQUEST_HEADER_TOO_LARGE errors immediately</li>
                  </ul>
                </div>

                <Button 
                  onClick={applyEmergencyFix}
                  disabled={fixing}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  size="lg"
                >
                  {fixing ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  {fixing ? 'Applying Fix...' : '🚨 APPLY EMERGENCY FIX NOW'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success State */}
        {status && !status.recommendEmergencyFix && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                ✅ Header Size Within Limits!
              </h3>
              <p className="text-green-700 mb-6">
                Your metadata is {status.metadataSizeKB}KB, which is safe for production.
              </p>
              <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
                <a href="/dashboard">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Technical Explanation */}
        <Card>
          <CardHeader>
            <CardTitle>About Header Size Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">🔍 The Problem:</h4>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li><strong>16KB per header limit:</strong> Each individual header cannot exceed 16KB</li>
                <li><strong>32KB total limit:</strong> All headers combined cannot exceed 32KB</li>
                <li><strong>Cookies included:</strong> User metadata gets sent in cookies/headers</li>
                <li><strong>Vercel enforced:</strong> These are platform-level limits</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">⚡ Emergency Fix:</h4>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Reduces metadata to under 8KB (safe margin)</li>
                <li>Keeps profile settings and essential data</li>
                <li>Preserves app functionality with sample data</li>
                <li>Prevents all header-related errors</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">🔄 After Fix:</h4>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>App works normally without errors</li>
                <li>You can add new data without issues</li>
                <li>No more 431 or 500 errors</li>
                <li>Ready for long-term database migration</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
