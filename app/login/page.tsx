'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { OutwitLogo } from '@/components/ui/outwit-logo'
import { Loader2 } from 'lucide-react'

const formSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormData = z.infer<typeof formSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const didRedirect = useRef(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Prevent double redirects and check existing session
  useEffect(() => {
    if (didRedirect.current) return

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user && !didRedirect.current) {
        didRedirect.current = true
        
        // Check onboarding status to determine redirect
        const metadata = session.user.user_metadata || {}
        const onboardingCompleted = metadata.onboarding_done || metadata.onboarding_session?.completed
        
        router.replace(onboardingCompleted ? '/dashboard' : '/onboarding')
      }
    }

    checkSession()
  }, [router, supabase.auth])

  async function onSubmit(data: FormData) {
    if (didRedirect.current) return
    
    setIsLoading(true)
    setError(null)

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        setError(error.message)
        setIsLoading(false)
      } else if (authData.user && !didRedirect.current) {
        didRedirect.current = true
        
        // Check onboarding status to determine redirect
        const metadata = authData.user.user_metadata || {}
        const onboardingCompleted = metadata.onboarding_done || metadata.onboarding_session?.completed
        
        router.replace(onboardingCompleted ? '/dashboard' : '/onboarding')
      }
    } catch (error) {
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  // Forgot password handler
  const handleForgotPassword = async () => {
    const email = form.getValues('email')
    if (!email) {
      setError('Please enter your email address first')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`
      })

      if (error) {
        setError(error.message)
      } else {
        setError(null)
        alert(`Password reset email sent to ${email}. Check your inbox and follow the instructions.`)
      }
    } catch (error) {
      setError('Failed to send password reset email')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4">
      <Card className="w-full max-w-md bg-gray-800/50 backdrop-blur border-gray-700">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <OutwitLogo size={48} showText={false} />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-white">
            Welcome back
          </CardTitle>
          <CardDescription className="text-center text-gray-400">
            Sign in to your Outwit Budget account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200">Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your email"
                        type="email"
                        disabled={isLoading}
                        className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200">Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your password"
                        type="password"
                        disabled={isLoading}
                        className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && (
                <div className="text-sm text-red-400 bg-red-950/20 border border-red-800/30 rounded-lg p-3 text-center">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </Form>

          <div className="text-center">
            <button
              onClick={handleForgotPassword}
              className="text-sm text-gray-400 hover:text-gray-200 underline"
            >
              Forgot your password?
            </button>
          </div>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-gray-400 text-center w-full">
            Don't have an account?{' '}
            <Link
              href="/signup"
              className="text-orange-400 hover:text-orange-300 font-medium"
            >
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
