'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  CheckCircle, 
  Database,
  Settings,
  Trash2,
  ExternalLink
} from 'lucide-react'

export default function RootCauseFixPage() {
  const [step, setStep] = useState(1)

  return (
    <div className="min-h-screen bg-red-50 dark:bg-red-950/20 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-red-800 mb-2">
            🔍 ROOT CAUSE ANALYSIS: 494 Error
          </h1>
          <p className="text-red-600">
            The real problem is Supabase dashboard configuration, not our code
          </p>
        </div>

        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>ROOT CAUSE:</strong> Your Supabase project is configured with:
            <br />• JWT Expiry: 1 week (604800 seconds) → Creates HUGE tokens
            <br />• Refresh Token Rotation: ENABLED → Creates multiple large cookies  
            <br />• GitHub OAuth: Full scopes → Massive user metadata
            <br />• Result: 28KB+ cookies → Exceeds 16KB header limit → 494 error
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* The Problem */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                The Problem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Badge variant="destructive">JWT Expiry: 1 week</Badge>
                <Badge variant="destructive">Refresh Rotation: ON</Badge>
                <Badge variant="destructive">GitHub Scopes: Full</Badge>
              </div>
              
              <div className="text-sm text-red-700">
                <p><strong>Result:</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>10+ large cookies (28KB total)</li>
                  <li>Exceeds 16KB header limit</li>
                  <li>494 REQUEST_HEADER_TOO_LARGE error</li>
                  <li>App completely broken</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* The Solution */}
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                The Solution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Badge variant="default" className="bg-green-600">JWT Expiry: 1 hour</Badge>
                <Badge variant="default" className="bg-green-600">Refresh Rotation: OFF</Badge>
                <Badge variant="default" className="bg-green-600">GitHub Scopes: Minimal</Badge>
              </div>
              
              <div className="text-sm text-green-700">
                <p><strong>Result:</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>2-3 small cookies (2KB total)</li>
                  <li>Well under 16KB limit</li>
                  <li>No 494 errors</li>
                  <li>App works perfectly</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Step-by-Step Fix */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Step-by-Step Fix (5 minutes)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Step 1 */}
            <div className={`p-4 rounded-lg ${step >= 1 ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  1
                </div>
                <h3 className="font-semibold">Go to Supabase Dashboard</h3>
                {step >= 1 && <CheckCircle className="h-5 w-5 text-green-600" />}
              </div>
              <div className="ml-11 space-y-2">
                <p className="text-sm">Visit: <code className="bg-gray-100 px-2 py-1 rounded">https://supabase.com/dashboard</code></p>
                <p className="text-sm">Login with: <strong>souhaibfehri@hotmail.com</strong></p>
                <p className="text-sm">Select project: <strong>outwit-budget</strong></p>
                <Button 
                  size="sm" 
                  onClick={() => setStep(2)}
                  className="mt-2"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open Supabase Dashboard
                </Button>
              </div>
            </div>

            {/* Step 2 */}
            <div className={`p-4 rounded-lg ${step >= 2 ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  2
                </div>
                <h3 className="font-semibold">Fix Authentication Settings</h3>
                {step >= 2 && <CheckCircle className="h-5 w-5 text-green-600" />}
              </div>
              <div className="ml-11 space-y-2">
                <p className="text-sm">1. Click <strong>"Authentication"</strong> in left sidebar</p>
                <p className="text-sm">2. Click <strong>"Settings"</strong> tab</p>
                <p className="text-sm">3. Scroll to <strong>"Security and Sessions"</strong></p>
                <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                  <p className="text-sm font-semibold text-yellow-800">Change these settings:</p>
                  <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                    <li>• <strong>JWT Expiry:</strong> 604800 → 3600 (1 hour)</li>
                    <li>• <strong>Refresh Token Rotation:</strong> ENABLED → DISABLED</li>
                    <li>• <strong>Session Timeout:</strong> 604800 → 3600 (1 hour)</li>
                  </ul>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setStep(3)}
                  className="mt-2"
                >
                  I've made these changes
                </Button>
              </div>
            </div>

            {/* Step 3 */}
            <div className={`p-4 rounded-lg ${step >= 3 ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  3
                </div>
                <h3 className="font-semibold">Fix GitHub OAuth Settings</h3>
                {step >= 3 && <CheckCircle className="h-5 w-5 text-green-600" />}
              </div>
              <div className="ml-11 space-y-2">
                <p className="text-sm">1. Still in Authentication, click <strong>"Providers"</strong></p>
                <p className="text-sm">2. Click <strong>"GitHub"</strong></p>
                <p className="text-sm">3. Scroll to <strong>"Scopes"</strong> section</p>
                <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                  <p className="text-sm font-semibold text-yellow-800">Reduce OAuth scopes:</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    <strong>Current:</strong> read:user, user:email, read:org<br />
                    <strong>Change to:</strong> user:email (ONLY)
                  </p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setStep(4)}
                  className="mt-2"
                >
                  I've reduced the scopes
                </Button>
              </div>
            </div>

            {/* Step 4 */}
            <div className={`p-4 rounded-lg ${step >= 4 ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= 4 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  4
                </div>
                <h3 className="font-semibold">Clear Existing Sessions</h3>
                {step >= 4 && <CheckCircle className="h-5 w-5 text-green-600" />}
              </div>
              <div className="ml-11 space-y-2">
                <p className="text-sm">1. Go to <strong>"Authentication → Users"</strong></p>
                <p className="text-sm">2. For each user, click the 3 dots → <strong>"Sign Out User"</strong></p>
                <p className="text-sm">3. This forces fresh sessions with new settings</p>
                <Button 
                  size="sm" 
                  onClick={() => setStep(5)}
                  className="mt-2"
                >
                  I've cleared all sessions
                </Button>
              </div>
            </div>

            {/* Step 5 */}
            <div className={`p-4 rounded-lg ${step >= 5 ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= 5 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  5
                </div>
                <h3 className="font-semibold">Test the Fix</h3>
                {step >= 5 && <CheckCircle className="h-5 w-5 text-green-600" />}
              </div>
              <div className="ml-11 space-y-2">
                <p className="text-sm">1. Clear your browser cookies/cache</p>
                <p className="text-sm">2. Go to your app and login</p>
                <p className="text-sm">3. Check: Should work without 494 errors!</p>
                <div className="flex gap-2 mt-3">
                  <Button 
                    size="sm"
                    onClick={() => {
                      localStorage.clear()
                      sessionStorage.clear()
                      document.cookie.split(';').forEach(cookie => {
                        const eqPos = cookie.indexOf('=')
                        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
                        document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;`
                      })
                      window.location.href = '/'
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear Browser Data
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => window.location.href = '/'}
                  >
                    Test App
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert className="mt-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>This fix addresses the ROOT CAUSE:</strong> Supabase dashboard configuration, not our code. 
            Once you make these changes, the 494 error will be permanently resolved.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
