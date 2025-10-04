import { NextRequest, NextResponse } from 'next/server'
import { migrateUserDataToDatabase, isUserDataMigrated } from '@/lib/database/user-service'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if already migrated
    const alreadyMigrated = await isUserDataMigrated(user.id)
    if (alreadyMigrated) {
      return NextResponse.json({ 
        success: true, 
        message: 'Data already migrated to database',
        alreadyMigrated: true
      })
    }

    // Perform migration
    const result = await migrateUserDataToDatabase(user.id)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        migrated: true,
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.message
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in migration endpoint:', error)
    return NextResponse.json({
      success: false,
      error: 'Migration failed due to server error'
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

    const isMigrated = await isUserDataMigrated(user.id)
    const metadata = user.user_metadata || {}
    const metadataSize = JSON.stringify(metadata).length

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      isMigrated,
      metadataSize,
      needsMigration: metadataSize > 8000, // 8KB threshold
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
    console.error('Error checking migration status:', error)
    return NextResponse.json({
      error: 'Failed to check migration status'
    }, { status: 500 })
  }
}
