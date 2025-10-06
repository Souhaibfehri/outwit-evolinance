import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Check header sizes
    const headers = request.headers
    const cookieHeader = headers.get('cookie')
    const userAgent = headers.get('user-agent')
    const acceptLanguage = headers.get('accept-language')
    
    // Calculate header sizes
    let totalHeaderSize = 0
    const headerSizes: Record<string, number> = {}
    
    for (const [name, value] of headers.entries()) {
      const size = name.length + value.length
      totalHeaderSize += size
      headerSizes[name] = size
    }
    
    // Check cookie sizes
    const cookieSizes: Record<string, number> = {}
    if (cookieHeader) {
      const cookies = cookieHeader.split(';')
      cookies.forEach(cookie => {
        const [name, value] = cookie.trim().split('=')
        if (name && value) {
          cookieSizes[name] = value.length
        }
      })
    }
    
    // Test Supabase connection
    let supabaseStatus = 'unknown'
    let authStatus = 'unknown'
    try {
      const supabase = await createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      supabaseStatus = error ? 'error' : 'connected'
      authStatus = user ? 'authenticated' : 'anonymous'
    } catch (error) {
      supabaseStatus = 'error'
    }
    
    const responseTime = Date.now() - startTime
    
    // Determine overall health
    const isHealthy = totalHeaderSize < 28000 && 
                     (!cookieHeader || cookieHeader.length < 6000) &&
                     supabaseStatus === 'connected'
    
    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'warning',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      headers: {
        totalSize: totalHeaderSize,
        limit: 32000,
        percentage: Math.round((totalHeaderSize / 32000) * 100),
        breakdown: headerSizes
      },
      cookies: {
        totalSize: cookieHeader?.length || 0,
        limit: 8000,
        percentage: Math.round(((cookieHeader?.length || 0) / 8000) * 100),
        breakdown: cookieSizes,
        count: Object.keys(cookieSizes).length
      },
      supabase: {
        status: supabaseStatus,
        auth: authStatus
      },
      recommendations: isHealthy ? [] : [
        totalHeaderSize > 28000 ? 'Headers too large - middleware should clear cookies' : null,
        (cookieHeader?.length || 0) > 6000 ? 'Cookie header too large - should be cleared' : null,
        supabaseStatus !== 'connected' ? 'Supabase connection issue' : null
      ].filter(Boolean)
    })
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      recommendations: ['Check server logs', 'Try emergency clear']
    }, { status: 500 })
  }
}
