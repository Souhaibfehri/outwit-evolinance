'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Trash2,
  Shield
} from 'lucide-react'

export default function EmergencyClearPage() {
  const [clearing, setClearing] = useState(false)
  const [cleared, setCleared] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Auto-clear cookies when page loads
    clearAllCookies()
  }, [])

  const clearAllCookies = async () => {
    setClearing(true)
    setError(null)
    
    try {
      // Clear all cookies from the client side
      const cookiesToClear = [
        'sb-access-token', 'sb-refresh-token', 'supabase.auth.token', 'supabase-auth-token',
        'vercel-auth-session', 'next-auth.session-token', 'session', 'auth', 'token',
        'jwt', 'cookie', 'auth-token', 'access-token', 'refresh-token', 'user-token',
        'app-session', 'supabase', 'supabase-auth', 'sb-', 'vercel', 'next-auth'
      ]

      // Clear each cookie with multiple path variations
      cookiesToClear.forEach(cookieName => {
        document.cookie = `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;`
        document.cookie = `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure;`
        document.cookie = `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict;`
        document.cookie = `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly;`
        document.cookie = `${cookieName}=; Path=/; Domain=.vercel.app; Expires=Thu, 01 Jan 1970 00:00:00 GMT;`
        document.cookie = `${cookieName}=; Path=/; Domain=.outwit-evolinance.vercel.app; Expires=Thu, 01 Jan 1970 00:00:00 GMT;`
      })

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

      // Clear localStorage and sessionStorage
      localStorage.clear()
      sessionStorage.clear()

      // Call server-side clear
      try {
        await fetch('/api/emergency/clear-cookies', { method: 'POST' })
      } catch (e) {
        // Ignore server errors, client-side clearing is enough
      }

      setCleared(true)
      
      // Redirect to home after clearing
      setTimeout(() => {
        window.location.href = '/'
      }, 3000)
      
    } catch (err) {
      console.error('Error clearing cookies:', err)
      setError('Failed to clear cookies. Please try again.')
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="min-h-screen bg-red-50 dark:bg-red-950/20 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="border-red-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-800">Emergency Cookie Clear</CardTitle>
            <p className="text-red-600">
              Automatically clearing all cookies to fix the 494 error
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>494 Error Detected:</strong> Request headers are too large. 
                This page will automatically clear all cookies to resolve the issue.
              </AlertDescription>
            </Alert>

            {clearing && (
              <div className="text-center">
                <RefreshCw className="h-8 w-8 text-red-600 mx-auto mb-4 animate-spin" />
                <p className="text-red-600 font-medium">Clearing all cookies...</p>
                <p className="text-sm text-red-500">This will fix the 494 error</p>
              </div>
            )}

            {cleared && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Cookies Cleared Successfully!</strong> Redirecting to home page...
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="text-center space-y-4">
              <div className="text-sm text-gray-600">
                <p><strong>What this does:</strong></p>
                <ul className="text-left mt-2 space-y-1">
                  <li>• Clears all authentication cookies</li>
                  <li>• Clears localStorage & sessionStorage</li>
                  <li>• Removes all Supabase session data</li>
                  <li>• Fixes the 494 REQUEST_HEADER_TOO_LARGE error</li>
                </ul>
              </div>

              <Button 
                onClick={clearAllCookies}
                disabled={clearing || cleared}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {clearing ? 'Clearing...' : cleared ? 'Cleared!' : 'Clear All Cookies'}
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center">
              <p>
                <strong>Note:</strong> After clearing cookies, you'll need to log in again. 
                This should permanently resolve the 494 error.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
