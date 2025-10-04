import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { DebtAccount } from '@/lib/types/debts'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const debtId = params.id
    const metadata = user.user_metadata || {}
    const debts = metadata.debt_accounts || []

    const debt = debts.find((d: DebtAccount) => d.id === debtId)
    if (!debt) {
      return NextResponse.json({ error: 'Debt not found' }, { status: 404 })
    }

    return NextResponse.json({ debt })

  } catch (error) {
    console.error('Error fetching debt:', error)
    return NextResponse.json({ error: 'Failed to fetch debt' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const debtId = params.id
    const updateData = await request.json()
    const metadata = user.user_metadata || {}
    const debts = metadata.debt_accounts || []

    const debtIndex = debts.findIndex((d: DebtAccount) => d.id === debtId)
    if (debtIndex === -1) {
      return NextResponse.json({ error: 'Debt not found' }, { status: 404 })
    }

    // Update debt with new data
    const updatedDebt: DebtAccount = {
      ...debts[debtIndex],
      ...updateData,
      id: debtId, // Prevent ID changes
      userId: user.id, // Prevent user ID changes
      updatedAt: new Date().toISOString()
    }

    // Validate required fields
    if (!updatedDebt.name || !updatedDebt.type || updatedDebt.principalBalance < 0 || updatedDebt.apr < 0 || updatedDebt.minPayment < 0) {
      return NextResponse.json({ 
        error: 'Invalid data: name, type, principalBalance, apr, and minPayment are required' 
      }, { status: 400 })
    }

    const updatedDebts = [...debts]
    updatedDebts[debtIndex] = updatedDebt

    // Save to user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...metadata,
        debt_accounts: updatedDebts
      }
    })

    if (updateError) {
      console.error('Failed to update debt:', updateError)
      return NextResponse.json({ error: 'Failed to update debt' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      debt: updatedDebt,
      message: 'Debt updated successfully'
    })

  } catch (error) {
    console.error('Error updating debt:', error)
    return NextResponse.json({ error: 'Failed to update debt' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const debtId = params.id
    const metadata = user.user_metadata || {}
    const debts = metadata.debt_accounts || []

    const debtIndex = debts.findIndex((d: DebtAccount) => d.id === debtId)
    if (debtIndex === -1) {
      return NextResponse.json({ error: 'Debt not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const archive = searchParams.get('archive') === 'true'

    let updatedDebts: DebtAccount[]
    let message: string

    if (archive) {
      // Archive instead of delete
      const archivedDebt = {
        ...debts[debtIndex],
        archivedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      updatedDebts = [...debts]
      updatedDebts[debtIndex] = archivedDebt
      message = 'Debt archived successfully'
    } else {
      // Permanently delete
      updatedDebts = debts.filter((d: DebtAccount) => d.id !== debtId)
      message = 'Debt deleted successfully'
    }

    // Save to user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...metadata,
        debt_accounts: updatedDebts
      }
    })

    if (updateError) {
      console.error('Failed to delete debt:', updateError)
      return NextResponse.json({ error: 'Failed to delete debt' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message
    })

  } catch (error) {
    console.error('Error deleting debt:', error)
    return NextResponse.json({ error: 'Failed to delete debt' }, { status: 500 })
  }
}
