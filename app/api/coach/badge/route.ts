import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { BADGES } from '@/lib/foxy/badges'

const BadgeSchema = z.object({
  badgeId: z.string(),
  eventData: z.record(z.any()).optional()
})

// POST /api/coach/badge - Unlock a badge
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { badgeId, eventData } = BadgeSchema.parse(body)

    // Validate badge exists
    const badge = BADGES.find(b => b.id === badgeId)
    if (!badge) {
      return NextResponse.json({ error: 'Invalid badge ID' }, { status: 400 })
    }

    // Get current coach state
    const coachState = user.user_metadata?.coach_state || {
      unlockedBadges: []
    }

    // Check if badge already unlocked
    if (coachState.unlockedBadges.includes(badgeId)) {
      return NextResponse.json({ 
        success: true, 
        message: 'Badge already unlocked',
        alreadyUnlocked: true 
      })
    }

    // Add badge to unlocked list
    const newBadges = [...coachState.unlockedBadges, badgeId]
    
    // Update coach state
    const updatedCoachState = {
      ...coachState,
      unlockedBadges: newBadges,
      lastActiveAt: new Date().toISOString()
    }

    // Save to user metadata
    await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        coach_state: updatedCoachState
      }
    })

    // Log badge unlock
    console.log(`Badge unlocked: ${badgeId}`, {
      userId: user.id,
      badgeTitle: badge.title,
      rarity: badge.rarity
    })

    return NextResponse.json({
      success: true,
      badgeUnlocked: badge,
      totalBadges: newBadges.length,
      coachState: updatedCoachState
    })
  } catch (error) {
    console.error('Error unlocking badge:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid badge data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to unlock badge' },
      { status: 500 }
    )
  }
}
