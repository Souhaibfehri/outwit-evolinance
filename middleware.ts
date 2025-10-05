import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // EMERGENCY: If this is the clear-cookies page, allow it through immediately
  if (pathname === '/clear-cookies') {
    return NextResponse.next()
  }

  // NUCLEAR OPTION: Always return a response that clears ALL cookies
  const response = NextResponse.next()

  // Clear ALL possible cookies with maximum aggression
  const cookiesToClear = [
    'sb-access-token', 'sb-refresh-token', 'supabase.auth.token', 'supabase-auth-token',
    'vercel-auth-session', 'next-auth.session-token', 'session', 'auth', 'token',
    'jwt', 'cookie', 'auth-token', 'access-token', 'refresh-token', 'user-token',
    'app-session', 'supabase', 'supabase-auth', 'sb-', 'vercel', 'next-auth',
    'supabase-auth-token', 'supabase.auth.token', 'sb-access-token', 'sb-refresh-token',
    'vercel-auth-session', 'next-auth.session-token', 'session', 'auth', 'token',
    'jwt', 'cookie', 'auth-token', 'access-token', 'refresh-token', 'user-token',
    'app-session', 'supabase', 'supabase-auth', 'sb-', 'vercel', 'next-auth'
  ]

  // Clear cookies with multiple variations - NUCLEAR OPTION
  cookiesToClear.forEach((name) => {
    response.cookies.set({ name, value: '', path: '/', maxAge: 0 })
    response.cookies.set({ name, value: '', path: '/', maxAge: 0, secure: true })
    response.cookies.set({ name, value: '', path: '/', maxAge: 0, sameSite: 'strict' })
    response.cookies.set({ name, value: '', path: '/', maxAge: 0, httpOnly: true })
    response.cookies.set({ name, value: '', path: '/', maxAge: 0, domain: '.vercel.app' })
    response.cookies.set({ name, value: '', path: '/', maxAge: 0, domain: '.outwit-evolinance.vercel.app' })
  })

  // Set aggressive cache headers
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  response.headers.set('X-Cookies-Cleared', 'true')
  response.headers.set('X-Header-Size-Fix', 'applied')

  return response

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