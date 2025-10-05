import type { Metadata } from "next"
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/marketing/theme-toggle'
import { OutwitLogo } from '@/components/ui/outwit-logo'
import { FoxyProvider } from '@/components/foxy/foxy-provider'
import { TutorialProvider } from '@/components/tutorials/tutorial-provider'
import { BadgeShowcase } from '@/components/tutorials/badge-showcase'
import { UserProfileMenu } from '@/components/ui/user-profile-menu'
import { NotificationsDropdown } from '@/components/ui/notifications-dropdown-working'
import { LogoutHandler } from '@/components/ui/logout-handler'
import { HeaderSizeGuard } from '@/components/utils/header-size-guard'

export const metadata: Metadata = {
  title: {
    template: '%s | Outwit Budget',
    default: 'Dashboard | Outwit Budget'
  },
  description: 'Manage your finances with zero-based budgeting, smart debt payoff, and comprehensive tracking.',
  robots: {
    index: false, // App pages should not be indexed
    follow: false,
  },
}
import { 
  LayoutDashboard, 
  Wallet, 
  CreditCard, 
  Receipt, 
  TrendingUp, 
  Target, 
  Minus,
  BarChart3, 
  Bell,
  Settings, 
  LogOut,
  Menu,
  User,
  DollarSign,
  Calendar
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/budget', label: 'Budget', icon: Wallet },
  { href: '/forecast', label: 'Forecast', icon: Calendar },
  { href: '/income', label: 'Income', icon: DollarSign },
  { href: '/transactions', label: 'Transactions', icon: CreditCard },
  { href: '/bills', label: 'Bills', icon: Receipt },
  { href: '/investments', label: 'Investments', icon: TrendingUp },
  { href: '/debts', label: 'Debts', icon: Minus },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // BYPASS AUTH FOR LOCAL TESTING
  let user: any
  if (process.env.NODE_ENV === 'development') {
    // Create a mock user for local testing
    user = {
      id: 'local-test-user',
      email: 'test@local.dev',
      user_metadata: {
        name: 'Local Test User',
        onboarding_done: true
      }
    }
  } else {
    // Production authentication
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      redirect('/login')
    }
    user = authUser
  }

  async function signOut() {
    'use server'
    
    if (process.env.NODE_ENV === 'development') {
      // In development, just redirect to login
      redirect('/login')
    } else {
      // Production sign out
      const supabase = await createClient()
      await supabase.auth.signOut()
      redirect('/login')
    }
  }

  return (
    <HeaderSizeGuard>
      <TutorialProvider userId={user.id} hasCompletedOnboarding={user.user_metadata?.onboarding_done || false}>
        <FoxyProvider userId={user.id}>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
            {/* Sidebar */}
            <aside className="hidden md:flex md:w-64 md:flex-col">
              <div className="flex flex-col flex-grow border-r border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/50 backdrop-blur">
                <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-800">
                  <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
                    <OutwitLogo size={40} showText={true} />
                  </Link>
                </div>
                <nav className="flex-1 px-4 pb-4 space-y-2 mt-6">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="sidebar-item flex items-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white group"
                      >
                        <Icon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400 group-hover:text-orange-600 dark:group-hover:text-white transition-colors" />
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>
              </div>
            </aside>

            {/* Main content */}
            <div className="flex flex-col flex-1">
              {/* Header */}
              <header className="flex items-center justify-between h-16 px-6 bg-white/95 dark:bg-gray-900/50 backdrop-blur border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-4">
                  <button className="md:hidden">
                    <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                  </button>
                  {/* Mobile Logo */}
                  <div className="md:hidden">
                    <Link href="/dashboard">
                      <OutwitLogo size={32} showText={true} />
                    </Link>
                  </div>
                </div>
                
                <div className="flex-1" />
                
                <div className="flex items-center gap-4">
                  {/* Theme Toggle */}
                  <ThemeToggle />

                  {/* Notifications */}
                  <NotificationsDropdown />

                  {/* User Menu */}
                  <UserProfileMenu 
                    userEmail={user.email || 'User'} 
                    userId={user.id}
                    signOutAction={signOut}
                  />
                </div>
              </header>

              {/* Page content */}
              <main className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                {children}
              </main>
            </div>
            
            {/* Badge Showcase - Left Side */}
            <BadgeShowcase userId={user.id} position="left" />
            
            {/* Logout Handler - Clears localStorage on signout */}
            <LogoutHandler userId={user.id} />
          </div>
        </FoxyProvider>
      </TutorialProvider>
    </HeaderSizeGuard>
  )
}
