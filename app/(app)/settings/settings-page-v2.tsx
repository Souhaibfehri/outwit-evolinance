'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Settings,
  User,
  Bell,
  Shield,
  Download,
  Trash2,
  LogOut,
  Mail,
  Smartphone,
  Globe,
  Moon,
  Sun,
  Palette,
  RefreshCw,
  Key,
  HelpCircle,
  Sparkles,
  CreditCard,
  Users,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/marketing/theme-toggle'

interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  phone?: string
  timezone: string
  currency: string
  secondaryCurrency?: string
  householdMode: boolean
  notifications: {
    email: boolean
    push: boolean
    bills: boolean
    goals: boolean
    budgetAlerts: boolean
    overspending: boolean
  }
  preferences: {
    theme: 'light' | 'dark' | 'system'
    chartColors: string[]
    dashboardWidgets: string[]
    reportFrequency: 'weekly' | 'monthly' | 'quarterly'
  }
  security: {
    twoFactorEnabled: boolean
    lastPasswordChange?: string
    sessionTimeout: number
  }
}

const TIMEZONES = [
  'America/New_York',
  'America/Chicago', 
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney'
]

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' }
]

const THEME_COLORS = [
  { name: 'Orange (Default)', primary: '#ea580c', colors: ['#ea580c', '#dc2626', '#059669', '#2563eb', '#7c3aed'] },
  { name: 'Blue', primary: '#2563eb', colors: ['#2563eb', '#dc2626', '#059669', '#ea580c', '#7c3aed'] },
  { name: 'Green', primary: '#059669', colors: ['#059669', '#dc2626', '#2563eb', '#ea580c', '#7c3aed'] },
  { name: 'Purple', primary: '#7c3aed', colors: ['#7c3aed', '#dc2626', '#059669', '#2563eb', '#ea580c'] }
]

export function SettingsPageV2() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const supabase = createClient()
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        toast.error('Failed to load user data')
        return
      }

      setUser(authUser)

      // Load comprehensive user profile
      const metadata = authUser?.user_metadata || {}
      const userProfile: UserProfile = {
        id: authUser?.id || '',
        email: authUser?.email || '',
        full_name: metadata.full_name || metadata.name || '',
        avatar_url: metadata.avatar_url,
        phone: metadata.phone,
        timezone: metadata.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        currency: metadata.currency || 'USD',
        secondaryCurrency: metadata.secondaryCurrency,
        householdMode: metadata.householdMode || false,
        notifications: {
          email: metadata.notifications?.email ?? true,
          push: metadata.notifications?.push ?? true,
          bills: metadata.notifications?.bills ?? true,
          goals: metadata.notifications?.goals ?? true,
          budgetAlerts: metadata.notifications?.budgetAlerts ?? true,
          overspending: metadata.notifications?.overspending ?? true
        },
        preferences: {
          theme: metadata.preferences?.theme || 'system',
          chartColors: metadata.preferences?.chartColors || THEME_COLORS[0].colors,
          dashboardWidgets: metadata.preferences?.dashboardWidgets || ['kpis', 'goals', 'bills', 'activity'],
          reportFrequency: metadata.preferences?.reportFrequency || 'monthly'
        },
        security: {
          twoFactorEnabled: metadata.security?.twoFactorEnabled || false,
          lastPasswordChange: metadata.security?.lastPasswordChange,
          sessionTimeout: metadata.security?.sessionTimeout || 30
        }
      }

      setProfile(userProfile)
    } catch (error) {
      console.error('Error loading user data:', error)
      toast.error('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return

    setSaving(true)
    try {
      const supabase = createClient()
      
      const { error } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          ...updates
        }
      })

      if (error) throw error

      setProfile(prev => prev ? { ...prev, ...updates } : null)
      toast.success('Settings updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordReset = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(profile!.email, {
        redirectTo: `${window.location.origin}/auth/update-password`
      })

      if (error) throw error

      toast.success('Password reset email sent! Check your inbox.')
      setShowPasswordDialog(false)
    } catch (error) {
      console.error('Error sending password reset:', error)
      toast.error('Failed to send password reset email')
    }
  }

  const handleExportData = async () => {
    try {
      // In production, would call data export API
      toast.success('Data export started! You\'ll receive an email when ready.')
    } catch (error) {
      toast.error('Failed to export data')
    }
  }

  const handleDeleteAccount = async () => {
    try {
      // In production, would call account deletion API
      toast.error('Account deletion requires manual verification. Please contact support.')
      setShowDeleteDialog(false)
    } catch (error) {
      toast.error('Failed to delete account')
    }
  }

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      
      // Clear local storage
      localStorage.clear()
      
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out')
    }
  }

  const restartTutorial = () => {
    // Clear tutorial state and restart
    if (profile) {
      localStorage.removeItem(`tutorial-state-${profile.id}`)
      toast.success('Tutorial reset! Navigate to any page to start the guided tour.')
    }
  }

  const resetToDefaults = () => {
    if (!profile) return

    const defaultPreferences = {
      theme: 'system' as const,
      chartColors: THEME_COLORS[0].colors,
      dashboardWidgets: ['kpis', 'goals', 'bills', 'activity'],
      reportFrequency: 'monthly' as const
    }

    updateProfile({ preferences: defaultPreferences })
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Failed to Load Settings</h2>
        <p className="text-muted-foreground mb-4">Unable to load your profile data.</p>
        <Button onClick={loadUserData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account, preferences, and security
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={restartTutorial}>
            <HelpCircle className="h-4 w-4 mr-2" />
            Restart Tutorial
          </Button>
          <Button variant="outline" size="sm" onClick={resetToDefaults}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Defaults
          </Button>
        </div>
      </div>

      {/* Profile Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
              {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : (profile.email ? profile.email.charAt(0).toUpperCase() : 'U')}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100">
                {profile.full_name || 'Welcome'}
              </h2>
              <p className="text-blue-700 dark:text-blue-300">{profile.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  {profile.currency}
                </Badge>
                <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                  {profile.timezone ? (profile.timezone.split('/')[1]?.replace('_', ' ') || profile.timezone) : 'UTC'}
                </Badge>
                {profile.householdMode && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <Users className="h-3 w-3 mr-1" />
                    Household
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Settings */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={profile.full_name}
                onChange={(e) => setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                placeholder="Enter your full name"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="mt-1 bg-gray-50 dark:bg-gray-800"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>

            <div>
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                value={profile.phone || ''}
                onChange={(e) => setProfile(prev => prev ? { ...prev, phone: e.target.value } : null)}
                placeholder="+1 (555) 123-4567"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select 
                  value={profile.timezone} 
                  onValueChange={(value) => setProfile(prev => prev ? { ...prev, timezone: value } : null)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="currency">Primary Currency</Label>
                <Select 
                  value={profile.currency} 
                  onValueChange={(value) => setProfile(prev => prev ? { ...prev, currency: value } : null)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((curr) => (
                      <SelectItem key={curr.code} value={curr.code}>
                        {curr.symbol} {curr.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="secondaryCurrency">Secondary Currency (Optional)</Label>
              <Select 
                value={profile.secondaryCurrency || ''} 
                onValueChange={(value) => setProfile(prev => prev ? { ...prev, secondaryCurrency: value || undefined } : null)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {CURRENCIES.filter(c => c.code !== profile.currency).map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Household Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Share budget with spouse or roommates
                </p>
              </div>
              <Switch
                checked={profile.householdMode}
                onCheckedChange={(checked) => setProfile(prev => prev ? { ...prev, householdMode: checked } : null)}
              />
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button 
                onClick={() => updateProfile({
                  full_name: profile.full_name,
                  phone: profile.phone,
                  timezone: profile.timezone,
                  currency: profile.currency,
                  secondaryCurrency: profile.secondaryCurrency,
                  householdMode: profile.householdMode
                })}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-green-600" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive important updates via email
                  </p>
                </div>
                <Switch
                  checked={profile.notifications.email}
                  onCheckedChange={(checked) => 
                    setProfile(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, email: checked }
                    } : null)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Bill Due Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about upcoming bills
                  </p>
                </div>
                <Switch
                  checked={profile.notifications.bills}
                  onCheckedChange={(checked) => 
                    setProfile(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, bills: checked }
                    } : null)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Goal Progress</Label>
                  <p className="text-sm text-muted-foreground">
                    Celebrate milestones and track progress
                  </p>
                </div>
                <Switch
                  checked={profile.notifications.goals}
                  onCheckedChange={(checked) => 
                    setProfile(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, goals: checked }
                    } : null)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Overspending Warnings</Label>
                  <p className="text-sm text-muted-foreground">
                    Alert when approaching budget limits
                  </p>
                </div>
                <Switch
                  checked={profile.notifications.overspending}
                  onCheckedChange={(checked) => 
                    setProfile(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, overspending: checked }
                    } : null)
                  }
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button 
                onClick={() => updateProfile({ notifications: profile.notifications })}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {saving ? 'Saving...' : 'Save Notifications'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-600" />
              Appearance & Theme
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Color Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred color scheme
                </p>
              </div>
              <ThemeToggle />
            </div>

            <Separator />

            <div>
              <Label className="text-base mb-3 block">Chart Color Scheme</Label>
              <div className="grid grid-cols-2 gap-3">
                {THEME_COLORS.map((theme) => (
                  <Card 
                    key={theme.name}
                    className={`cursor-pointer transition-all duration-200 ${
                      JSON.stringify(profile.preferences.chartColors) === JSON.stringify(theme.colors)
                        ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                    onClick={() => setProfile(prev => prev ? {
                      ...prev,
                      preferences: { ...prev.preferences, chartColors: theme.colors }
                    } : null)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {theme.colors.slice(0, 4).map((color, index) => (
                            <div 
                              key={index}
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium">{theme.name}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button 
                onClick={() => updateProfile({ preferences: profile.preferences })}
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Save Theme
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              Security & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Change Password</Label>
                <p className="text-sm text-muted-foreground">
                  Update your account password
                </p>
              </div>
              <Button variant="outline" onClick={() => setShowPasswordDialog(true)}>
                <Key className="h-4 w-4 mr-2" />
                Reset Password
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Add extra security to your account
                </p>
              </div>
              <Switch
                checked={profile.security.twoFactorEnabled}
                onCheckedChange={(checked) => 
                  setProfile(prev => prev ? {
                    ...prev,
                    security: { ...prev.security, twoFactorEnabled: checked }
                  } : null)
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Export All Data</Label>
                <p className="text-sm text-muted-foreground">
                  Download your complete financial data
                </p>
              </div>
              <Button variant="outline" onClick={handleExportData}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base text-red-600">Delete Account</Label>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button 
                onClick={() => updateProfile({ security: profile.security })}
                disabled={saving}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Save Security
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sign Out */}
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Sign Out</Label>
              <p className="text-sm text-muted-foreground">
                Sign out of your account on this device
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Reset Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              We'll send a password reset link to your email address.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Email: <strong>{profile.email}</strong>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordReset}>
              Send Reset Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your financial data, budgets, goals, and transaction history will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                What will be deleted:
              </h4>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                <li>• All transactions and financial data</li>
                <li>• Budget categories and allocations</li>
                <li>• Goals, debts, and investment tracking</li>
                <li>• Reports and analytics history</li>
                <li>• Account settings and preferences</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
