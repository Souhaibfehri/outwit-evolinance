'use server'

import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'
import { z } from 'zod'

// Goal Schema
const GoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required'),
  target: z.number().min(0.01, 'Target amount must be greater than 0'),
  saved: z.number().min(0, 'Saved amount must be positive').default(0),
  deadline: z.string().optional(),
  priority: z.number().min(1).max(5).default(3),
  note: z.string().optional(),
})

export async function addGoal(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const data = {
      name: formData.get('name') as string,
      target: parseFloat(formData.get('target') as string),
      saved: parseFloat(formData.get('saved') as string || '0'),
      deadline: formData.get('deadline') as string || undefined,
      priority: parseInt(formData.get('priority') as string || '3'),
      note: formData.get('note') as string || undefined,
    }

    const validatedData = GoalSchema.parse(data)

    // Get existing goals
    const existingGoals = user.user_metadata?.onboarding_data?.goals || []
    
    // Add new goal with ID
    const newGoal = {
      id: Date.now().toString(),
      name: validatedData.name,
      target: Math.round(validatedData.target * 100), // Convert to cents
      saved: Math.round(validatedData.saved * 100), // Convert to cents
      deadline: validatedData.deadline || null,
      priority: validatedData.priority,
      note: validatedData.note || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const updatedGoals = [...existingGoals, newGoal]

    // Update onboarding data with new goals
    const onboardingData = user.user_metadata?.onboarding_data || {}
    const result = await updateUserMetadata({
      onboarding_data: {
        ...onboardingData,
        goals: updatedGoals,
      }
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, message: 'Goal added successfully!', goal: newGoal }
  } catch (error) {
    console.error('Error adding goal:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors?.map(e => e.message).join(', ') || 'Validation error' }
    }
    return { success: false, error: 'Failed to add goal' }
  }
}

export async function updateGoal(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const id = formData.get('id') as string
    const data = {
      name: formData.get('name') as string,
      target: parseFloat(formData.get('target') as string),
      saved: parseFloat(formData.get('saved') as string || '0'),
      deadline: formData.get('deadline') as string || undefined,
      priority: parseInt(formData.get('priority') as string || '3'),
      note: formData.get('note') as string || undefined,
    }

    const validatedData = GoalSchema.parse(data)

    // Get existing goals
    const existingGoals = user.user_metadata?.onboarding_data?.goals || []
    
    // Update the goal
    const updatedGoals = existingGoals.map((goal: any) => 
      goal.id === id 
        ? {
            ...goal,
            name: validatedData.name,
            target: Math.round(validatedData.target * 100),
            saved: Math.round(validatedData.saved * 100),
            deadline: validatedData.deadline || null,
            priority: validatedData.priority,
            note: validatedData.note || null,
            updatedAt: new Date().toISOString(),
          }
        : goal
    )

    // Update onboarding data
    const onboardingData = user.user_metadata?.onboarding_data || {}
    const result = await updateUserMetadata({
      onboarding_data: {
        ...onboardingData,
        goals: updatedGoals,
      }
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, message: 'Goal updated successfully!' }
  } catch (error) {
    console.error('Error updating goal:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors?.map(e => e.message).join(', ') || 'Validation error' }
    }
    return { success: false, error: 'Failed to update goal' }
  }
}

export async function deleteGoal(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const id = formData.get('id') as string

    // Get existing goals
    const existingGoals = user.user_metadata?.onboarding_data?.goals || []
    
    // Remove the goal
    const updatedGoals = existingGoals.filter((goal: any) => goal.id !== id)

    // Update onboarding data
    const onboardingData = user.user_metadata?.onboarding_data || {}
    const result = await updateUserMetadata({
      onboarding_data: {
        ...onboardingData,
        goals: updatedGoals,
      }
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, message: 'Goal deleted successfully!' }
  } catch (error) {
    console.error('Error deleting goal:', error)
    return { success: false, error: 'Failed to delete goal' }
  }
}

export async function addMoneyToGoal(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const id = formData.get('id') as string
    const amount = parseFloat(formData.get('amount') as string || '0')

    if (amount <= 0) {
      return { success: false, error: 'Amount must be greater than 0' }
    }

    // Get existing goals
    const existingGoals = user.user_metadata?.onboarding_data?.goals || []
    
    // Update the goal's saved amount - handle both string and numeric IDs
    const updatedGoals = existingGoals.map((goal: any, index: number) => {
      // Match by ID (for new goals) or by index (for onboarding goals)
      const goalId = goal.id || index.toString()
      if (goalId === id || index.toString() === id) {
        const currentSaved = goal.saved || 0
        return {
          ...goal,
          id: goalId, // Ensure ID exists
          saved: currentSaved + Math.round(amount * 100), // Add to existing saved amount
          updatedAt: new Date().toISOString(),
        }
      }
      return goal
    })

    // Update onboarding data
    const onboardingData = user.user_metadata?.onboarding_data || {}
    const result = await updateUserMetadata({
      onboarding_data: {
        ...onboardingData,
        goals: updatedGoals,
      }
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, message: `$${amount.toFixed(2)} added to goal successfully!` }
  } catch (error) {
    console.error('Error adding money to goal:', error)
    return { success: false, error: 'Failed to add money to goal' }
  }
}

export async function setAutoSave(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const id = formData.get('id') as string
    const autoSaveAmount = parseFloat(formData.get('autoSaveAmount') as string || '0')

    // Get existing goals
    const existingGoals = user.user_metadata?.onboarding_data?.goals || []
    
    // Update the goal's auto-save settings
    const updatedGoals = existingGoals.map((goal: any) => 
      goal.id === id 
        ? {
            ...goal,
            autoSave: autoSaveAmount > 0,
            autoSaveAmount: Math.round(autoSaveAmount * 100),
            updatedAt: new Date().toISOString(),
          }
        : goal
    )

    // Update onboarding data
    const onboardingData = user.user_metadata?.onboarding_data || {}
    const result = await updateUserMetadata({
      onboarding_data: {
        ...onboardingData,
        goals: updatedGoals,
      }
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    const message = autoSaveAmount > 0 
      ? `Auto-save set to $${autoSaveAmount.toFixed(2)} per month`
      : 'Auto-save disabled'

    return { success: true, message }
  } catch (error) {
    console.error('Error setting auto-save:', error)
    return { success: false, error: 'Failed to set auto-save' }
  }
}
