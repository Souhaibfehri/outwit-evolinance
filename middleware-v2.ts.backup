import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Handle large header errors and production issues
  try {
    // Skip middleware for certain paths to prevent issues
    const { pathname } = request.nextUrl
    
    // Always allow these paths without auth
    const publicPaths = ['/login', '/signup', '/', '/migrate', '/debug']
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
    
    if (isPublicPath) {
      return NextResponse.next()
    }

    // Try to create Supabase client with error handling
    let supabaseResponse = NextResponse.next({
      request,
    })

    let user = null
    
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) =>
                request.cookies.set(name, value)
              )
              supabaseResponse = NextResponse.next({
                request,
              })
              cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options)
              )
            },
          },
        }
      )

      // Get user with timeout
      const { data: { user: authUser } } = await Promise.race([
        supabase.auth.getUser(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 5000))
      ]) as any

      user = authUser

    } catch (authError) {
      console.error('Auth error in middleware:', authError)
      // Continue without auth if there's an error
    }

    // Define protected routes
    const protectedRoutes = ['/dashboard', '/budget', '/bills', '/debts', '/goals', '/investments', '/reports', '/transactions', '/notifications', '/settings', '/income']
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
    const isOnboardingRoute = pathname.startsWith('/onboarding')

    // If no user and accessing protected route, redirect to login
    if (!user && (isProtectedRoute || isOnboardingRoute)) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }

    // If user exists, handle onboarding logic
    if (user) {
      // Redirect login/signup to appropriate page
      if (pathname === '/login' || pathname === '/signup') {
        const metadata = user.user_metadata || {}
        const onboardingCompleted = metadata.onboarding_done || metadata.migrated_to_database || false
        
        const url = request.nextUrl.clone()
        url.pathname = onboardingCompleted ? '/dashboard' : '/onboarding'
        return NextResponse.redirect(url)
      }
      
      // Allow onboarding routes
      if (isOnboardingRoute) {
        return supabaseResponse
      }
      
      // Check onboarding for protected routes
      if (isProtectedRoute) {
        const metadata = user.user_metadata || {}
        const onboardingCompleted = metadata.onboarding_done || metadata.migrated_to_database || false
        
        if (!onboardingCompleted) {
          const url = request.nextUrl.clone()
          url.pathname = '/onboarding'
          return NextResponse.redirect(url)
        }
      }
    }

    return supabaseResponse
    
  } catch (error) {
    console.error('Critical middleware error:', error)
    
    // For any critical error, allow the request to continue
    // This prevents the entire app from breaking
    console.log('🚨 Middleware bypassed due to critical error')
    return NextResponse.next()
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
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
