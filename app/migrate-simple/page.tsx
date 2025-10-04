'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  ArrowRight,
  Trash2,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'

interface MetadataStatus {
  userId: string
  email: string
  metadataSize: number
  needsCleaning: boolean
  isAlreadyCleaned: boolean
  lastCleanedAt?: string
  dataBreakdown: Record<string, number>
}

export default function MigrateSimplePage() {
  const [status, setStatus] = useState<MetadataStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [cleaning, setCleaning] = useState(false)
  const [cleaningProgress, setCleaningProgress] = useState(0)

  useEffect(() => {
    checkMetadataStatus()
  }, [])

  const checkMetadataStatus = async () => {
    try {
      const response = await fetch('/api/migrate/clear-metadata')
      const data = await response.json()
      
      if (response.ok) {
        setStatus(data)
      } else {
        toast.error('Failed to check metadata status')
      }
    } catch (error) {
      console.error('Error checking metadata status:', error)
      toast.error('Failed to check metadata status')
    } finally {
      setLoading(false)
    }
  }

  const startCleaning = async () => {
    if (!confirm('This will clear large data arrays but keep essential settings and sample data. Continue?')) {
      return
    }

    setCleaning(true)
    setCleaningProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setCleaningProgress(prev => Math.min(prev + 15, 85))
      }, 300)

      const response = await fetch('/api/migrate/clear-metadata', {
        method: 'POST'
      })

      clearInterval(progressInterval)
      setCleaningProgress(100)

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 2000)
      } else {
        toast.error(data.error || 'Failed to clear metadata')
        setCleaningProgress(0)
      }
    } catch (error) {
      console.error('Error during cleaning:', error)
      toast.error('Failed to clear metadata')
      setCleaningProgress(0)
    } finally {
      setCleaning(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Checking metadata status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Fix Header Size Error</h1>
        <p className="text-muted-foreground">
          Resolve REQUEST_HEADER_TOO_LARGE and MIDDLEWARE_INVOCATION_FAILED errors
        </p>
      </div>

      <div className="space-y-6">
        {/* Status Alert */}
        {status && (
          <Alert className={status.needsCleaning ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
            {status.needsCleaning ? (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            <AlertDescription>
              {status.isAlreadyCleaned ? (
                <div>
                  <strong>✅ Already Cleaned</strong><br />
                  Metadata was cleaned on {status.lastCleanedAt ? new Date(status.lastCleanedAt).toLocaleDateString() : 'unknown date'}. 
                  Current size: {formatBytes(status.metadataSize)}
                </div>
              ) : status.needsCleaning ? (
                <div>
                  <strong>🚨 Cleaning Needed</strong><br />
                  Your metadata is {formatBytes(status.metadataSize)}, which causes header size errors.
                </div>
              ) : (
                <div>
                  <strong>✅ Metadata Size OK</strong><br />
                  Your metadata is {formatBytes(status.metadataSize)}, which is within limits.
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Cleaning Progress */}
        {cleaning && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <Trash2 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-medium">Cleaning Large Metadata...</h3>
                <p className="text-sm text-blue-700">
                  This will solve header size errors permanently
                </p>
              </div>
              <Progress value={cleaningProgress} className="mb-2" />
              <div className="text-center text-sm text-blue-600">
                {cleaningProgress}% complete
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Breakdown */}
        {status && (
          <Card>
            <CardHeader>
              <CardTitle>Current Data Storage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(status.dataBreakdown).map(([key, value]) => (
                  <div key={key} className={`p-3 rounded ${value > 50 ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                    <div className="font-medium text-sm">{key.replace(/_/g, ' ')}</div>
                    <div className={`text-lg font-bold ${value > 50 ? 'text-red-600' : 'text-gray-900'}`}>
                      {value}
                    </div>
                    {value > 50 && (
                      <div className="text-xs text-red-600">⚠️ Large</div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Metadata Size:</span>
                  <span className={`font-bold ${status.needsCleaning ? 'text-red-600' : 'text-green-600'}`}>
                    {formatBytes(status.metadataSize)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cleaning Action */}
        {status && status.needsCleaning && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Zap className="h-5 w-5" />
                Fix Header Size Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">✅ What This Does:</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside text-orange-700">
                    <li>Removes large data arrays causing header errors</li>
                    <li>Keeps essential profile settings and preferences</li>
                    <li>Preserves sample data for app functionality</li>
                    <li>Fixes REQUEST_HEADER_TOO_LARGE errors immediately</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">🔒 What's Preserved:</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside text-orange-700">
                    <li>Profile (name, currency, timezone, onboarding status)</li>
                    <li>Notification preferences</li>
                    <li>2-3 sample items per category (goals, debts, bills)</li>
                    <li>Last 5 transactions for testing</li>
                  </ul>
                </div>

                <Button 
                  onClick={startCleaning}
                  disabled={cleaning}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  size="lg"
                >
                  {cleaning ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  {cleaning ? 'Cleaning...' : 'Clear Large Metadata'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success State */}
        {status && !status.needsCleaning && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                ✅ Metadata Size OK!
              </h3>
              <p className="text-green-700 mb-6">
                Your metadata is within limits. Header size errors should be resolved.
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

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>About This Fix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">🚨 The Problem:</h4>
              <p className="text-sm text-gray-600">
                Outwit Budget stores user data in Supabase user metadata. When this grows large, 
                it causes HTTP 431 (REQUEST_HEADER_TOO_LARGE) and 500 (MIDDLEWARE_INVOCATION_FAILED) errors.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">✅ The Solution:</h4>
              <p className="text-sm text-gray-600">
                Clear large data arrays while keeping essential settings. The app will continue 
                to work normally, and you can add new data without header size issues.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">🔄 After Cleaning:</h4>
              <p className="text-sm text-gray-600">
                You can use the app normally. New transactions, goals, and other data 
                will be stored efficiently without causing header size problems.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
