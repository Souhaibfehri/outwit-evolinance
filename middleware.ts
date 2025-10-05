import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // EMERGENCY: If this is the clear-cookies page, allow it through immediately
  if (pathname === '/clear-cookies') {
    return NextResponse.next()
  }

  // PERMANENT FIX: Always clear ALL cookies to prevent 494 errors
  try {
    const headers = request.headers
    const cookieHeader = headers.get('cookie')
    
    // If ANY cookies exist, clear them all immediately
    if (cookieHeader && cookieHeader.length > 0) {
      console.log(`Clearing ${cookieHeader.length} bytes of cookies to prevent 494 error`)
      
      const response = NextResponse.next()

      // Clear ALL possible cookies with multiple variations
      const allCookies = cookieHeader.split(';').map(c => c.trim().split('=')[0]).filter(Boolean)
      const cookiesToClear = [
        ...allCookies,
        'sb-access-token', 'sb-refresh-token', 'supabase.auth.token', 'supabase-auth-token',
        'vercel-auth-session', 'next-auth.session-token', 'session', 'auth', 'token',
        'jwt', 'cookie', 'auth-token', 'access-token', 'refresh-token', 'user-token',
        'app-session', 'supabase', 'supabase-auth', 'sb-', 'vercel', 'next-auth'
      ]

      // Clear cookies with multiple variations
      cookiesToClear.forEach((name) => {
        response.cookies.set({ name, value: '', path: '/', maxAge: 0 })
        response.cookies.set({ name, value: '', path: '/', maxAge: 0, secure: true })
        response.cookies.set({ name, value: '', path: '/', maxAge: 0, sameSite: 'strict' })
        response.cookies.set({ name, value: '', path: '/', maxAge: 0, httpOnly: true })
      })

      // Set aggressive cache headers
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      response.headers.set('X-Cookies-Cleared', 'true')

      return response
    }
  } catch (error) {
    console.log('Header processing error:', error)
    // Continue with request even if header processing fails
  }

  // Always allow these paths without any checks
  const publicPaths = [
    '/', '/login', '/signup', '/auth/callback',
    '/fix-now', '/fix-headers', '/fix', '/migrate', '/migrate-simple',
    '/debug', '/error', '/emergency', '/clear-data', '/clear-cookies',
    '/features', '/pricing', '/blog', '/docs', '/privacy', '/terms'
  ]
  
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Always allow static assets and API routes
  const staticPaths = ['/_next', '/favicon.ico', '/api', '/favicon.svg']
  const isStaticPath = staticPaths.some(path => pathname.startsWith(path))
  if (isStaticPath) {
    return NextResponse.next()
  }

  // For protected routes, check if we're in development mode
  if (process.env.NODE_ENV === 'development') {
    // In development, allow all routes (auth bypass is handled in layout)
    console.log('DEV MODE: Allowing access to', pathname)
    return NextResponse.next()
  }

  // In production, we would check auth here, but for now allow through
  // The actual auth check happens in the layout component
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}