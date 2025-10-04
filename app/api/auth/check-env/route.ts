import { NextResponse } from 'next/server'

export async function GET() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL',
    'DIRECT_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ]

  const envStatus = requiredEnvVars.reduce((acc, envVar) => {
    const value = process.env[envVar]
    acc[envVar] = {
      exists: !!value,
      hasValue: !!value && value.length > 0,
      isPlaceholder: value?.includes('placeholder') || false,
      length: value?.length || 0
    }
    return acc
  }, {} as Record<string, any>)

  const allSet = Object.values(envStatus).every((status: any) => 
    status.exists && status.hasValue && !status.isPlaceholder
  )

  return NextResponse.json({
    allEnvironmentVariablesSet: allSet,
    environment: process.env.NODE_ENV,
    variables: envStatus,
    recommendations: allSet ? [] : [
      'Check Vercel Environment Variables in Settings',
      'Ensure all variables are set for Production, Preview, and Development',
      'Verify Supabase URL and keys are correct',
      'Make sure NEXTAUTH_URL matches your domain'
    ]
  })
}
