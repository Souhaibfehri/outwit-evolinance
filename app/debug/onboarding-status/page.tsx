import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { redirect } from 'next/navigation'

// Force dynamic rendering for this debug page
export const dynamic = 'force-dynamic'

export default async function OnboardingStatusPage() {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Card>
            <CardContent className="p-6">
              <p className="text-red-600">Authentication error: {error.message}</p>
              <Link href="/login" className="text-blue-600 underline">Login here</Link>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (!user) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Card>
            <CardContent className="p-6">
              <p>Not authenticated. <Link href="/login" className="text-blue-600 underline">Login here</Link></p>
            </CardContent>
          </Card>
        </div>
      )
    }

  const metadata = user.user_metadata || {}
  const onboardingCompleted = metadata.onboarding_done || metadata.onboarding_session?.completed

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Onboarding Status Debug</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><strong>User ID:</strong> {user.id}</div>
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Onboarding Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <strong>Overall Status:</strong>
              <Badge variant={onboardingCompleted ? "default" : "destructive"}>
                {onboardingCompleted ? "COMPLETED" : "NEEDS ONBOARDING"}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>onboarding_done:</strong>
                <Badge variant={metadata.onboarding_done ? "default" : "secondary"} className="ml-2">
                  {metadata.onboarding_done ? "TRUE" : "FALSE/UNDEFINED"}
                </Badge>
              </div>
              
              <div>
                <strong>onboarding_session.completed:</strong>
                <Badge variant={metadata.onboarding_session?.completed ? "default" : "secondary"} className="ml-2">
                  {metadata.onboarding_session?.completed ? "TRUE" : "FALSE/UNDEFINED"}
                </Badge>
              </div>
            </div>

            {metadata.onboarding_session && (
              <div>
                <strong>Onboarding Session:</strong>
                <div className="ml-4 text-sm">
                  <div>Current Step: {metadata.onboarding_session.currentStep || 0}</div>
                  <div>Completed: {metadata.onboarding_session.completed ? "Yes" : "No"}</div>
                  <div>Steps Done: {JSON.stringify(metadata.onboarding_session.stepsDone || [])}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Full User Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(metadata, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Middleware Behavior</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>When accessing protected routes (like /dashboard):</strong>
              <div className="ml-4">
                {onboardingCompleted ? (
                  <span className="text-green-600">✅ Will allow access</span>
                ) : (
                  <span className="text-red-600">🔄 Will redirect to /onboarding</span>
                )}
              </div>
            </div>
            
            <div>
              <strong>When accessing /login or /signup:</strong>
              <div className="ml-4">
                {onboardingCompleted ? (
                  <span className="text-blue-600">🔄 Will redirect to /dashboard</span>
                ) : (
                  <span className="text-orange-600">🔄 Will redirect to /onboarding</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button asChild>
            <Link href="/onboarding">Go to Onboarding</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    </div>
  )
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-red-600 mb-4">Debug Page Error</h2>
            <p className="text-red-600 mb-4">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
            <div className="space-y-2">
              <Button asChild>
                <Link href="/login">Go to Login</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard">Try Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
}
