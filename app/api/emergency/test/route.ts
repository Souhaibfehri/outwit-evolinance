import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Get all headers
    const headers = request.headers
    const cookieHeader = headers.get('cookie')
    
    // Calculate sizes
    let totalHeaderSize = 0
    const headerBreakdown: Record<string, number> = {}
    
    for (const [name, value] of headers.entries()) {
      const size = name.length + value.length
      totalHeaderSize += size
      headerBreakdown[name] = size
    }
    
    // Check if we're within limits
    const withinLimits = totalHeaderSize < 32000 && (!cookieHeader || cookieHeader.length < 8000)
    
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      limits: {
        totalHeaders: {
          current: totalHeaderSize,
          limit: 32000,
          percentage: Math.round((totalHeaderSize / 32000) * 100),
          status: totalHeaderSize < 32000 ? 'OK' : 'EXCEEDED'
        },
        cookies: {
          current: cookieHeader?.length || 0,
          limit: 8000,
          percentage: Math.round(((cookieHeader?.length || 0) / 8000) * 100),
          status: (cookieHeader?.length || 0) < 8000 ? 'OK' : 'EXCEEDED'
        }
      },
      overall: withinLimits ? 'HEALTHY' : 'NEEDS_ATTENTION',
      recommendations: withinLimits ? [] : [
        'Headers or cookies are too large',
        'Try visiting /emergency-clear to clear cookies',
        'Check /emergency-dashboard for detailed analysis'
      ],
      headerBreakdown: Object.entries(headerBreakdown)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10) // Top 10 largest headers
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
