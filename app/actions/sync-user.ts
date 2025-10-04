'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function syncUserWithDatabase() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      redirect('/login')
    }

    // Check if user exists in our database
    let dbUser = await prisma.user.findUnique({
      where: { email: user.email! }
    })

    // If user doesn't exist, create them
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          email: user.email!,
          name: user.user_metadata?.name || user.email!.split('@')[0],
        }
      })

      // Create default categories for new user
      const defaultCategories = [
        { name: 'Bills & Utilities', type: 'expense' },
        { name: 'Groceries', type: 'expense' },
        { name: 'Transport', type: 'expense' },
        { name: 'Food & Dining', type: 'expense' },
        { name: 'Shopping', type: 'expense' },
        { name: 'Entertainment', type: 'expense' },
        { name: 'Healthcare', type: 'expense' },
        { name: 'Subscriptions', type: 'expense' },
        { name: 'Salary', type: 'income' },
        { name: 'Freelance', type: 'income' },
        { name: 'Investments', type: 'income' },
      ]

      await Promise.all(
        defaultCategories.map(category =>
          prisma.category.create({
            data: {
              ...category,
              userId: dbUser!.id,
            }
          })
        )
      )

      // Create default accounts
      await prisma.account.create({
        data: {
          name: 'Main Checking',
          type: 'checking',
          balance: 0,
          userId: dbUser.id,
        }
      })
    }

    return { success: true, user: dbUser }
  } catch (error) {
    console.error('Error syncing user:', error)
    return { success: false, error: 'Failed to sync user' }
  }
}
