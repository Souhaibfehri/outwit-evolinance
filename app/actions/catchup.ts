'use server'

import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'
import { generateEstimatedTransactions, normalizeCategorySplit } from '@/lib/catchup'
import { z } from 'zod'

const CatchUpSchema = z.object({
  daysAway: z.number().min(1).max(90),
  totalSpent: z.number().min(0),
  categories: z.array(z.object({
    name: z.string().min(1),
    percentage: z.number().min(0).max(100),
    amount: z.number().min(0),
    color: z.string()
  }))
})

export async function createCatchUpTransactions(formData: FormData) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const rawData = JSON.parse(formData.get('data') as string)
    const validatedData = CatchUpSchema.parse(rawData)

    // Normalize categories to ensure they add up to 100%
    const normalizedCategories = normalizeCategorySplit(validatedData.categories)

    // Get or create a default cash account
    const accounts = user.user_metadata?.accounts || []
    let defaultAccount = accounts.find((acc: any) => acc.type === 'cash')
    
    if (!defaultAccount) {
      // Create a default cash account
      defaultAccount = {
        id: Date.now().toString(),
        name: 'Cash/Default',
        type: 'cash',
        balanceCents: 0,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      const updatedAccounts = [...accounts, defaultAccount]
      await updateUserMetadata({ accounts: updatedAccounts })
    }

    // Generate estimated transactions
    const estimatedTransactions = generateEstimatedTransactions(
      {
        daysAway: validatedData.daysAway,
        totalSpent: validatedData.totalSpent,
        categories: normalizedCategories
      },
      user.id,
      defaultAccount.id
    )

    // Add transactions to user data
    const existingTransactions = user.user_metadata?.transactions || []
    const updatedTransactions = [...existingTransactions, ...estimatedTransactions]

    // Update account balance
    const totalSpentCents = Math.round(validatedData.totalSpent * 100)
    const updatedAccounts = accounts.map((account: any) => 
      account.id === defaultAccount.id
        ? {
            ...account,
            balanceCents: account.balanceCents - totalSpentCents,
            updatedAt: new Date().toISOString(),
          }
        : account
    )

    const result = await updateUserMetadata({
      transactions: updatedTransactions,
      accounts: updatedAccounts,
      last_catchup_date: new Date().toISOString(),
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { 
      success: true, 
      message: `Created ${estimatedTransactions.length} estimated transactions for $${validatedData.totalSpent.toFixed(2)}`,
      transactionsCreated: estimatedTransactions.length,
      totalAmount: validatedData.totalSpent
    }
  } catch (error) {
    console.error('Error creating catch-up transactions:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors?.map(e => e.message).join(', ') || 'Validation error' }
    }
    return { success: false, error: 'Failed to create catch-up transactions' }
  }
}

export async function checkIfUserNeedsCatchUp() {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return { needsCatchUp: false, daysInactive: 0 }
    }

    const transactions = user.user_metadata?.transactions || []
    const lastCatchUp = user.user_metadata?.last_catchup_date
    
    // Find the most recent transaction
    const recentTransactions = transactions.filter((t: any) => !t.isApproximate && !t.estimated)
    
    if (recentTransactions.length === 0) {
      return { needsCatchUp: true, daysInactive: 7 } // New user, suggest catch-up
    }

    // Find most recent real transaction
    const mostRecentTransaction = recentTransactions.sort((a: any, b: any) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0]

    const daysSinceLastTransaction = Math.floor(
      (new Date().getTime() - new Date(mostRecentTransaction.date).getTime()) / (1000 * 60 * 60 * 24)
    )

    // Also check if they've done a catch-up recently
    const daysSinceLastCatchUp = lastCatchUp 
      ? Math.floor((new Date().getTime() - new Date(lastCatchUp).getTime()) / (1000 * 60 * 60 * 24))
      : 999

    const needsCatchUp = daysSinceLastTransaction >= 7 && daysSinceLastCatchUp >= 7

    return { 
      needsCatchUp, 
      daysInactive: daysSinceLastTransaction,
      daysSinceLastCatchUp 
    }
  } catch (error) {
    console.error('Error checking catch-up status:', error)
    return { needsCatchUp: false, daysInactive: 0 }
  }
}
