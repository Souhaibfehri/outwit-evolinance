import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { 
  linkBillToCategory, 
  createCategoryForBill, 
  calculateMonthlyAmount 
} from '@/lib/bill-category-link'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { billId, categoryId, autoCreateCategory } = await request.json()

    const metadata = user.user_metadata || {}
    const bills = metadata.bills || []
    const categories = metadata.categories || []
    const billCategoryLinks = metadata.bill_category_links || []

    // Find the bill
    const bill = bills.find((b: any) => b.id === billId)
    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }

    let targetCategoryId = categoryId
    let updatedCategories = [...categories]

    // Auto-create category if requested
    if (autoCreateCategory && !categoryId) {
      const newCategory = createCategoryForBill(bill, categories, user.id)
      updatedCategories.push(newCategory)
      targetCategoryId = newCategory.id
    }

    // Create the link
    const link = linkBillToCategory(billId, targetCategoryId, bills, updatedCategories)
    const updatedLinks = [...billCategoryLinks, link]

    // Update suggested amount for the category
    const monthlyAmount = calculateMonthlyAmount(bill.amount, bill.frequency)
    const categoryIndex = updatedCategories.findIndex(cat => cat.id === targetCategoryId)
    if (categoryIndex >= 0) {
      updatedCategories[categoryIndex] = {
        ...updatedCategories[categoryIndex],
        monthlyBudgetCents: Math.round(monthlyAmount * 100),
        linkedBillId: billId,
        updatedAt: new Date().toISOString()
      }
    }

    // Save to user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...metadata,
        categories: updatedCategories,
        bill_category_links: updatedLinks
      }
    })

    if (updateError) {
      console.error('Failed to link bill to category:', updateError)
      return NextResponse.json({ error: 'Failed to create link' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      link,
      category: updatedCategories.find(cat => cat.id === targetCategoryId),
      suggestedAmount: monthlyAmount
    })

  } catch (error) {
    console.error('Error linking bill to category:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const billId = searchParams.get('billId')
    const categoryId = searchParams.get('categoryId')

    if (!billId || !categoryId) {
      return NextResponse.json({ error: 'Missing billId or categoryId' }, { status: 400 })
    }

    const metadata = user.user_metadata || {}
    const billCategoryLinks = metadata.bill_category_links || []

    // Remove the link
    const updatedLinks = billCategoryLinks.filter((link: any) => 
      !(link.billId === billId && link.categoryId === categoryId)
    )

    // Save to user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...metadata,
        bill_category_links: updatedLinks
      }
    })

    if (updateError) {
      console.error('Failed to unlink bill from category:', updateError)
      return NextResponse.json({ error: 'Failed to remove link' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Bill unlinked from category'
    })

  } catch (error) {
    console.error('Error unlinking bill from category:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
