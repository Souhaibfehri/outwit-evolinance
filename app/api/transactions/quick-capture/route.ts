import { NextRequest, NextResponse } from 'next/server'
import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'
import { z } from 'zod'

const QuickCaptureSchema = z.object({
  totalAmount: z.number().positive('Total amount must be positive'),
  periodFrom: z.string(),
  periodTo: z.string(),
  method: z.enum(['smart', 'manual']),
  distribution: z.array(z.object({
    categoryId: z.string(),
    percentage: z.number().min(0).max(100),
    amount: z.number()
  })),
  accountId: z.string().optional(),
  note: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = QuickCaptureSchema.parse(body)

    const metadata = user.user_metadata || {}
    const transactions = metadata.transactions || []
    const accounts = metadata.accounts || []
    const categories = metadata.categories || []

    // Validate distribution adds up to 100% (allow 95-105% with normalization)
    const totalPercentage = validatedData.distribution.reduce((sum, item) => sum + item.percentage, 0)
    if (totalPercentage < 95 || totalPercentage > 105) {
      return NextResponse.json({
        success: false,
        error: 'Distribution must add up to approximately 100%',
        details: { currentTotal: totalPercentage }
      }, { status: 400 })
    }

    // Get default account if not specified
    const accountId = validatedData.accountId || accounts.find((acc: any) => acc.type === 'checking')?.id || accounts[0]?.id
    if (!accountId) {
      return NextResponse.json({
        success: false,
        error: 'No account available for transactions'
      }, { status: 400 })
    }

    // Calculate date distribution
    const fromDate = new Date(validatedData.periodFrom)
    const toDate = new Date(validatedData.periodTo)
    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))
    const transactionDates = distributeTransactionDates(fromDate, toDate, validatedData.distribution.length)

    // Create transactions
    const newTransactions = validatedData.distribution.map((dist, index) => {
      const category = categories.find((cat: any) => cat.id === dist.categoryId)
      const transactionDate = transactionDates[index] || toDate

      return {
        id: `txn_quickcapture_${Date.now()}_${index}`,
        userId: user.id,
        accountId,
        date: transactionDate.toISOString(),
        merchant: `Quick capture - ${category?.name || 'Unknown'}`,
        categoryId: dist.categoryId,
        type: 'EXPENSE',
        amountCents: Math.round(-dist.amount * 100), // Negative for expense
        note: validatedData.note || `Quick capture for ${daysDiff} days`,
        source: 'quick_capture',
        isApproximate: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    })

    // Create quick capture record
    const quickCaptureRecord = {
      id: `quickcapture_${Date.now()}`,
      userId: user.id,
      total: validatedData.totalAmount,
      method: validatedData.method,
      periodFrom: fromDate.toISOString(),
      periodTo: toDate.toISOString(),
      breakdown: validatedData.distribution,
      note: validatedData.note,
      createdAt: new Date().toISOString()
    }

    // Update account balance
    const updatedAccounts = accounts.map((account: any) => {
      if (account.id === accountId) {
        return {
          ...account,
          balanceCents: (account.balanceCents || 0) - Math.round(validatedData.totalAmount * 100),
          updatedAt: new Date().toISOString()
        }
      }
      return account
    })

    const result = await updateUserMetadata({
      ...metadata,
      transactions: [...transactions, ...newTransactions],
      quick_captures: [...(metadata.quick_captures || []), quickCaptureRecord],
      accounts: updatedAccounts.length > 0 ? updatedAccounts : accounts
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Quick capture completed successfully',
      transactionsCreated: newTransactions.length,
      totalAmount: validatedData.totalAmount,
      period: {
        from: validatedData.periodFrom,
        to: validatedData.periodTo,
        days: daysDiff
      }
    })

  } catch (error) {
    console.error('Error processing quick capture:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid quick capture data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to process quick capture'
    }, { status: 500 })
  }
}

/**
 * Distribute transactions across the date range
 */
function distributeTransactionDates(fromDate: Date, toDate: Date, count: number): Date[] {
  const dates: Date[] = []
  const totalDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))
  
  if (count <= 1) {
    return [toDate]
  }

  // Distribute evenly across the period
  for (let i = 0; i < count; i++) {
    const dayOffset = Math.floor((totalDays * i) / (count - 1))
    const date = new Date(fromDate)
    date.setDate(date.getDate() + dayOffset)
    dates.push(date)
  }

  return dates
}

/**
 * Get suggested category distribution based on user's spending history
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const periodDays = parseInt(searchParams.get('days') || '7')

    const metadata = user.user_metadata || {}
    const transactions = metadata.transactions || []
    const categories = metadata.categories || []

    // Analyze spending from the last 30 days
    const analysisDate = new Date()
    analysisDate.setDate(analysisDate.getDate() - 30)

    const recentTransactions = transactions.filter((txn: any) => {
      return txn.type === 'EXPENSE' && 
             new Date(txn.date) >= analysisDate &&
             !txn.isApproximate
    })

    if (recentTransactions.length === 0) {
      // Return default distribution for new users
      return NextResponse.json({
        success: true,
        suggestions: getDefaultDistribution(categories),
        method: 'default',
        basedOn: 'system_defaults'
      })
    }

    // Calculate category spending percentages
    const categoryTotals: Record<string, number> = {}
    let totalSpent = 0

    recentTransactions.forEach((txn: any) => {
      const amount = Math.abs(txn.amountCents / 100)
      categoryTotals[txn.categoryId] = (categoryTotals[txn.categoryId] || 0) + amount
      totalSpent += amount
    })

    // Convert to percentages and create suggestions
    const suggestions = Object.entries(categoryTotals)
      .map(([categoryId, amount]) => {
        const category = categories.find((cat: any) => cat.id === categoryId)
        return {
          categoryId,
          categoryName: category?.name || 'Unknown',
          percentage: Math.round((amount / totalSpent) * 100),
          suggestedAmount: 0 // Will be calculated on frontend
        }
      })
      .filter(item => item.percentage >= 5) // Only include categories with >5% spending
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 6) // Top 6 categories

    // Normalize percentages to add up to 100%
    const totalPercentage = suggestions.reduce((sum, item) => sum + item.percentage, 0)
    if (totalPercentage > 0) {
      suggestions.forEach(item => {
        item.percentage = Math.round((item.percentage / totalPercentage) * 100)
      })
    }

    return NextResponse.json({
      success: true,
      suggestions,
      method: 'historical',
      basedOn: `${recentTransactions.length} transactions from last 30 days`,
      totalAnalyzed: totalSpent
    })

  } catch (error) {
    console.error('Error getting quick capture suggestions:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get suggestions'
    }, { status: 500 })
  }
}

/**
 * Default distribution for new users
 */
function getDefaultDistribution(categories: any[]) {
  const defaultCategories = [
    { name: 'Groceries', percentage: 30 },
    { name: 'Entertainment', percentage: 20 },
    { name: 'Dining Out', percentage: 15 },
    { name: 'Transportation', percentage: 15 },
    { name: 'Shopping', percentage: 10 },
    { name: 'Utilities', percentage: 10 }
  ]

  return defaultCategories.map(def => {
    const category = categories.find((cat: any) => 
      cat.name.toLowerCase().includes(def.name.toLowerCase())
    )
    
    return {
      categoryId: category?.id || '',
      categoryName: category?.name || def.name,
      percentage: def.percentage,
      suggestedAmount: 0
    }
  }).filter(item => item.categoryId) // Only include categories that exist
}
