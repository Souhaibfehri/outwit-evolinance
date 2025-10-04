import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { isValidFoxyEvent } from '@/lib/foxy/events'

const EventSchema = z.object({
  event: z.string().refine(isValidFoxyEvent, 'Invalid event type'),
  userId: z.string(),
  metadata: z.record(z.any()).optional(),
  timestamp: z.string().datetime().optional()
})

// POST /api/coach/event - Track user events for tutorial progress and badges
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { event, metadata } = EventSchema.parse(body)

    // Get current coach state
    const coachState = user.user_metadata?.coach_state || {}
    
    // Update streak if this is a daily activity
    const today = new Date().toDateString()
    const lastActiveDate = coachState.lastActiveAt ? new Date(coachState.lastActiveAt).toDateString() : null
    
    let streakDays = coachState.streakDays || 0
    if (lastActiveDate !== today) {
      // Check if yesterday (streak continues) or reset
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      if (lastActiveDate === yesterday.toDateString()) {
        streakDays += 1
      } else if (lastActiveDate !== today) {
        streakDays = 1 // Reset streak but count today
      }
    }

    // Update coach state with activity
    const updatedCoachState = {
      ...coachState,
      lastActiveAt: new Date().toISOString(),
      streakDays
    }

    // Save updated state
    await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        coach_state: updatedCoachState
      }
    })

    // Log event for analytics (in production, you might use a dedicated analytics service)
    console.log(`Foxy Event: ${event}`, { userId: user.id, metadata, streakDays })

    return NextResponse.json({ 
      success: true,
      streakDays,
      eventProcessed: event
    })
  } catch (error) {
    console.error('Error processing coach event:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid event data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process event' },
      { status: 500 }
    )
  }
}
