import { NextRequest, NextResponse } from 'next/server'
import { getUserAndEnsure } from '@/lib/ensureUser'
import { toCSV, CSV_COLUMNS } from '@/lib/csv'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')
    const categoryId = searchParams.get('category')
    const accountId = searchParams.get('account')

    const metadata = user.user_metadata || {}
    let transactions = metadata.transactions || []
    const categories = metadata.categories || []
    const accounts = metadata.accounts || []

    // Filter transactions based on query parameters
    transactions = transactions.filter((txn: any) => {
      let include = true

      // Date range filter
      if (startDate && new Date(txn.date) < new Date(startDate)) include = false
      if (endDate && new Date(txn.date) > new Date(endDate)) include = false
      
      // Category filter
      if (categoryId && txn.categoryId !== categoryId) include = false
      
      // Account filter  
      if (accountId && txn.accountId !== accountId) include = false

      return include
    })

    // Enrich transactions with category and account names
    const enrichedTransactions = transactions.map((txn: any) => {
      const category = categories.find((cat: any) => cat.id === txn.categoryId)
      const account = accounts.find((acc: any) => acc.id === txn.accountId)
      
      return {
        ...txn,
        categoryName: category?.name || 'Uncategorized',
        accountName: account?.name || 'Unknown Account',
        // Convert cents to dollars for display
        amount: txn.amountCents / 100
      }
    })

    // Sort by date (newest first)
    enrichedTransactions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

    if (format === 'csv') {
      const csvContent = toCSV(enrichedTransactions, CSV_COLUMNS.transactions)
      
      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: enrichedTransactions,
        count: enrichedTransactions.length,
        filters: {
          startDate,
          endDate,
          categoryId,
          accountId
        }
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Unsupported format'
    }, { status: 400 })

  } catch (error) {
    console.error('Error exporting transactions:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to export transactions'
    }, { status: 500 })
  }
}
