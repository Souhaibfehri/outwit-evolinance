'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Trash2, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Cookie
} from 'lucide-react'

export default function ClearCookiesPage() {
  const [clearing, setClearing] = useState(false)
  const [cleared, setCleared] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearAllCookies = async () => {
    setClearing(true)
    setError(null)
    
    try {
      // Clear all cookies from the client side
      const cookiesToClear = [
        'sb-access-token',
        'sb-refresh-token', 
        'supabase.auth.token',
        'supabase-auth-token',
        'vercel-auth-session',
        'next-auth.session-token',
        'session',
        'auth',
        'token',
        'jwt',
        'cookie',
        'auth-token',
        'access-token',
        'refresh-token',
        'user-token',
        'app-session',
        'supabase',
        'supabase-auth',
        'sb-',
        'vercel',
        'next-auth'
      ]

      // Clear each cookie with multiple path variations
      cookiesToClear.forEach(cookieName => {
        // Clear with different paths and domains
        document.cookie = `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;`
        document.cookie = `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure;`
        document.cookie = `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict;`
        document.cookie = `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly;`
        document.cookie = `${cookieName}=; Path=/; Domain=.vercel.app; Expires=Thu, 01 Jan 1970 00:00:00 GMT;`
        document.cookie = `${cookieName}=; Path=/; Domain=.outwit-evolinance.vercel.app; Expires=Thu, 01 Jan 1970 00:00:00 GMT;`
      })

      // Clear localStorage and sessionStorage
      localStorage.clear()
      sessionStorage.clear()

      // Clear all cookies by setting a very old expiry
      const allCookies = document.cookie.split(';')
      allCookies.forEach(cookie => {
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        if (name) {
          document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;`
          document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure;`
          document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict;`
        }
      })

      setCleared(true)
      
      // Redirect to home after clearing
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
      
    } catch (err) {
      console.error('Error clearing cookies:', err)
      setError('Failed to clear cookies. Please try again.')
    } finally {
      setClearing(false)
    }
  }

  const getCurrentCookieCount = () => {
    if (typeof window === 'undefined') return 0
    return document.cookie.split(';').filter(c => c.trim()).length
  }

  const getCurrentHeaderSize = () => {
    if (typeof window === 'undefined') return 0
    // Estimate header size based on cookies
    const cookieSize = document.cookie.length
    const localStorageSize = JSON.stringify(localStorage).length
    const sessionStorageSize = JSON.stringify(sessionStorage).length
    return cookieSize + localStorageSize + sessionStorageSize
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cookie className="h-6 w-6 text-orange-600" />
              Clear Cookies & Fix 494 Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You're experiencing a "494: REQUEST_HEADER_TOO_LARGE" error. This happens when 
                your browser sends too many or too large cookies to the server.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Current Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Cookies:</span>
                    <Badge variant="outline">{getCurrentCookieCount()}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Est. Size:</span>
                    <Badge variant="outline">{Math.round(getCurrentHeaderSize() / 1024)}KB</Badge>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">What This Will Do</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Clear all authentication cookies</li>
                  <li>• Clear localStorage & sessionStorage</li>
                  <li>• Remove Supabase session data</li>
                  <li>• Reset to clean state</li>
                </ul>
              </div>
            </div>

            {cleared && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Cookies cleared successfully! Redirecting to home page...
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4">
              <Button 
                onClick={clearAllCookies}
                disabled={clearing || cleared}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {clearing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Cookies
                  </>
                )}
              </Button>

              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>
                <strong>Note:</strong> After clearing cookies, you'll need to log in again. 
                This should resolve the 494 error by reducing header size.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}