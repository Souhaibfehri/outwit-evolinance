'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, Settings, ExternalLink } from 'lucide-react'

export function EnvironmentCheck() {
  const [envStatus, setEnvStatus] = useState({
    supabase: false,
    openai: false,
    database: false,
    nextauth: false
  })

  useEffect(() => {
    // Check environment variables on client side
    setEnvStatus({
      supabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && 
                   process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'),
      openai: !!process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      database: !!process.env.NEXT_PUBLIC_DATABASE_URL,
      nextauth: !!process.env.NEXT_PUBLIC_NEXTAUTH_SECRET
    })
  }, [])

  const allConfigured = Object.values(envStatus).every(Boolean)

  if (allConfigured) return null

  return (
    <Card className="mb-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
          <Settings className="h-5 w-5" />
          Environment Configuration Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-yellow-700 dark:text-yellow-300 text-sm">
          Some features require API keys to be configured. The app will work with limited functionality until configured.
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Supabase (Auth & Database)</span>
            {envStatus.supabase ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Ready
              </Badge>
            ) : (
              <Badge className="bg-yellow-100 text-yellow-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Missing
              </Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">OpenAI (AI Coach)</span>
            {envStatus.openai ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Ready
              </Badge>
            ) : (
              <Badge className="bg-yellow-100 text-yellow-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Missing
              </Badge>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-yellow-200 dark:border-yellow-800">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open('https://vercel.com/docs/projects/environment-variables', '_blank')}
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Configure Environment Variables
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
