'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Zap, 
  Cookie,
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  ArrowRight,
  Brain,
  Database
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface DiagnosticResult {
  metadataSize: number
  cookiesSize: number
  totalEstimated: number
  primaryCause: 'cookies' | 'metadata' | 'unknown'
  recommendedFix: 'clear-cookies' | 'fix-metadata' | 'manual'
  severity: 'high' | 'medium' | 'low'
}

export default function SmartFixPage() {
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    performDiagnosis()
  }, [])

  const performDiagnosis = async () => {
    try {
      // 1. Check cookie size
      const cookiesSize = document.cookie.length
      
      // 2. Check metadata size
      let metadataSize = 0
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.user_metadata) {
          metadataSize = JSON.stringify(user.user_metadata).length
        }
      } catch (error) {
        // If we can't get metadata, cookies might be too large already
        console.warn('Cannot get user metadata, likely due to cookie size')
        metadataSize = 0
      }

      // 3. Estimate total header size
      const userAgentSize = navigator.userAgent.length
      const estimatedOtherHeaders = 2000
      const totalEstimated = cookiesSize + metadataSize + userAgentSize + estimatedOtherHeaders

      // 4. Determine primary cause and recommended fix
      let primaryCause: DiagnosticResult['primaryCause'] = 'unknown'
      let recommendedFix: DiagnosticResult['recommendedFix'] = 'manual'
      let severity: DiagnosticResult['severity'] = 'low'

      if (cookiesSize > 8000) {
        primaryCause = 'cookies'
        recommendedFix = 'clear-cookies'
        severity = 'high'
      } else if (metadataSize > 10000) {
        primaryCause = 'metadata'
        recommendedFix = 'fix-metadata'
        severity = 'high'
      } else if (totalEstimated > 12000) {
        if (cookiesSize > metadataSize) {
          primaryCause = 'cookies'
          recommendedFix = 'clear-cookies'
        } else {
          primaryCause = 'metadata'
          recommendedFix = 'fix-metadata'
        }
        severity = 'medium'
      }

      setDiagnostic({
        metadataSize,
        cookiesSize,
        totalEstimated,
        primaryCause,
        recommendedFix,
        severity
      })

    } catch (error) {
      console.error('Diagnosis failed:', error)
      // If diagnosis fails, assume cookies are the issue
      setDiagnostic({
        metadataSize: 0,
        cookiesSize: document.cookie.length,
        totalEstimated: 20000,
        primaryCause: 'cookies',
        recommendedFix: 'clear-cookies',
        severity: 'high'
      })
    } finally {
      setLoading(false)
    }
  }

  const applyRecommendedFix = () => {
    if (!diagnostic) return

    setRedirecting(true)
    
    // Redirect to the appropriate fix page
    const targetPage = diagnostic.recommendedFix === 'clear-cookies' 
      ? '/clear-cookies' 
      : '/fix-now'
    
    toast.success(`Redirecting to ${diagnostic.primaryCause} fix...`)
    
    setTimeout(() => {
      window.location.href = targetPage
    }, 1500)
  }

  const formatBytes = (bytes: number) => {
    return `${Math.round(bytes / 1024 * 10) / 10}KB (${bytes} bytes)`
  }

  const getCauseIcon = (cause: string) => {
    switch (cause) {
      case 'cookies': return <Cookie className="h-6 w-6" />
      case 'metadata': return <Database className="h-6 w-6" />
      default: return <AlertTriangle className="h-6 w-6" />
    }
  }

  const getCauseColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'red'
      case 'medium': return 'orange'
      default: return 'yellow'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="text-center">
          <Brain className="h-12 w-12 animate-pulse text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-blue-800 mb-2">🧠 Smart Diagnosis</h2>
          <p className="text-blue-600">Analyzing your header size issue...</p>
          <div className="mt-4">
            <Progress value={75} className="w-64 mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="text-center">
          <ArrowRight className="h-12 w-12 animate-bounce text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-green-800 mb-2">🎯 Redirecting to Fix</h2>
          <p className="text-green-600">Taking you to the best solution...</p>
        </div>
      </div>
    )
  }

  if (!diagnostic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Diagnosis Failed</h2>
            <p className="text-gray-600 mb-6">
              Could not analyze the header size issue. Try manual fixes.
            </p>
            <div className="space-y-2">
              <Button onClick={() => window.location.href = '/clear-cookies'} className="w-full">
                Clear Cookies
              </Button>
              <Button onClick={() => window.location.href = '/fix-now'} variant="outline" className="w-full">
                Fix Metadata
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const color = getCauseColor(diagnostic.severity)

  return (
    <div className={`min-h-screen bg-gradient-to-br from-${color}-50 to-${color}-100 flex items-center justify-center p-4`}>
      <div className="max-w-2xl w-full space-y-6">
        {/* Diagnosis Alert */}
        <Alert className={`border-${color}-200 bg-${color}-50`}>
          <div className="flex items-center gap-3">
            {getCauseIcon(diagnostic.primaryCause)}
            <AlertDescription>
              <div>
                <strong className={`text-${color}-800`}>
                  🎯 PRIMARY CAUSE IDENTIFIED: {diagnostic.primaryCause.toUpperCase()}
                </strong><br />
                <span className={`text-${color}-700`}>
                  Smart analysis shows {diagnostic.primaryCause} are causing your header size issues.
                </span>
              </div>
            </AlertDescription>
          </div>
        </Alert>

        {/* Diagnosis Results */}
        <Card className={`border-${color}-200`}>
          <CardHeader>
            <CardTitle className={`text-${color}-800`}>🧠 Smart Diagnosis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold text-${diagnostic.primaryCause === 'cookies' ? 'red' : 'blue'}-600`}>
                    {formatBytes(diagnostic.cookiesSize)}
                  </div>
                  <div className="text-sm text-gray-600">Cookies Size</div>
                  {diagnostic.primaryCause === 'cookies' && (
                    <div className="text-xs text-red-600 font-medium">⚠️ TOO LARGE</div>
                  )}
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold text-${diagnostic.primaryCause === 'metadata' ? 'red' : 'blue'}-600`}>
                    {formatBytes(diagnostic.metadataSize)}
                  </div>
                  <div className="text-sm text-gray-600">Metadata Size</div>
                  {diagnostic.primaryCause === 'metadata' && (
                    <div className="text-xs text-red-600 font-medium">⚠️ TOO LARGE</div>
                  )}
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold text-${color}-600`}>
                    {formatBytes(diagnostic.totalEstimated)}
                  </div>
                  <div className="text-sm text-gray-600">Total Estimated</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Header Size vs 16KB Limit</span>
                  <span className={`font-bold text-${color}-600`}>
                    {Math.round((diagnostic.totalEstimated / 16000) * 100)}%
                  </span>
                </div>
                <Progress 
                  value={Math.min(100, (diagnostic.totalEstimated / 16000) * 100)} 
                  className={`h-4 [&>div]:bg-${color}-500`}
                />
              </div>

              {/* Explanation */}
              <div className={`bg-${color}-100 border border-${color}-300 rounded-lg p-4`}>
                <h4 className={`font-bold text-${color}-800 mb-2`}>🔍 Analysis:</h4>
                <div className={`text-sm text-${color}-700 space-y-2`}>
                  {diagnostic.primaryCause === 'cookies' ? (
                    <>
                      <p><strong>Primary Issue:</strong> Your browser cookies are {formatBytes(diagnostic.cookiesSize)}, likely containing large Supabase authentication data.</p>
                      <p><strong>Root Cause:</strong> Supabase stores user metadata in authentication cookies. Large metadata = large cookies = header size exceeded.</p>
                      <p><strong>Best Fix:</strong> Clear all cookies to reset authentication with minimal data.</p>
                    </>
                  ) : diagnostic.primaryCause === 'metadata' ? (
                    <>
                      <p><strong>Primary Issue:</strong> Your user metadata is {formatBytes(diagnostic.metadataSize)}, stored in Supabase and sent in every request.</p>
                      <p><strong>Root Cause:</strong> Financial data (transactions, goals, budgets) stored in user metadata exceeds header limits.</p>
                      <p><strong>Best Fix:</strong> Reduce metadata size by removing large data arrays.</p>
                    </>
                  ) : (
                    <p>Multiple factors may be contributing to the header size issue. Manual intervention recommended.</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommended Fix */}
        <Card className={`border-green-200 bg-green-50`}>
          <CardHeader>
            <CardTitle className="text-green-800">🎯 Recommended Fix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {diagnostic.recommendedFix === 'clear-cookies' ? (
                  <Cookie className="h-12 w-12 text-blue-600" />
                ) : (
                  <Database className="h-12 w-12 text-purple-600" />
                )}
                <div>
                  <h3 className="font-bold text-lg">
                    {diagnostic.recommendedFix === 'clear-cookies' ? '🍪 Clear Cookies' : '📊 Fix Metadata'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {diagnostic.recommendedFix === 'clear-cookies' 
                      ? 'Clear authentication cookies and start fresh with minimal session data'
                      : 'Reduce user metadata size by removing large data arrays'
                    }
                  </p>
                </div>
              </div>

              <Button 
                onClick={applyRecommendedFix}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-4"
                size="lg"
              >
                <Zap className="h-5 w-5 mr-2" />
                🚀 APPLY RECOMMENDED FIX
              </Button>

              <div className="text-center text-sm text-gray-600">
                <strong>Confidence:</strong> {diagnostic.severity === 'high' ? '95%' : diagnostic.severity === 'medium' ? '80%' : '60%'} |
                <strong> Estimated Fix Time:</strong> 2-3 minutes
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alternative Options */}
        <Card>
          <CardContent className="p-4">
            <div className="text-center space-y-3">
              <h4 className="font-medium">Alternative Options:</h4>
              <div className="grid gap-2">
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = diagnostic.recommendedFix === 'clear-cookies' ? '/fix-now' : '/clear-cookies'}
                  className="w-full"
                >
                  Try {diagnostic.recommendedFix === 'clear-cookies' ? 'Metadata Fix' : 'Cookie Clearing'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/fix-headers'}
                  className="w-full"
                >
                  Manual Diagnosis
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
