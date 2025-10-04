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
    const originalSize = JSON.stringify(metadata).length

    console.log(`🔍 Original metadata size: ${originalSize} bytes (${Math.round(originalSize/1024)}KB)`)

    // EMERGENCY FIX: Keep only absolute essentials under 8KB
    const emergencyData = {
      // Core profile - KEEP
      name: metadata.name,
      full_name: metadata.full_name,
      email: metadata.email,
      currency: metadata.currency || 'USD',
      timezone: metadata.timezone || 'UTC',
      
      // Onboarding status - KEEP
      onboarding_done: true,
      onboarding_session: { completed: true },
      
      // Notification preferences - KEEP
      notifications: {
        email: true,
        bills: true,
        goals: true,
        budgetAlerts: true
      },
      
      // Essential sample data - MINIMAL (2 items max per category)
      goals: (metadata.goals || []).slice(0, 2),
      debts: (metadata.debts || []).slice(0, 2),
      bills: (metadata.bills || []).slice(0, 2),
      recurring_income: (metadata.recurring_income || []).slice(0, 1),
      
      // Keep only last 3 transactions for basic functionality
      transactions: (metadata.transactions || []).slice(-3),
      
      // Emergency fix marker
      emergency_fix_applied: true,
      emergency_fix_date: new Date().toISOString(),
      original_size: originalSize
    }

    const newSize = JSON.stringify(emergencyData).length
    console.log(`🔧 New metadata size: ${newSize} bytes (${Math.round(newSize/1024)}KB)`)

    if (newSize > 8000) {
      // If still too large, be even more aggressive
      emergencyData.goals = []
      emergencyData.debts = []
      emergencyData.bills = []
      emergencyData.transactions = []
      emergencyData.recurring_income = []
    }

    const finalSize = JSON.stringify(emergencyData).length

    // Apply emergency fix
    const { error: updateError } = await supabase.auth.updateUser({
      data: emergencyData
    })

    if (updateError) {
      console.error('Emergency fix failed:', updateError)
      return NextResponse.json({ 
        error: 'Emergency fix failed',
        details: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Emergency fix applied! Metadata size reduced from ${Math.round(originalSize/1024)}KB to ${Math.round(finalSize/1024)}KB.`,
      sizeBefore: originalSize,
      sizeAfter: finalSize,
      reductionPercent: Math.round(((originalSize - finalSize) / originalSize) * 100),
      headerLimitCompliant: finalSize < 16000, // 16KB limit
      totalLimitCompliant: finalSize < 32000,  // 32KB limit
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Emergency fix error:', error)
    return NextResponse.json({
      success: false,
      error: 'Emergency fix failed due to server error'
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
      metadataSizeKB: Math.round(metadataSize / 1024),
      exceedsHeaderLimit: metadataSize > 16000,  // 16KB per header
      exceedsTotalLimit: metadataSize > 32000,   // 32KB total
      recommendEmergencyFix: metadataSize > 8000,
      isAlreadyFixed: metadata.emergency_fix_applied || false,
      lastFixDate: metadata.emergency_fix_date,
      headerLimitPercent: Math.round((metadataSize / 16000) * 100),
      totalLimitPercent: Math.round((metadataSize / 32000) * 100),
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
    console.error('Error checking emergency fix status:', error)
    return NextResponse.json({
      error: 'Failed to check status'
    }, { status: 500 })
  }
}
