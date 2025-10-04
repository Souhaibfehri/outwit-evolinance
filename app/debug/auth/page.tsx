'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Cookie,
  Database,
  Key
} from 'lucide-react'

export default function AuthDebugPage() {
  const [authStatus, setAuthStatus] = useState<any>(null)
  const [envStatus, setEnvStatus] = useState<any>(null)
  const [cookieInfo, setCookieInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const checkAuthStatus = async () => {
    try {
      const supabase = createClient()
      
      // Check auth status
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      setAuthStatus({
        user: user ? {
          id: user.id,
          email: user.email,
          metadata: user.user_metadata
        } : null,
        session: session ? {
          access_token: session.access_token ? 'Present' : 'Missing',
          refresh_token: session.refresh_token ? 'Present' : 'Missing',
          expires_at: session.expires_at,
          expires_in: session.expires_in
        } : null,
        userError: userError?.message,
        sessionError: sessionError?.message
      })

      // Check environment variables
      const envResponse = await fetch('/api/auth/check-env')
      const envData = await envResponse.json()
      setEnvStatus(envData)

      // Check cookies
      const cookies = document.cookie.split(';').map(c => {
        const [name, value] = c.trim().split('=')
        return { name, value: value?.substring(0, 50) + (value?.length > 50 ? '...' : '') }
      }).filter(c => c.name)

      const supabaseCookies = cookies.filter(c => 
        c.name.includes('supabase') || c.name.includes('auth') || c.name.includes('sb-')
      )

      setCookieInfo({
        totalCookies: cookies.length,
        supabaseCookies: supabaseCookies.length,
        cookies: cookies,
        supabaseCookies: supabaseCookies,
        totalSize: document.cookie.length
      })

    } catch (error) {
      console.error('Auth debug error:', error)
      toast.error('Failed to check auth status')
    } finally {
      setLoading(false)
    }
  }

  const clearAuthAndRetry = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      
      // Clear all cookies
      document.cookie.split(";").forEach((cookie) => {
        const eqPos = cookie.indexOf("=")
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
      })

      localStorage.clear()
      sessionStorage.clear()
      
      toast.success('Auth cleared, please sign in again')
      
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
      
    } catch (error) {
      console.error('Clear auth error:', error)
      toast.error('Failed to clear auth')
    }
  }

  useEffect(() => {
    checkAuthStatus()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Checking auth status...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Auth Debug Dashboard</h1>
        <Button onClick={checkAuthStatus} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Environment Variables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Environment Variables
          </CardTitle>
        </CardHeader>
        <CardContent>
          {envStatus ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={envStatus.allEnvironmentVariablesSet ? "default" : "destructive"}>
                  {envStatus.allEnvironmentVariablesSet ? "All Set" : "Missing Variables"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Environment: {envStatus.environment}
                </span>
              </div>
              
              <div className="grid gap-2">
                {Object.entries(envStatus.variables).map(([key, status]: [string, any]) => (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    {status.exists && status.hasValue && !status.isPlaceholder ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <code className="bg-muted px-2 py-1 rounded">{key}</code>
                    <span className="text-muted-foreground">
                      {status.length} chars {status.isPlaceholder && '(placeholder)'}
                    </span>
                  </div>
                ))}
              </div>

              {!envStatus.allEnvironmentVariablesSet && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Recommendations:</h4>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    {envStatus.recommendations.map((rec: string, i: number) => (
                      <li key={i}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-muted-foreground">Failed to check environment variables</div>
          )}
        </CardContent>
      </Card>

      {/* Auth Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {authStatus ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={authStatus.user ? "default" : "destructive"}>
                  {authStatus.user ? "Authenticated" : "Not Authenticated"}
                </Badge>
                {authStatus.userError && (
                  <Badge variant="destructive">Error: {authStatus.userError}</Badge>
                )}
              </div>

              {authStatus.user && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">User Info:</h4>
                  <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <div>ID: {authStatus.user.id}</div>
                    <div>Email: {authStatus.user.email}</div>
                    <div>Metadata Size: {JSON.stringify(authStatus.user.metadata).length} bytes</div>
                  </div>
                </div>
              )}

              {authStatus.session && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Session Info:</h4>
                  <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <div>Access Token: {authStatus.session.access_token}</div>
                    <div>Refresh Token: {authStatus.session.refresh_token}</div>
                    <div>Expires At: {new Date(authStatus.session.expires_at * 1000).toLocaleString()}</div>
                    <div>Expires In: {authStatus.session.expires_in} seconds</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-muted-foreground">Failed to check auth status</div>
          )}
        </CardContent>
      </Card>

      {/* Cookie Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cookie className="h-5 w-5" />
            Cookie Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cookieInfo ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Total: {cookieInfo.totalCookies}</Badge>
                  <Badge variant="outline">Supabase: {cookieInfo.supabaseCookies}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Size: {Math.round(cookieInfo.totalSize / 1024 * 10) / 10}KB
                </div>
              </div>

              {cookieInfo.supabaseCookies > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Supabase Cookies:</h4>
                  <div className="space-y-1">
                    {cookieInfo.supabaseCookies.map((cookie: any, i: number) => (
                      <div key={i} className="text-sm text-blue-700 dark:text-blue-300">
                        <code className="bg-muted px-2 py-1 rounded">{cookie.name}</code>
                        <span className="ml-2">{cookie.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cookieInfo.totalSize > 8000 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                        Large Cookie Size Detected
                      </div>
                      <div className="text-sm text-yellow-700 dark:text-yellow-300">
                        Total cookie size is {Math.round(cookieInfo.totalSize / 1024 * 10) / 10}KB, 
                        which may cause header size issues. Consider clearing cookies.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-muted-foreground">Failed to check cookie info</div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={checkAuthStatus} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
            <Button onClick={clearAuthAndRetry} variant="destructive">
              <XCircle className="h-4 w-4 mr-2" />
              Clear Auth & Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
