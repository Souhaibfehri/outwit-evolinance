import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Fix HTTP 431 - Handle large headers/cookies
  try {
    // Check header size and clean up if too large
    const headers = request.headers
    const cookieHeader = headers.get('cookie')
    
    // If cookies are too large, clean them up
    if (cookieHeader && cookieHeader.length > 4000) {
      console.log('Large cookie detected, cleaning up...')
      
      // Create response with cleaned cookies
      const response = NextResponse.next()
      
      // Clear problematic cookies
      const cookiesToClear = [
        'sb-access-token',
        'sb-refresh-token', 
        'supabase.auth.token',
        'supabase-auth-token',
        'vercel-auth-session',
        'next-auth.session-token'
      ]
      
      cookiesToClear.forEach(cookieName => {
        response.cookies.delete(cookieName)
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