'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Bell, 
  Palette, 
  Download,
  Trash2,
  Settings as SettingsIcon,
  Save,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'

interface UserSettings {
  displayName: string
  email: string
  currency: string
  timezone: string
  notifications: {
    billReminders: boolean
    budgetAlerts: boolean
    goalMilestones: boolean
    weeklyReports: boolean
  }
  preferences: {
    darkMode: boolean
    weekStart: 'sunday' | 'monday'
    dateFormat: string
  }
}

export function SimpleSettings() {
  const [settings, setSettings] = useState<UserSettings>({
    displayName: '',
    email: '',
    currency: 'USD',
    timezone: 'UTC',
    notifications: {
      billReminders: true,
      budgetAlerts: true,
      goalMilestones: true,
      weeklyReports: false
    },
    preferences: {
      darkMode: false,
      weekStart: 'sunday',
      dateFormat: 'MM/DD/YYYY'
    }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      // For now, just use default settings
      // In production, this would fetch from user metadata
      setSettings({
        displayName: 'User',
        email: 'user@example.com',
        currency: 'USD',
        timezone: 'UTC',
        notifications: {
          billReminders: true,
          budgetAlerts: true,
          goalMilestones: true,
          weeklyReports: false
        },
        preferences: {
          darkMode: document.documentElement.classList.contains('dark'),
          weekStart: 'sunday',
          dateFormat: 'MM/DD/YYYY'
        }
      })
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Simulate save
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const toggleDarkMode = () => {
    const newDarkMode = !settings.preferences.darkMode
    setSettings(prev => ({
      ...prev,
      preferences: { ...prev.preferences, darkMode: newDarkMode }
    }))
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleExportData = () => {
    toast.info('Data export feature coming soon')
  }

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      toast.info('Data clearing feature coming soon')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-orange-600" />
            Profile Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={settings.displayName}
                onChange={(e) => setSettings(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
                disabled
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-600" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="billReminders">Bill Reminders</Label>
                <p className="text-sm text-muted-foreground">Get notified 3 days before bills are due</p>
              </div>
              <Switch
                id="billReminders"
                checked={settings.notifications.billReminders}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, billReminders: checked }
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="budgetAlerts">Budget Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified when categories are overspent</p>
              </div>
              <Switch
                id="budgetAlerts"
                checked={settings.notifications.budgetAlerts}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, budgetAlerts: checked }
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="goalMilestones">Goal Milestones</Label>
                <p className="text-sm text-muted-foreground">Celebrate when you reach savings goals</p>
              </div>
              <Switch
                id="goalMilestones"
                checked={settings.notifications.goalMilestones}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, goalMilestones: checked }
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-orange-600" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="darkMode">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
            </div>
            <Switch
              id="darkMode"
              checked={settings.preferences.darkMode}
              onCheckedChange={toggleDarkMode}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-orange-600" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Export Data</Label>
              <p className="text-sm text-muted-foreground">Download your financial data</p>
            </div>
            <Button variant="outline" onClick={handleExportData}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Clear All Data</Label>
              <p className="text-sm text-muted-foreground">Permanently delete all your data</p>
            </div>
            <Button variant="destructive" onClick={handleClearData}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
