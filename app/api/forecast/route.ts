import { NextRequest, NextResponse } from 'next/server'
import { getUserAndEnsure } from '@/lib/ensureUser'
import { generateForecast, ForecastOptions } from '@/lib/forecast/engine'
import { z } from 'zod'

const ForecastQuerySchema = z.object({
  includeOverrides: z.boolean().optional().default(true),
  seasonalityFactor: z.boolean().optional().default(true),
  confidenceThreshold: z.enum(['conservative', 'moderate', 'optimistic']).optional().default('moderate')
})

export async function GET(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const options = ForecastQuerySchema.parse({
      includeOverrides: searchParams.get('includeOverrides') === 'true',
      seasonalityFactor: searchParams.get('seasonalityFactor') === 'true',
      confidenceThreshold: searchParams.get('confidenceThreshold') as any || 'moderate'
    })

    const userData = user.user_metadata || {}
    const forecast = generateForecast(userData, options)

    return NextResponse.json({
      success: true,
      forecast,
      options,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating forecast:', error)
    return NextResponse.json(
      { error: 'Failed to generate forecast' },
      { status: 500 }
    )
  }
}
