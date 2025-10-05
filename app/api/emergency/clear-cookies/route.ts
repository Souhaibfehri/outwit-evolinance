import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ 
      success: true, 
      message: 'Cookies cleared successfully' 
    })

    // Clear all possible cookies
    const cookiesToClear = [
      'sb-access-token', 'sb-refresh-token', 'supabase.auth.token', 'supabase-auth-token',
      'vercel-auth-session', 'next-auth.session-token', 'session', 'auth', 'token',
      'jwt', 'cookie', 'auth-token', 'access-token', 'refresh-token', 'user-token',
      'app-session', 'supabase', 'supabase-auth'
    ]

    // Clear each cookie with multiple path/domain variations
    cookiesToClear.forEach(cookieName => {
      // Clear with different paths
      response.cookies.set({
        name: cookieName,
        value: '',
        path: '/',
        maxAge: 0,
        expires: new Date(0)
      })
      
      response.cookies.set({
        name: cookieName,
        value: '',
        path: '/',
        maxAge: 0,
        expires: new Date(0),
        secure: true
      })
      
      response.cookies.set({
        name: cookieName,
        value: '',
        path: '/',
        maxAge: 0,
        expires: new Date(0),
        sameSite: 'strict'
      })
    })

    // Set headers to prevent caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('X-Cookies-Cleared', 'true')

    return response

  } catch (error) {
    console.error('Error clearing cookies:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear cookies' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST method to clear cookies',
    cookies: request.cookies.getAll().map(c => ({ name: c.name, size: c.value?.length || 0 }))
  })
}
