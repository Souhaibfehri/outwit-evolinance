import { NextRequest, NextResponse } from 'next/server'
import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'
import { z } from 'zod'

const CoachEventSchema = z.object({
  event: z.string(),
  data: z.any().optional(),
  page: z.string().optional(),
  timestamp: z.string().optional()
})

interface CoachEvent {
  id: string
  userId: string
  event: string
  data?: any
  page?: string
  timestamp: string
  sessionId?: string
}

// Log coach interaction event
export async function POST(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = CoachEventSchema.parse(body)

    const metadata = user.user_metadata || {}
    const coachEvents = metadata.coach_events || []

    const newEvent: CoachEvent = {
      id: `coach_event_${Date.now()}`,
      userId: user.id,
      event: validatedData.event,
      data: validatedData.data,
      page: validatedData.page,
      timestamp: validatedData.timestamp || new Date().toISOString(),
      sessionId: generateSessionId()
    }

    coachEvents.push(newEvent)

    // Keep only last 100 events to prevent metadata bloat
    const trimmedEvents = coachEvents.slice(-100)

    const result = await updateUserMetadata({
      ...metadata,
      coach_events: trimmedEvents
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      event: newEvent
    })

  } catch (error) {
    console.error('Error logging coach event:', error)
    return NextResponse.json(
      { error: 'Failed to log event' },
      { status: 500 }
    )
  }
}

// Get coach events for analysis
export async function GET(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const eventType = searchParams.get('type')

    const metadata = user.user_metadata || {}
    let coachEvents = metadata.coach_events || []

    // Filter by event type if specified
    if (eventType) {
      coachEvents = coachEvents.filter((event: any) => event.event === eventType)
    }

    // Sort by timestamp (most recent first) and limit
    const sortedEvents = coachEvents
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    // Generate usage analytics
    const analytics = generateEventAnalytics(coachEvents)

    return NextResponse.json({
      success: true,
      events: sortedEvents,
      analytics,
      totalEvents: coachEvents.length
    })

  } catch (error) {
    console.error('Error fetching coach events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

function generateEventAnalytics(events: CoachEvent[]) {
  const eventCounts: Record<string, number> = {}
  const actionCounts: Record<string, number> = {}
  const pageCounts: Record<string, number> = {}

  events.forEach(event => {
    // Count event types
    eventCounts[event.event] = (eventCounts[event.event] || 0) + 1

    // Count action types
    if (event.data?.actionType) {
      actionCounts[event.data.actionType] = (actionCounts[event.data.actionType] || 0) + 1
    }

    // Count page interactions
    if (event.page) {
      pageCounts[event.page] = (pageCounts[event.page] || 0) + 1
    }
  })

  // Calculate engagement metrics
  const totalEvents = events.length
  const uniqueDays = new Set(events.map(e => e.timestamp.split('T')[0])).size
  const avgEventsPerDay = uniqueDays > 0 ? totalEvents / uniqueDays : 0

  // Most popular actions
  const topActions = Object.entries(actionCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([action, count]) => ({ action, count }))

  // Most visited pages
  const topPages = Object.entries(pageCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([page, count]) => ({ page, count }))

  return {
    totalEvents,
    uniqueDays,
    avgEventsPerDay: Math.round(avgEventsPerDay * 100) / 100,
    eventCounts,
    topActions,
    topPages,
    lastEventAt: events.length > 0 ? events[0].timestamp : null
  }
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
