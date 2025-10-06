import { NextResponse, type NextRequest } from 'next/server'
import { logger } from '@/lib/utils/logger'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow emergency pages through immediately
  if (pathname === '/clear-cookies' || pathname === '/fix-now' || pathname === '/emergency-clear' || pathname === '/emergency-dashboard') {
    return NextResponse.next()
  }

  // DEFINITIVE 494 FIX: Always check and clear large cookies
  try {
    const cookieHeader = request.headers.get('cookie')
    
    // Calculate total header size
    let totalHeaderSize = 0
    for (const [name, value] of request.headers.entries()) {
      totalHeaderSize += name.length + value.length
    }
    
    // If total headers exceed 28KB (leaving 4KB buffer), clear ALL cookies
    if (totalHeaderSize > 28000) {
      logger.warn(`Total headers ${totalHeaderSize} bytes - clearing ALL cookies to prevent 494`, 'MIDDLEWARE')
      
      const response = NextResponse.next()

      // Clear ALL cookies that could cause issues
      const allCookies = cookieHeader ? cookieHeader.split(';').map(c => c.trim().split('=')[0]).filter(Boolean) : []
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
        response.cookies.set({ name, value: '', path: '/', maxAge: 0, domain: '.vercel.app' })
        response.cookies.set({ name, value: '', path: '/', maxAge: 0, domain: '.outwit-evolinance.vercel.app' })
      })

      response.headers.set('X-Emergency-Clear', 'true')
      return response
    }
    
    // If cookies alone are large (>6KB), clear the largest ones
    if (cookieHeader && cookieHeader.length > 6000) {
      logger.warn(`Large cookie header detected: ${cookieHeader.length} bytes - clearing largest cookies`, 'MIDDLEWARE')
      
      const response = NextResponse.next()

      // Clear the largest cookies
      const cookiesToClear = [
        'sb-access-token', 'sb-refresh-token', 'supabase.auth.token', 'supabase-auth-token'
      ]

      cookiesToClear.forEach((name) => {
        response.cookies.set({ name, value: '', path: '/', maxAge: 0 })
      })

      return response
    }
  } catch (error) {
    logger.error('Header processing error', 'MIDDLEWARE', error)
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