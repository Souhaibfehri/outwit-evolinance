import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { 
  selectRunway,
  selectLiquidCashNow,
  selectMonthlyIncomeForecast,
  selectMonthlyOutflowForecast
} from '@/lib/budget-v2-selectors'
import { getCurrentMonth } from '@/lib/types/budget-v2'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode') as 'planned_only' | 'planned_plus_average' || 'planned_plus_average'
    const warningThreshold = parseInt(searchParams.get('warning_threshold') || '6')

    const metadata = user.user_metadata || {}
    const transactions = metadata.transactions_v2 || []
    const accounts = metadata.accounts || []
    const scheduledItems = metadata.scheduled_items || []
    const categories = metadata.categories_v2 || []
    const currentMonth = getCurrentMonth()

    // Calculate savings runway
    const runway = selectRunway(
      accounts,
      transactions,
      scheduledItems,
      categories,
      currentMonth,
      mode,
      warningThreshold
    )

    // Calculate monthly projections for next 6 months
    const monthlyProjections: any[] = []
    for (let i = 0; i < 6; i++) {
      const projectionDate = new Date()
      projectionDate.setMonth(projectionDate.getMonth() + i)
      const projectionMonth = `${projectionDate.getFullYear()}-${String(projectionDate.getMonth() + 1).padStart(2, '0')}`

      const income = selectMonthlyIncomeForecast(scheduledItems, transactions, projectionMonth, mode)
      const outflow = selectMonthlyOutflowForecast(scheduledItems, transactions, categories, projectionMonth, mode)

      monthlyProjections.push({
        month: projectionMonth,
        month_name: projectionDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        projected_income: income,
        projected_outflow: outflow,
        projected_net: income - outflow,
        confidence: getConfidenceLevel(transactions, projectionDate),
        cumulative_cash: runway.liquid_cash_now + ((income - outflow) * (i + 1))
      })
    }

    // Calculate account breakdown
    const liquidAccounts = accounts.filter(acc => 
      acc.on_budget && (acc.type === 'checking' || acc.type === 'savings')
    )

    const accountBreakdown = liquidAccounts.map(account => {
      const currentBalance = transactions
        .filter(txn => txn.account_id === account.id)
        .reduce((balance, txn) => balance + txn.amount, account.balance || 0)

      return {
        account_id: account.id,
        account_name: account.name,
        account_type: account.type,
        current_balance: Math.max(0, currentBalance),
        percentage_of_liquid: runway.liquid_cash_now > 0 
          ? (currentBalance / runway.liquid_cash_now) * 100 
          : 0
      }
    })

    return NextResponse.json({
      runway,
      monthly_projections: monthlyProjections,
      account_breakdown: accountBreakdown,
      warnings: generateRunwayWarnings(runway),
      recommendations: generateRunwayRecommendations(runway, monthlyProjections)
    })

  } catch (error) {
    console.error('Error calculating savings runway:', error)
    return NextResponse.json({ error: 'Failed to calculate runway' }, { status: 500 })
  }
}

function getConfidenceLevel(transactions: Transaction[], projectionDate: Date): 'high' | 'medium' | 'low' {
  const threeMonthsAgo = new Date(projectionDate)
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const dataPoints = transactions.filter(txn => 
    new Date(txn.date) >= threeMonthsAgo && new Date(txn.date) <= projectionDate
  ).length

  if (dataPoints >= 90) return 'high'
  if (dataPoints >= 45) return 'medium'
  return 'low'
}

function generateRunwayWarnings(runway: SavingsRunway): string[] {
  const warnings: string[] = []

  if (runway.is_critical) {
    warnings.push(`⚠️ Critical: Projected to deplete savings in ${runway.runway_months.toFixed(1)} months`)
  }

  if (runway.monthly_net_forecast < 0) {
    warnings.push(`📉 Negative cash flow: Spending $${Math.abs(runway.monthly_net_forecast).toFixed(2)} more than earning monthly`)
  }

  if (runway.liquid_cash_now < runway.monthly_outflow_forecast) {
    warnings.push(`🔴 Low cash: Less than one month of expenses in liquid accounts`)
  }

  return warnings
}

function generateRunwayRecommendations(runway: SavingsRunway, projections: any[]): string[] {
  const recommendations: string[] = []

  if (runway.is_critical) {
    recommendations.push('💡 Consider reducing variable spending or increasing income')
    recommendations.push('💡 Review and pause non-essential subscriptions')
    recommendations.push('💡 Temporarily reduce goal contributions to preserve cash')
  }

  if (runway.variable_spend_forecast > runway.monthly_income_forecast * 0.3) {
    recommendations.push('💡 Variable spending is high - consider creating more specific budget categories')
  }

  const avgMonthlyNet = projections.reduce((sum, proj) => sum + proj.projected_net, 0) / projections.length
  if (avgMonthlyNet > runway.monthly_income_forecast * 0.1) {
    recommendations.push('💡 Strong cash flow - consider increasing investment contributions')
  }

  return recommendations
}
