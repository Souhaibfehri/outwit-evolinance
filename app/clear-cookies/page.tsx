'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Cookie, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Trash2,
  ExternalLink,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function ClearCookiesPage() {
  const [cookieInfo, setCookieInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [cleared, setCleared] = useState(false)

  useEffect(() => {
    analyzeCookies()
  }, [])

  const analyzeCookies = () => {
    try {
      const allCookies = document.cookie
      const cookieSize = allCookies.length
      
      // Parse individual cookies
      const cookies = allCookies.split(';').map(cookie => {
        const [name, ...valueParts] = cookie.trim().split('=')
        const value = valueParts.join('=')
        return { 
          name: name || '', 
          value: value || '', 
          size: cookie.length 
        }
      }).filter(c => c.name)

      // Find Supabase cookies
      const supabaseCookies = cookies.filter(c => 
        c.name.includes('supabase') || 
        c.name.includes('auth') || 
        c.name.includes('session') ||
        c.name.includes('sb-')
      )

      setCookieInfo({
        totalSize: cookieSize,
        totalCount: cookies.length,
        cookies,
        supabaseCookies,
        exceedsLimit: cookieSize > 8000 // Conservative 8KB limit for cookies
      })
      
    } catch (error) {
      console.error('Error analyzing cookies:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearAllCookies = async () => {
    setClearing(true)

    try {
      // 1. Clear all browser cookies
      document.cookie.split(";").forEach((cookie) => {
        const eqPos = cookie.indexOf("=")
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        if (name) {
          // Clear for current path
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
          // Clear for root path
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`
          // Clear for domain
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
          // Clear for parent domain
          const domain = window.location.hostname.split('.').slice(-2).join('.')
          if (domain !== window.location.hostname) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${domain}`
          }
        }
      })

      // 2. Clear localStorage and sessionStorage
      localStorage.clear()
      sessionStorage.clear()

      // 3. Sign out from Supabase (this will clear auth cookies)
      try {
        const supabase = createClient()
        await supabase.auth.signOut()
      } catch (error) {
        console.log('Supabase signout error (expected):', error)
      }

      setCleared(true)
      toast.success('🍪 All cookies cleared! Cookies should now be under 1KB.')
      
      // Wait a moment then redirect to login
      setTimeout(() => {
        window.location.href = '/login?cookies-cleared=true'
      }, 3000)

    } catch (error) {
      console.error('Error clearing cookies:', error)
      toast.error(`Failed to clear cookies: ${error}`)
    } finally {
      setClearing(false)
    }
  }

  const formatBytes = (bytes: number) => {
    return `${Math.round(bytes / 1024 * 10) / 10}KB (${bytes} bytes)`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Analyzing cookie data...</p>
        </div>
      </div>
    )
  }

  if (cleared) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 border-green-200 bg-green-50">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              🍪 Cookies Cleared!
            </h2>
            <p className="text-green-700 mb-6">
              All cookies have been cleared. The header size issue should be resolved. 
              Redirecting to login...
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-green-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Redirecting in 3 seconds...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-6">
        {/* Alert */}
        <Alert className={`border-${cookieInfo?.exceedsLimit ? 'red' : 'orange'}-200 bg-${cookieInfo?.exceedsLimit ? 'red' : 'orange'}-50`}>
          <AlertTriangle className={`h-6 w-6 text-${cookieInfo?.exceedsLimit ? 'red' : 'orange'}-600`} />
          <AlertDescription>
            <div>
              <strong className={`text-${cookieInfo?.exceedsLimit ? 'red' : 'orange'}-800`}>
                🍪 COOKIE SIZE ISSUE DETECTED
              </strong><br />
              <span className={`text-${cookieInfo?.exceedsLimit ? 'red' : 'orange'}-700`}>
                Your cookies are {formatBytes(cookieInfo?.totalSize || 0)} which may be contributing to header size limits.
              </span>
            </div>
          </AlertDescription>
        </Alert>

        {/* Cookie Analysis */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-800">🔍 Cookie Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatBytes(cookieInfo?.totalSize || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Cookie Size</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {cookieInfo?.totalCount || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Cookies</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {cookieInfo?.supabaseCookies?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Auth Cookies</div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Cookie Size vs Safe Limit</span>
                  <span className="font-bold text-orange-600">
                    {formatBytes(cookieInfo?.totalSize || 0)} / 8KB
                  </span>
                </div>
                <Progress 
                  value={Math.min(100, ((cookieInfo?.totalSize || 0) / 8000) * 100)} 
                  className="h-4 [&>div]:bg-orange-500"
                />
              </div>

              {cookieInfo?.supabaseCookies && cookieInfo.supabaseCookies.length > 0 && (
                <div className="bg-orange-100 border border-orange-300 rounded-lg p-4">
                  <h4 className="font-bold text-orange-800 mb-2">Auth Cookies Found:</h4>
                  <div className="space-y-1 text-sm">
                    {cookieInfo.supabaseCookies.map((cookie: any, index: number) => (
                      <div key={index} className="flex justify-between">
                        <span className="font-mono text-orange-700">{cookie.name}</span>
                        <span className="text-orange-600">{formatBytes(cookie.size)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                <h4 className="font-bold text-red-800 mb-2">Why This Matters:</h4>
                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                  <li>Supabase auth cookies contain user metadata</li>
                  <li>Large metadata = large cookies = large headers</li>
                  <li>Headers &gt; 16KB cause REQUEST_HEADER_TOO_LARGE errors</li>
                  <li>Clearing cookies forces a fresh, minimal session</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fix Action */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">🍪 COOKIE FIX</CardTitle>
          </CardHeader>
          <CardContent>
            {clearing ? (
              <div className="text-center space-y-4">
                <Trash2 className="h-12 w-12 text-red-600 mx-auto animate-pulse" />
                <h3 className="font-medium">Clearing All Cookies...</h3>
                <p className="text-sm text-red-700">
                  Removing authentication cookies, localStorage, and session data
                </p>
                <div className="w-full bg-red-200 rounded-full h-3">
                  <div className="bg-red-600 h-3 rounded-full transition-all duration-1000 animate-pulse" style={{width: '80%'}}></div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">🎯 This Will:</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside text-red-700">
                    <li><strong>Clear ALL cookies</strong> (including auth cookies)</li>
                    <li><strong>Sign you out</strong> from your current session</li>
                    <li><strong>Clear localStorage/sessionStorage</strong></li>
                    <li><strong>Reduce header size to under 1KB</strong></li>
                    <li><strong>Fix REQUEST_HEADER_TOO_LARGE errors</strong></li>
                  </ul>
                </div>

                <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                  <p className="text-sm text-red-800">
                    <strong>⚠️ Note:</strong> You'll need to log in again, but your account data is safe.
                    This only clears browser cookies, not your Supabase account.
                  </p>
                </div>

                <Button 
                  onClick={clearAllCookies}
                  className="w-full bg-red-600 hover:bg-red-700 text-white text-lg py-4"
                  size="lg"
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  🍪 CLEAR ALL COOKIES & FIX HEADERS
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alternative Actions */}
        <Card>
          <CardContent className="p-4">
            <div className="text-center space-y-3">
              <h4 className="font-medium">Alternative Solutions:</h4>
              <div className="grid gap-2">
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/fix-now'}
                  className="w-full"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Fix User Metadata Instead
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manual Supabase Fix
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info */}
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-600 text-center">
              <strong>Error Type:</strong> REQUEST_HEADER_TOO_LARGE (HTTP 431)<br />
              <strong>Likely Cause:</strong> Supabase auth cookies containing large user metadata<br />
              <strong>Solution:</strong> Clear cookies to force minimal session data
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
