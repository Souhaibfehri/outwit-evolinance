'use client'

import { useState } from 'react'
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
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof formSchema>

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    setError(null)

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setIsLoading(false)
      } else if (authData.user) {
        // Create onboarding status record
        const onboardingStatus = {
          userId: authData.user.id,
          startedAt: new Date().toISOString(),
          completedAt: null,
          steps: {
            profile: false,
            income: false,
            bills: false,
            debts: false,
            goals: false,
            review: false
          }
        }

        // Update user metadata with onboarding status
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            name: data.name,
            onboarding_session: onboardingStatus
          }
        })

        if (updateError) {
          console.error('Failed to create onboarding status:', updateError)
        }

        setSuccess(true)
        // Redirect to onboarding instead of login
        setTimeout(() => {
          router.push('/onboarding')
        }, 2000)
      }
    } catch (error) {
      setError('An unexpected error occurred')
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
            Create an account
          </CardTitle>
          <CardDescription className="text-center text-gray-400">
            Start your journey to financial freedom
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success ? (
            <div className="text-center space-y-4 py-8">
              <div className="text-green-400 text-lg font-medium">
                Account created successfully!
              </div>
              <div className="text-gray-400">
                Redirecting to onboarding to set up your financial profile...
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-200">Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your name"
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
                          placeholder="Create a password"
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
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-200">Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Confirm your password"
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
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        {!success && (
          <CardFooter>
            <div className="text-sm text-gray-400 text-center w-full">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-orange-400 hover:text-orange-300 font-medium"
              >
                Sign in
              </Link>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
