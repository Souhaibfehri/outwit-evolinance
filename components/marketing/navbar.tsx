'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './theme-toggle'
import { OutwitLogo } from '@/components/ui/outwit-logo'
import { PiggyBank, User, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
      setLoading(false)
    }
    
    checkAuth()
    
    // Listen for auth changes
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user)
    })
    
    return () => subscription.unsubscribe()
  }, [])
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/20 bg-white/80 backdrop-blur-xl dark:border-gray-800/20 dark:bg-gray-900/80">
      <div className="container flex h-16 items-center justify-between px-4 mx-auto max-w-7xl">
        {/* Logo */}
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <OutwitLogo size={32} showText={true} />
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link 
            href="/features" 
            className="text-sm font-medium text-gray-700 hover:text-teal-600 dark:text-gray-300 dark:hover:text-teal-400 transition-colors"
          >
            Features
          </Link>
          <Link 
            href="/pricing" 
            className="text-sm font-medium text-gray-700 hover:text-teal-600 dark:text-gray-300 dark:hover:text-teal-400 transition-colors"
          >
            Pricing
          </Link>
          <Link 
            href="/blog" 
            className="text-sm font-medium text-gray-700 hover:text-teal-600 dark:text-gray-300 dark:hover:text-teal-400 transition-colors"
          >
            Blog
          </Link>
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          
          {loading ? (
            <div className="flex space-x-2">
              <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ) : isAuthenticated ? (
            // Authenticated user - show Dashboard and Account
            <>
              <Link href="/dashboard">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-700 hover:text-orange-600 dark:text-gray-300 dark:hover:text-orange-400"
                >
                  <User className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              
              <Link href="/settings">
                <Button 
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-500 dark:hover:bg-orange-600"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Account
                </Button>
              </Link>
            </>
          ) : (
            // Not authenticated - show Sign In and Get Started
            <>
              <Link href="/login">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-700 hover:text-orange-600 dark:text-gray-300 dark:hover:text-orange-400"
                >
                  Sign In
                </Button>
              </Link>
              
              <Link href="/signup">
                <Button 
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-500 dark:hover:bg-orange-600"
                >
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
