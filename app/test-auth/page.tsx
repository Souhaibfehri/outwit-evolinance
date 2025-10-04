'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestAuthPage() {
  const [authState, setAuthState] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cookieInfo, setCookieInfo] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    
    // Check current auth state
    supabase.auth.getUser().then(({ data, error }) => {
      setAuthState({ user: data.user, error })
      setLoading(false)
    })

    // Check cookie information
    const cookies = document.cookie.split(';').map(c => c.trim())
    const supabaseCookies = cookies.filter(c => c.includes('supabase') || c.includes('sb-'))
    const totalCookieSize = cookies.reduce((total, cookie) => total + cookie.length, 0)
    
    setCookieInfo({
      totalCookies: cookies.length,
      supabaseCookies: supabaseCookies.length,
      totalSize: totalCookieSize,
      supabaseCookiesList: supabaseCookies
    })
  }, [])

  const testGitHubLogin = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/test-auth`
      }
    })
    if (error) console.error('Login error:', error)
  }

  const testSignOut = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Logout error:', error)
    window.location.reload()
  }

  if (loading) {
    return <div className="p-8">Loading auth state...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🧪 Supabase Auth Test</h1>
      
      {/* Auth State */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Auth State</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(authState, null, 2)}
        </pre>
      </div>

      {/* Cookie Information */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">🍪 Cookie Analysis</h2>
        <div className="space-y-2">
          <p><strong>Total Cookies:</strong> {cookieInfo?.totalCookies || 0}</p>
          <p><strong>Supabase Cookies:</strong> {cookieInfo?.supabaseCookies || 0}</p>
          <p><strong>Total Cookie Size:</strong> {cookieInfo?.totalSize || 0} bytes</p>
          <p><strong>Status:</strong> 
            <span className={cookieInfo?.totalSize > 8000 ? 'text-red-600' : 'text-green-600'}>
              {cookieInfo?.totalSize > 8000 ? ' ⚠️ TOO LARGE' : ' ✅ OK'}
            </span>
          </p>
        </div>
        
        {cookieInfo?.supabaseCookiesList?.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer">Supabase Cookies Details</summary>
            <pre className="text-xs mt-2 overflow-auto">
              {cookieInfo.supabaseCookiesList.join('\n')}
            </pre>
          </details>
        )}
      </div>

      {/* localStorage Information */}
      <div className="bg-green-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">💾 localStorage Analysis</h2>
        <div className="space-y-2">
          {typeof window !== 'undefined' && (
            <>
              <p><strong>localStorage Items:</strong> {localStorage.length}</p>
              <div className="text-sm">
                {Array.from({ length: localStorage.length }, (_, i) => {
                  const key = localStorage.key(i)
                  if (key?.includes('sb-')) {
                    const value = localStorage.getItem(key)
                    return (
                      <div key={key} className="mb-1">
                        <strong>{key}:</strong> {value?.length || 0} bytes
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Test Buttons */}
      <div className="space-x-4">
        {!authState?.user ? (
          <button
            onClick={testGitHubLogin}
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            🔐 Test GitHub Login
          </button>
        ) : (
          <button
            onClick={testSignOut}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            🚪 Sign Out
          </button>
        )}
        
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="mt-8 text-sm text-gray-600">
        <p><strong>Expected Behavior:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Supabase Cookies should be 0 (using localStorage instead)</li>
          <li>Total cookie size should be under 8KB</li>
          <li>Auth data should be stored in localStorage with 'sb-' prefix</li>
          <li>No HTTP 431 errors should occur</li>
        </ul>
      </div>
    </div>
  )
}
