import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow emergency pages through immediately
  if (pathname === '/clear-cookies' || pathname === '/fix-now' || pathname === '/emergency-clear' || pathname === '/emergency-dashboard' || pathname === '/root-cause-fix') {
    return NextResponse.next()
  }

  // Conservative 494 fix: Only clear cookies if they're very large
  try {
    const cookieHeader = request.headers.get('cookie')
    
    // If cookies are extremely large (>10KB), clear the largest ones
    if (cookieHeader && cookieHeader.length > 10000) {
      console.warn(`Large cookie header detected: ${cookieHeader.length} bytes - clearing largest cookies`)
      
      const response = NextResponse.next()

      // Clear only the largest cookies
      const cookiesToClear = [
        'sb-access-token', 'sb-refresh-token', 'supabase.auth.token'
      ]

      cookiesToClear.forEach((name) => {
        response.cookies.set({ name, value: '', path: '/', maxAge: 0 })
      })

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