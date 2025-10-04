'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export default function HeadersDebugPage() {
  const [headerInfo, setHeaderInfo] = useState<any>(null)
  const [userMetadata, setUserMetadata] = useState<any>(null)

  useEffect(() => {
    checkHeaders()
  }, [])

  const checkHeaders = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const metadata = user.user_metadata || {}
        const metadataSize = JSON.stringify(metadata).length
        
        setUserMetadata({
          size: metadataSize,
          keys: Object.keys(metadata),
          sampleData: {
            transactions: metadata.transactions?.length || 0,
            goals: metadata.goals?.length || 0,
            debts: metadata.debts?.length || 0,
            bills: metadata.bills?.length || 0,
            income: metadata.recurring_income?.length || 0
          }
        })
      }

      // Check request headers size
      setHeaderInfo({
        userAgent: navigator.userAgent.length,
        cookies: document.cookie.length,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error checking headers:', error)
    }
  }

  const clearLargeData = async () => {
    try {
      const supabase = createClient()
      
      // Keep only essential metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          onboarding_done: true,
          name: userMetadata?.name || 'User',
          currency: 'USD'
          // Remove large arrays that cause header issues
        }
      })

      if (error) throw error
      
      alert('Large data cleared! Refresh the page.')
    } catch (error) {
      console.error('Error clearing data:', error)
      alert('Failed to clear data')
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Headers Debug</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Request Info</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto">
              {JSON.stringify(headerInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Metadata Size</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto">
              {JSON.stringify(userMetadata, null, 2)}
            </pre>
            
            {userMetadata?.size > 8000 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-red-800 font-medium">
                  ⚠️ Large metadata detected ({userMetadata.size} characters)
                </p>
                <p className="text-red-600 text-sm mt-2">
                  This may cause HTTP 431 errors. Consider clearing some data.
                </p>
                <Button 
                  onClick={clearLargeData}
                  className="mt-3 bg-red-600 hover:bg-red-700 text-white"
                >
                  Clear Large Data
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
