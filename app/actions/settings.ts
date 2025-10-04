'use server'

import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Profile Settings Schema
const ProfileSettingsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  timezone: z.string(),
  currency: z.string(),
  dateFormat: z.string(),
  weekStart: z.string(),
  budgetPeriod: z.string(),
})

// Notification Settings Schema
const NotificationSettingsSchema = z.object({
  budgetAlerts: z.boolean().default(true),
  billReminders: z.boolean().default(true),
  goalMilestones: z.boolean().default(true),
  largeTransactions: z.boolean().default(false),
  weeklyReports: z.boolean().default(false),
  budgetWarningPercent: z.number().min(1).max(100).default(80),
  largeTransactionAmount: z.number().min(0).default(500),
})

// App Preferences Schema
const PreferencesSchema = z.object({
  darkMode: z.boolean().default(true),
  compactView: z.boolean().default(false),
  autoCategorize: z.boolean().default(true),
  defaultDashboard: z.string(),
  transactionListSize: z.number().default(25),
})

// Password Change Schema
const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export async function updateProfileSettings(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const data = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      timezone: formData.get('timezone') as string,
      currency: formData.get('currency') as string,
      dateFormat: formData.get('dateFormat') as string,
      weekStart: formData.get('weekStart') as string,
      budgetPeriod: formData.get('budgetPeriod') as string,
    }

    const validatedData = ProfileSettingsSchema.parse(data)

    const result = await updateUserMetadata({
      name: validatedData.name,
      phone: validatedData.phone,
      timezone: validatedData.timezone,
      currency: validatedData.currency,
      date_format: validatedData.dateFormat,
      week_start: validatedData.weekStart,
      budget_period: validatedData.budgetPeriod,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, message: 'Profile settings updated successfully!' }
  } catch (error) {
    console.error('Error updating profile settings:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors?.map(e => e.message).join(', ') || 'Validation error' }
    }
    return { success: false, error: 'Failed to update profile settings' }
  }
}

export async function updateNotificationSettings(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const data = {
      budgetAlerts: formData.get('budgetAlerts') === 'on',
      billReminders: formData.get('billReminders') === 'on',
      goalMilestones: formData.get('goalMilestones') === 'on',
      largeTransactions: formData.get('largeTransactions') === 'on',
      weeklyReports: formData.get('weeklyReports') === 'on',
      budgetWarningPercent: parseInt(formData.get('budgetWarningPercent') as string || '80'),
      largeTransactionAmount: parseInt(formData.get('largeTransactionAmount') as string || '500'),
    }

    const validatedData = NotificationSettingsSchema.parse(data)

    const result = await updateUserMetadata({
      notification_settings: validatedData,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, message: 'Notification settings updated successfully!' }
  } catch (error) {
    console.error('Error updating notification settings:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors?.map(e => e.message).join(', ') || 'Validation error' }
    }
    return { success: false, error: 'Failed to update notification settings' }
  }
}

export async function updateAppPreferences(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const data = {
      darkMode: formData.get('darkMode') === 'on',
      compactView: formData.get('compactView') === 'on',
      autoCategorize: formData.get('autoCategorize') === 'on',
      defaultDashboard: formData.get('defaultDashboard') as string,
      transactionListSize: parseInt(formData.get('transactionListSize') as string || '25'),
    }

    const validatedData = PreferencesSchema.parse(data)

    const result = await updateUserMetadata({
      app_preferences: validatedData,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, message: 'App preferences updated successfully!' }
  } catch (error) {
    console.error('Error updating app preferences:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors?.map(e => e.message).join(', ') || 'Validation error' }
    }
    return { success: false, error: 'Failed to update app preferences' }
  }
}

export async function changePassword(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const data = {
      currentPassword: formData.get('currentPassword') as string,
      newPassword: formData.get('newPassword') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    }

    const validatedData = PasswordChangeSchema.parse(data)

    const supabase = await createClient()
    
    // Update password in Supabase Auth
    const { error } = await supabase.auth.updateUser({
      password: validatedData.newPassword
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, message: 'Password updated successfully!' }
  } catch (error) {
    console.error('Error changing password:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors?.map(e => e.message).join(', ') || 'Validation error' }
    }
    return { success: false, error: 'Failed to change password' }
  }
}

export async function exportUserData() {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Get all user data from metadata
    const userData = {
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: new Date().toISOString(),
      },
      onboarding_data: user.user_metadata?.onboarding_data || {},
      settings: {
        currency: user.user_metadata?.currency || 'USD',
        timezone: user.user_metadata?.timezone || 'America/New_York',
        notification_settings: user.user_metadata?.notification_settings || {},
        app_preferences: user.user_metadata?.app_preferences || {},
      }
    }

    // Convert to CSV format
    const csvData = JSON.stringify(userData, null, 2)
    
    return { 
      success: true, 
      data: csvData,
      filename: `outwit-budget-export-${new Date().toISOString().split('T')[0]}.json`
    }
  } catch (error) {
    console.error('Error exporting user data:', error)
    return { success: false, error: 'Failed to export data' }
  }
}

export async function deleteUserData() {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Clear all user metadata but keep the account
    const result = await updateUserMetadata({
      onboarding_done: false,
      onboarding_step: 0,
      onboarding_data: null,
      currency: 'USD',
      notification_settings: null,
      app_preferences: null,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, message: 'All data deleted successfully!' }
  } catch (error) {
    console.error('Error deleting user data:', error)
    return { success: false, error: 'Failed to delete data' }
  }
}

export async function deleteUserAccount() {
  try {
    const supabase = await createClient()
    
    // Delete the user account from Supabase Auth
    const { error } = await supabase.rpc('delete_user')
    
    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, message: 'Account deleted successfully!' }
  } catch (error) {
    console.error('Error deleting user account:', error)
    return { success: false, error: 'Failed to delete account' }
  }
}
