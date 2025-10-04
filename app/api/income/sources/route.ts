import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { 
  IncomeSource, 
  IncomeSourceWithOccurrences, 
  IncomeKPIs, 
  CreateIncomeSourceRequest,
  calculateNetIncome,
  generateUpcomingOccurrences,
  calculateVariableIncomeAverage,
  getAnnualFrequency
} from '@/lib/types/income'
import { validatePaySchedule } from '@/lib/income-scheduler'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeKpis = searchParams.get('kpis') === 'true'
    const includeOccurrences = searchParams.get('occurrences') === 'true'

    const metadata = user.user_metadata || {}
    const sources: IncomeSource[] = metadata.income_sources || []
    const occurrences = metadata.income_occurrences || []
    const deductions = metadata.income_deductions || []

    // Build sources with occurrences if requested
    const sourcesWithDetails: IncomeSourceWithOccurrences[] = sources.map(source => {
      const sourceDeductions = deductions.filter((d: any) => d.sourceId === source.id)
      const sourceOccurrences = occurrences.filter((o: any) => o.sourceId === source.id)
      
      // Calculate net if using gross with deductions
      const calculatedNet = source.gross && sourceDeductions.length > 0 
        ? calculateNetIncome(source.gross, sourceDeductions)
        : source.net

      // Get upcoming and recent occurrences
      const upcomingOccurrences = includeOccurrences 
        ? sourceOccurrences.filter((o: any) => o.status === 'SCHEDULED').slice(0, 5)
        : []
      
      const recentOccurrences = includeOccurrences
        ? sourceOccurrences
            .filter((o: any) => o.status === 'RECEIVED')
            .sort((a: any, b: any) => new Date(b.postedAt || b.scheduledAt).getTime() - new Date(a.postedAt || a.scheduledAt).getTime())
            .slice(0, 10)
        : []

      // Calculate variable income metrics
      const variableMetrics = calculateVariableIncomeAverage(sourceOccurrences, 3)

      // Find next pay date and amount
      const nextOccurrence = upcomingOccurrences[0]
      const nextPayDate = nextOccurrence?.scheduledAt.split('T')[0]
      const nextPayAmount = nextOccurrence?.net || calculatedNet || 0

      return {
        ...source,
        deductions: sourceDeductions,
        upcomingOccurrences,
        recentOccurrences,
        calculatedNet,
        nextPayDate,
        nextPayAmount,
        averageMonthly: variableMetrics.average,
        isVariable: variableMetrics.isVariable
      }
    })

    const response: any = { sources: sourcesWithDetails }

    // Include KPIs if requested
    if (includeKpis) {
      const kpis = calculateIncomeKPIs(sourcesWithDetails, occurrences)
      response.kpis = kpis
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching income sources:', error)
    return NextResponse.json({ error: 'Failed to fetch income sources' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const sourceData: CreateIncomeSourceRequest = await request.json()
    const metadata = user.user_metadata || {}
    const existingSources = metadata.income_sources || []
    const existingDeductions = metadata.income_deductions || []
    const existingOccurrences = metadata.income_occurrences || []

    // Validate required fields
    if (!sourceData.name?.trim()) {
      return NextResponse.json({ error: 'Source name is required' }, { status: 400 })
    }

    if (!sourceData.gross && !sourceData.net) {
      return NextResponse.json({ error: 'Either gross or net amount is required' }, { status: 400 })
    }

    if (sourceData.gross && sourceData.gross <= 0) {
      return NextResponse.json({ error: 'Gross amount must be positive' }, { status: 400 })
    }

    if (sourceData.net && sourceData.net <= 0) {
      return NextResponse.json({ error: 'Net amount must be positive' }, { status: 400 })
    }

    // Validate pay schedule
    const scheduleValidation = validatePaySchedule(sourceData.paySchedule, {
      dayOfMonth: sourceData.dayOfMonth,
      secondDay: sourceData.secondDay,
      weekday: sourceData.weekday,
      everyNWeeks: sourceData.everyNWeeks
    })

    if (!scheduleValidation.isValid) {
      return NextResponse.json({ 
        error: 'Invalid pay schedule configuration',
        details: scheduleValidation.errors
      }, { status: 400 })
    }

    // Create new income source
    const newSource: IncomeSource = {
      id: `income_source_${Date.now()}`,
      userId: user.id,
      name: sourceData.name.trim(),
      type: sourceData.type,
      currency: sourceData.currency || 'USD',
      gross: sourceData.gross,
      net: sourceData.net,
      paySchedule: sourceData.paySchedule,
      anchorDate: sourceData.anchorDate,
      dayOfMonth: sourceData.dayOfMonth,
      secondDay: sourceData.secondDay,
      weekday: sourceData.weekday,
      everyNWeeks: sourceData.everyNWeeks,
      endOn: sourceData.endOn,
      timezone: sourceData.timezone || 'UTC',
      autopost: sourceData.autopost ?? true,
      allocationTemplateId: sourceData.allocationTemplateId,
      notes: sourceData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Create deductions if provided
    const newDeductions = (sourceData.deductions || []).map(deduction => ({
      id: `deduction_${Date.now()}_${deduction.label}`,
      sourceId: newSource.id,
      label: deduction.label,
      kind: deduction.kind,
      value: deduction.value
    }))

    // Generate upcoming occurrences if autopost is enabled
    const newOccurrences = newSource.autopost 
      ? generateUpcomingOccurrences(newSource, newDeductions, 90)
      : []

    // Atomic update: save source + deductions + occurrences
    const updatedSources = [...existingSources, newSource]
    const updatedDeductions = [...existingDeductions, ...newDeductions]
    const updatedOccurrences = [...existingOccurrences, ...newOccurrences]

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...metadata,
        income_sources: updatedSources,
        income_deductions: updatedDeductions,
        income_occurrences: updatedOccurrences
      }
    })

    if (updateError) {
      console.error('Failed to create income source:', updateError)
      return NextResponse.json({ error: 'Failed to create income source' }, { status: 500 })
    }

    const message = `Income source "${newSource.name}" created successfully!${newOccurrences.length > 0 ? ` ${newOccurrences.length} upcoming payments scheduled.` : ''}`

    return NextResponse.json({ 
      success: true, 
      source: newSource,
      deductions: newDeductions,
      occurrences: newOccurrences,
      message
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating income source:', error)
    return NextResponse.json({ error: 'Failed to create income source' }, { status: 500 })
  }
}

/**
 * Calculate comprehensive income KPIs
 */
function calculateIncomeKPIs(sources: IncomeSourceWithOccurrences[], allOccurrences: any[]): IncomeKPIs {
  const currentDate = new Date()
  const currentMonth = currentDate.toISOString().substring(0, 7) // YYYY-MM
  const currentYear = currentDate.getFullYear()

  // Find next pay
  const upcomingOccurrences = allOccurrences
    .filter((occ: any) => occ.status === 'SCHEDULED')
    .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

  const nextPay = upcomingOccurrences.length > 0 ? {
    date: upcomingOccurrences[0].scheduledAt.split('T')[0],
    amount: upcomingOccurrences[0].net,
    sourceName: sources.find(s => s.id === upcomingOccurrences[0].sourceId)?.name || 'Unknown'
  } : undefined

  // This month metrics
  const thisMonthOccurrences = allOccurrences.filter((occ: any) => 
    occ.scheduledAt.startsWith(currentMonth) || (occ.postedAt && occ.postedAt.startsWith(currentMonth))
  )

  const thisMonthReceived = thisMonthOccurrences
    .filter((occ: any) => occ.status === 'RECEIVED')
    .reduce((sum: number, occ: any) => sum + occ.net, 0)

  const thisMonthScheduled = thisMonthOccurrences
    .reduce((sum: number, occ: any) => sum + occ.net, 0)

  // YTD received
  const ytdReceived = allOccurrences
    .filter((occ: any) => 
      occ.status === 'RECEIVED' && 
      new Date(occ.postedAt || occ.scheduledAt).getFullYear() === currentYear
    )
    .reduce((sum: number, occ: any) => sum + occ.net, 0)

  // Calculate average monthly (last 6 months)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  
  const recentOccurrences = allOccurrences.filter((occ: any) => 
    occ.status === 'RECEIVED' && 
    new Date(occ.postedAt || occ.scheduledAt) >= sixMonthsAgo
  )

  const averageMonthly = recentOccurrences.length > 0
    ? recentOccurrences.reduce((sum: number, occ: any) => sum + occ.net, 0) / 6
    : 0

  const variance = thisMonthReceived - averageMonthly

  return {
    nextPay,
    thisMonthReceived,
    thisMonthScheduled,
    variance,
    averageMonthly,
    ytdReceived,
    upcomingCount: upcomingOccurrences.length
  }
}
