'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, CheckCircle, Trash2, RefreshCw } from 'lucide-react'

export default function ClearMetadataPage() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [metadataSize, setMetadataSize] = useState(0)
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    checkUserMetadata()
  }, [])

  const checkUserMetadata = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const metadata = user.user_metadata || {}
        const metadataString = JSON.stringify(metadata)
        const size = metadataString.length
        
        setUserInfo({
          email: user.email,
          id: user.id,
          metadata,
          dataBreakdown: {
            transactions: metadata.transactions?.length || 0,
            transactions_v2: metadata.transactions_v2?.length || 0,
            goals: metadata.goals?.length || 0,
            goals_v2: metadata.goals_v2?.length || 0,
            debts: metadata.debts?.length || 0,
            debt_accounts: metadata.debt_accounts?.length || 0,
            bills: metadata.bills?.length || 0,
            income: metadata.recurring_income?.length || 0,
            income_sources: metadata.income_sources?.length || 0,
            income_occurrences: metadata.income_occurrences?.length || 0,
            investments: metadata.investments?.length || 0,
            investment_accounts: metadata.investment_accounts?.length || 0,
            coach_messages: metadata.coach_messages?.length || 0,
            tutorial_state: metadata.tutorial_state ? 'exists' : 'none'
          }
        })
        setMetadataSize(size)
      }
    } catch (error) {
      console.error('Error checking metadata:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearLargeMetadata = async () => {
    if (!confirm('This will clear large data arrays but keep essential settings. Continue?')) {
      return
    }

    setClearing(true)
    try {
      const supabase = createClient()
      
      // Keep only essential metadata, remove large arrays
      const essentialData = {
        // Keep profile essentials
        name: userInfo.metadata.name,
        full_name: userInfo.metadata.full_name,
        currency: userInfo.metadata.currency || 'USD',
        timezone: userInfo.metadata.timezone,
        onboarding_done: true,
        onboarding_session: { completed: true },
        
        // Keep small arrays with sample data only
        goals: userInfo.metadata.goals?.slice(0, 2) || [],
        debts: userInfo.metadata.debts?.slice(0, 2) || [],
        bills: userInfo.metadata.bills?.slice(0, 3) || [],
        transactions: userInfo.metadata.transactions?.slice(-10) || [], // Keep last 10
        
        // Clear large arrays that cause header issues
        // transactions_v2: [], // Remove if exists
        // income_occurrences: [], // Remove if exists
        // coach_messages: [], // Remove if exists
        
        // Keep settings
        notifications: userInfo.metadata.notifications || {
          email: true,
          bills: true,
          goals: true,
          budgetAlerts: true
        }
      }

      const { error } = await supabase.auth.updateUser({
        data: essentialData
      })

      if (error) throw error
      
      alert('✅ Large metadata cleared! The 431 error should be resolved. Refresh the page.')
      checkUserMetadata()
    } catch (error) {
      console.error('Error clearing metadata:', error)
      alert('❌ Failed to clear metadata')
    } finally {
      setClearing(false)
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
          <p>Loading metadata information...</p>
        </div>
      </div>
    )
  }

  const isLarge = metadataSize > 8000 // 8KB threshold

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Fix REQUEST_HEADER_TOO_LARGE Error</h1>
      
      <div className="space-y-6">
        {/* Status Alert */}
        <Alert className={isLarge ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
          <AlertTriangle className={`h-4 w-4 ${isLarge ? 'text-red-600' : 'text-green-600'}`} />
          <AlertDescription>
            {isLarge ? (
              <div>
                <strong>🚨 Large Metadata Detected</strong><br />
                Your user metadata is {formatBytes(metadataSize)}, which exceeds header limits and causes 431 errors.
              </div>
            ) : (
              <div>
                <strong>✅ Metadata Size OK</strong><br />
                Your user metadata is {formatBytes(metadataSize)}, which is within acceptable limits.
              </div>
            )}
          </AlertDescription>
        </Alert>

        {/* Metadata Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>User Metadata Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {userInfo?.dataBreakdown && Object.entries(userInfo.dataBreakdown).map(([key, value]) => (
                <div key={key} className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="font-medium text-sm">{key.replace(/_/g, ' ')}</div>
                  <div className="text-lg font-bold">{value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><strong>Email:</strong> {userInfo?.email}</div>
              <div><strong>User ID:</strong> {userInfo?.id}</div>
              <div><strong>Metadata Size:</strong> {formatBytes(metadataSize)}</div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {isLarge && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">⚠️ Action Required</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700 mb-4">
                Your metadata is too large and causing REQUEST_HEADER_TOO_LARGE errors. 
                Click below to clear large data arrays while keeping essential settings.
              </p>
              <div className="flex gap-3">
                <Button 
                  onClick={clearLargeMetadata}
                  disabled={clearing}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {clearing ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  {clearing ? 'Clearing...' : 'Clear Large Data'}
                </Button>
                <Button variant="outline" onClick={checkUserMetadata}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Check
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Fix REQUEST_HEADER_TOO_LARGE</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">🎯 The Problem:</h4>
              <p className="text-sm text-gray-600">
                Outwit Budget stores user data in Supabase user metadata. When this data gets large 
                (transactions, goals, etc.), it causes HTTP headers to exceed size limits.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">✅ The Solution:</h4>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Clear large data arrays (keeping essential settings)</li>
                <li>Use the app normally (data will rebuild gradually)</li>
                <li>For production: move to proper database storage</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium mb-2">🔒 What's Preserved:</h4>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Profile settings (name, currency, timezone)</li>
                <li>Onboarding completion status</li>
                <li>Notification preferences</li>
                <li>Sample data (2-3 items per category for testing)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
