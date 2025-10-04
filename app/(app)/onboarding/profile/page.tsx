'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { User, Globe, DollarSign, ArrowRight } from 'lucide-react'
import { upsertOnboarding } from '../actions'
import { toast } from 'sonner'

interface ProfileData {
  name: string
  currency: string
  timezone: string
}

export default function ProfileStep() {
  const router = useRouter()
  const [formData, setFormData] = useState<ProfileData>({
    name: '',
    currency: 'USD',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  })
  const [isLoading, setIsLoading] = useState(false)

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('onboarding-profile')
    if (saved) {
      try {
        setFormData(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading saved profile data:', error)
      }
    }
  }, [])

  // Auto-save on changes
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('onboarding-profile', JSON.stringify(formData))
      saveProgress()
    }, 1000)

    return () => clearTimeout(timer)
  }, [formData])

  const saveProgress = async () => {
    const formDataObj = new FormData()
    formDataObj.append('step', '0')
    formDataObj.append('payload', JSON.stringify(formData))
    
    await upsertOnboarding(formDataObj)
  }

  const handleContinue = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter your name')
      return
    }

    setIsLoading(true)
    try {
      await saveProgress()
      router.push('/onboarding/income')
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Failed to save progress')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveAndExit = async () => {
    await saveProgress()
    router.push('/dashboard')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto">
          <User className="h-8 w-8 text-orange-600 dark:text-orange-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome to Outwit Budget!
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Let's set up your financial foundation. This takes about 3-5 minutes, and you can pause anytime.
        </p>
      </div>

      {/* Profile Form */}
      <Card className="max-w-2xl mx-auto bg-white/80 backdrop-blur-xl border border-gray-200/50 dark:bg-gray-900/80 dark:border-gray-800/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <span>Tell us about yourself</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="md:col-span-2">
              <Label className="text-gray-700 dark:text-gray-300">
                What should we call you? *
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your preferred name"
                className="mt-2"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This is how we'll address you throughout the app
              </p>
            </div>

            {/* Currency */}
            <div>
              <Label className="text-gray-700 dark:text-gray-300">
                <DollarSign className="inline h-4 w-4 mr-1" />
                Currency
              </Label>
              <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($) - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                  <SelectItem value="GBP">GBP (£) - British Pound</SelectItem>
                  <SelectItem value="CAD">CAD (C$) - Canadian Dollar</SelectItem>
                  <SelectItem value="AUD">AUD (A$) - Australian Dollar</SelectItem>
                  <SelectItem value="JPY">JPY (¥) - Japanese Yen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Timezone */}
            <div>
              <Label className="text-gray-700 dark:text-gray-300">
                <Globe className="inline h-4 w-4 mr-1" />
                Timezone
              </Label>
              <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  <SelectItem value="America/Toronto">Toronto (ET)</SelectItem>
                  <SelectItem value="Europe/London">London (GMT)</SelectItem>
                  <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                  <SelectItem value="Australia/Sydney">Sydney (AEDT)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                For accurate payment reminders and reports
              </p>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="bg-blue-50/50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200/50 dark:border-blue-800/50">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Privacy first:</strong> Your data is encrypted and never shared. We use bank-grade security to protect your information.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={handleSaveAndExit}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Save & Exit
        </Button>

        <Button
          onClick={handleContinue}
          disabled={!formData.name.trim() || isLoading}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
          ) : (
            <>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
