import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  try {
    // Always allow these paths without any checks
    const publicPaths = [
      '/', '/login', '/signup', '/auth/callback',
      '/fix-now', '/fix-headers', '/fix', '/migrate', '/migrate-simple',
      '/debug', '/error', '/emergency', '/clear-data', '/clear-cookies'
    ]
    
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
    if (isPublicPath) {
      return NextResponse.next()
    }

    // Always allow static assets and API routes
    const staticPaths = ['/_next', '/favicon.ico', '/api']
    const isStaticPath = staticPaths.some(path => pathname.startsWith(path))
    if (isStaticPath) {
      return NextResponse.next()
    }

    // For protected routes, try auth check but don't fail on cookie issues
    try {
      let supabaseResponse = NextResponse.next({ request })

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) => {
                  request.cookies.set(name, value)
                  supabaseResponse.cookies.set(name, value, options)
                })
              } catch (cookieError) {
                // Ignore cookie setting errors to prevent redirect loops
                console.warn('Cookie setting error in middleware:', cookieError)
              }
            },
          },
        }
      )

      // Try to get user with timeout
      const { data: { user }, error } = await Promise.race([
        supabase.auth.getUser(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 3000))
      ]) as any

      if (error || !user) {
        // Not authenticated - redirect to login
        return NextResponse.redirect(new URL('/login', request.url))
      }

      // User is authenticated - allow request
      return supabaseResponse

    } catch (authError) {
      console.warn('Auth check failed in middleware:', authError)
      // If auth check fails (e.g., due to large cookies), redirect to login
      return NextResponse.redirect(new URL('/login', request.url))
    }

  } catch (error) {
    console.error('Middleware error:', error)
    
    // On any error, redirect to login instead of failing
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}