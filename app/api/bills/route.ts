import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { 
  Bill, 
  CreateBillRequest, 
  BillKPIs,
  BillListItem 
} from '@/lib/types/bills'
import { 
  getNextOccurrences, 
  getBillStatus, 
  getDaysUntilDue,
  formatFrequencyDisplay,
  validateBillSchedule,
  calculateMonthlyAmount
} from '@/lib/bill-scheduler'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeKPIs = searchParams.get('kpis') === 'true'

    const metadata = user.user_metadata || {}
    const bills = metadata.bills || []
    const categories = metadata.categories || []
    const currentDate = new Date()

    // Transform bills to list items
    const billListItems: BillListItem[] = bills
      .filter((bill: any) => !bill.archivedAt)
      .map((bill: any) => {
        const category = categories.find((cat: any) => cat.id === bill.categoryId)
        const nextOccurrences = getNextOccurrences(bill, currentDate, 1)
        const nextDueDate = nextOccurrences[0] || new Date()
        const status = getBillStatus(bill, currentDate)
        const daysUntilDue = getDaysUntilDue(bill, currentDate)

        return {
          id: bill.id,
          name: bill.name,
          amount: bill.amount,
          currency: bill.currency || 'USD',
          categoryName: category?.name || 'Uncategorized',
          nextDueDate: nextDueDate.toISOString(),
          status,
          daysUntilDue,
          frequency: bill.frequency,
          frequencyDisplay: formatFrequencyDisplay(bill),
          autopayEnabled: bill.autopayEnabled || false,
          linkedCategoryId: bill.categoryId,
          canPay: status !== 'paid',
          isRecurring: true
        }
      })
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue)

    let kpis: BillKPIs | undefined
    if (includeKPIs) {
      kpis = {
        upcomingCount: billListItems.filter(bill => bill.status === 'upcoming').length,
        overdueCount: billListItems.filter(bill => bill.status === 'overdue').length,
        thisMonthTotal: billListItems
          .filter(bill => {
            const dueDate = new Date(bill.nextDueDate)
            return dueDate.getMonth() === currentDate.getMonth() && 
                   dueDate.getFullYear() === currentDate.getFullYear()
          })
          .reduce((sum, bill) => sum + bill.amount, 0),
        autopayCount: billListItems.filter(bill => bill.autopayEnabled).length,
        dueSoonCount: billListItems.filter(bill => 
          bill.status === 'upcoming' && bill.daysUntilDue <= 7
        ).length,
        nextDueDate: billListItems.length > 0 ? billListItems[0].nextDueDate : undefined
      }
    }

    return NextResponse.json({
      bills: billListItems,
      kpis,
      total: billListItems.length
    })

  } catch (error) {
    console.error('Error fetching bills:', error)
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const billRequest: CreateBillRequest = await request.json()
    
    // Validate bill data
    const validation = validateBillSchedule(billRequest)
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'Invalid bill data', 
        details: validation.errors 
      }, { status: 400 })
    }

    const metadata = user.user_metadata || {}
    const existingBills = metadata.bills || []
    const categories = metadata.categories || []

    // Create new bill
    const billId = `bill_${Date.now()}`
    const newBill: Bill = {
      id: billId,
      userId: user.id,
      name: billRequest.name,
      amount: billRequest.amount,
      currency: billRequest.currency || 'USD',
      categoryId: billRequest.categoryId,
      accountId: billRequest.accountId,
      frequency: billRequest.frequency,
      everyN: billRequest.everyN,
      dayOfMonth: billRequest.dayOfMonth || 1,
      weekday: billRequest.weekday,
      dueTime: billRequest.dueTime || '09:00',
      timezone: billRequest.timezone || 'America/New_York',
      startsOn: billRequest.startsOn,
      endsOn: billRequest.endsOn,
      autopayEnabled: billRequest.autopayEnabled || false,
      autopayGraceDays: billRequest.autopayGraceDays || 0,
      businessDayRule: billRequest.businessDayRule || 'none',
      notes: billRequest.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Auto-create category if it doesn't exist
    let updatedCategories = [...categories]
    const categoryExists = categories.find((cat: any) => cat.id === billRequest.categoryId)
    if (!categoryExists) {
      const newCategory = {
        id: billRequest.categoryId,
        userId: user.id,
        name: billRequest.categoryId, // Would be better to pass category name
        groupId: 'default_essentials',
        priority: 3,
        rollover: false,
        sortOrder: categories.length,
        archived: false,
        type: 'expense',
        monthlyBudgetCents: Math.round(calculateMonthlyAmount(newBill) * 100),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        linkedBillId: billId
      }
      updatedCategories.push(newCategory)
    }

    // Save to user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...metadata,
        bills: [...existingBills, newBill],
        categories: updatedCategories
      }
    })

    if (updateError) {
      console.error('Failed to create bill:', updateError)
      return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 })
    }

    // Get preview of next occurrences
    const nextOccurrences = getNextOccurrences(newBill, new Date(), 3)

    return NextResponse.json({
      success: true,
      bill: newBill,
      nextOccurrences: nextOccurrences.map(date => date.toISOString()),
      message: 'Bill created successfully'
    })

  } catch (error) {
    console.error('Error creating bill:', error)
    return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 })
  }
}