import { NextRequest, NextResponse } from 'next/server'
import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'
import { 
  Scenario, 
  ScenarioComparison,
  compareScenarios,
  applyScenarioToForecast,
  applyScenarioToPlan,
  createGlobalShockTemplates
} from '@/lib/scenarios/engine'
import { generateForecast } from '@/lib/forecast/engine'
import { z } from 'zod'

const CreateScenarioSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['base', 'optimistic', 'stress', 'custom']).optional().default('custom'),
  description: z.string(),
  adjustments: z.array(z.object({
    categoryId: z.string().nullable(),
    adjustmentType: z.enum(['percentage', 'fixed_amount']),
    value: z.number(),
    startMonth: z.string().optional(),
    endMonth: z.string().optional(),
    note: z.string().optional()
  })),
  globalShocks: z.array(z.string()).optional().default([])
})

const ApplyScenarioSchema = z.object({
  scenarioId: z.string(),
  confirmApply: z.boolean().default(false)
})

// Get all user scenarios
export async function GET(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const compare = searchParams.get('compare') === 'true'

    const metadata = user.user_metadata || {}
    const scenarios: Scenario[] = metadata.scenarios || []

    if (!compare) {
      return NextResponse.json({
        success: true,
        scenarios
      })
    }

    // Generate comparison data
    if (scenarios.length === 0) {
      return NextResponse.json({
        success: true,
        comparison: {
          scenarios: [],
          comparisonData: {
            months: [],
            netCashFlow: {},
            rta: {},
            totalIncome: {},
            totalExpenses: {}
          },
          deltaTable: []
        }
      })
    }

    // Generate forecasts for each scenario
    const globalShocks = createGlobalShockTemplates()
    const baseForecast = generateForecast(metadata)
    
    const scenariosWithForecast = scenarios.map(scenario => ({
      ...scenario,
      forecast: applyScenarioToForecast(baseForecast, scenario, globalShocks)
    }))

    const comparison = compareScenarios(scenariosWithForecast)

    return NextResponse.json({
      success: true,
      comparison
    })

  } catch (error) {
    console.error('Error fetching scenarios:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scenarios' },
      { status: 500 }
    )
  }
}

// Create new scenario
export async function POST(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = CreateScenarioSchema.parse(body)

    const metadata = user.user_metadata || {}
    const scenarios = metadata.scenarios || []

    const newScenario: Scenario = {
      id: `scenario_${Date.now()}`,
      ...validatedData,
      baseMonth: getCurrentMonth(),
      createdAt: new Date().toISOString()
    }

    scenarios.push(newScenario)

    // Keep only last 10 scenarios to prevent metadata bloat
    const trimmedScenarios = scenarios.slice(-10)

    const result = await updateUserMetadata({
      ...metadata,
      scenarios: trimmedScenarios
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      scenario: newScenario
    })

  } catch (error) {
    console.error('Error creating scenario:', error)
    return NextResponse.json(
      { error: 'Failed to create scenario' },
      { status: 500 }
    )
  }
}

// Apply scenario to real plan
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = ApplyScenarioSchema.parse(body)

    if (!validatedData.confirmApply) {
      return NextResponse.json({ 
        error: 'Must confirm application of scenario to real plan' 
      }, { status: 400 })
    }

    const metadata = user.user_metadata || {}
    const scenarios = metadata.scenarios || []
    const budgetItems = metadata.budget_items || []
    const categories = metadata.categories || []

    const scenario = scenarios.find((s: any) => s.id === validatedData.scenarioId)
    if (!scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
    }

    // Apply scenario to plan
    const result = applyScenarioToPlan(scenario, budgetItems, categories)

    // Create backup before applying
    const backup = {
      id: `backup_${Date.now()}`,
      name: `Backup before applying ${scenario.name}`,
      type: 'backup' as const,
      description: 'Automatic backup created before scenario application',
      baseMonth: getCurrentMonth(),
      adjustments: [],
      globalShocks: [],
      createdAt: new Date().toISOString(),
      originalBudgetItems: budgetItems,
      originalCategories: categories
    }

    const updatedScenarios = [...scenarios, backup]

    const updateResult = await updateUserMetadata({
      ...metadata,
      budget_items: result.updatedBudgetItems,
      categories: result.updatedCategories,
      scenarios: updatedScenarios
    })

    if (!updateResult.success) {
      return NextResponse.json({ error: updateResult.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      appliedScenario: scenario,
      backup,
      warnings: result.warnings,
      appliedAdjustments: result.appliedAdjustments
    })

  } catch (error) {
    console.error('Error applying scenario:', error)
    return NextResponse.json(
      { error: 'Failed to apply scenario' },
      { status: 500 }
    )
  }
}

// Delete scenario
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const scenarioId = searchParams.get('id')

    if (!scenarioId) {
      return NextResponse.json({ error: 'Scenario ID required' }, { status: 400 })
    }

    const metadata = user.user_metadata || {}
    const scenarios = metadata.scenarios || []

    const filteredScenarios = scenarios.filter((s: any) => s.id !== scenarioId)

    if (filteredScenarios.length === scenarios.length) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
    }

    const result = await updateUserMetadata({
      ...metadata,
      scenarios: filteredScenarios
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Scenario deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting scenario:', error)
    return NextResponse.json(
      { error: 'Failed to delete scenario' },
      { status: 500 }
    )
  }
}

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
