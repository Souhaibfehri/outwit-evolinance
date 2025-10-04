import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const metadata = user.user_metadata || {}
    const metadataSize = JSON.stringify(metadata).length

    // If metadata is small, no need to clear
    if (metadataSize < 8000) {
      return NextResponse.json({
        success: true,
        message: 'Metadata size is already within limits',
        sizeBefore: metadataSize,
        sizeAfter: metadataSize
      })
    }

    // Clear large data arrays while keeping essential settings
    const essentialData = {
      // Keep profile essentials
      name: metadata.name,
      full_name: metadata.full_name,
      currency: metadata.currency || 'USD',
      timezone: metadata.timezone || 'UTC',
      onboarding_done: true,
      onboarding_session: { completed: true },
      
      // Keep small sample data for functionality
      goals: (metadata.goals || []).slice(0, 2),
      debts: (metadata.debts || []).slice(0, 2),
      bills: (metadata.bills || []).slice(0, 3),
      transactions: (metadata.transactions || []).slice(-5), // Keep last 5
      recurring_income: (metadata.recurring_income || []).slice(0, 2),
      investments: (metadata.investments || []).slice(0, 2),
      
      // Keep settings
      notifications: metadata.notifications || {
        email: true,
        bills: true,
        goals: true,
        budgetAlerts: true
      },
      
      // Mark as cleaned
      metadata_cleaned: true,
      metadata_cleaned_at: new Date().toISOString(),
      original_size: metadataSize
    }

    // Update user metadata with cleaned data
    const { error: updateError } = await supabase.auth.updateUser({
      data: essentialData
    })

    if (updateError) {
      console.error('Failed to clear metadata:', updateError)
      return NextResponse.json({ 
        error: 'Failed to clear metadata',
        details: updateError.message
      }, { status: 500 })
    }

    const newSize = JSON.stringify(essentialData).length

    return NextResponse.json({
      success: true,
      message: `Metadata cleared successfully! Size reduced from ${Math.round(metadataSize/1024)}KB to ${Math.round(newSize/1024)}KB.`,
      sizeBefore: metadataSize,
      sizeAfter: newSize,
      reductionPercent: Math.round(((metadataSize - newSize) / metadataSize) * 100),
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error clearing metadata:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to clear metadata due to server error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const metadata = user.user_metadata || {}
    const metadataSize = JSON.stringify(metadata).length

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      metadataSize,
      needsCleaning: metadataSize > 8000,
      isAlreadyCleaned: metadata.metadata_cleaned || false,
      lastCleanedAt: metadata.metadata_cleaned_at,
      dataBreakdown: {
        transactions: metadata.transactions?.length || 0,
        transactions_v2: metadata.transactions_v2?.length || 0,
        goals: metadata.goals?.length || 0,
        goals_v2: metadata.goals_v2?.length || 0,
        debts: metadata.debts?.length || 0,
        debt_accounts: metadata.debt_accounts?.length || 0,
        bills: metadata.bills?.length || 0,
        income_sources: metadata.income_sources?.length || 0,
        income_occurrences: metadata.income_occurrences?.length || 0,
        investment_accounts: metadata.investment_accounts?.length || 0,
        coach_messages: metadata.coach_messages?.length || 0
      }
    })

  } catch (error) {
    console.error('Error checking metadata status:', error)
    return NextResponse.json({
      error: 'Failed to check metadata status'
    }, { status: 500 })
  }
}
