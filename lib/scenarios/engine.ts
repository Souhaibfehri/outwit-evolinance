// Scenario Sandbox Engine
// Create and compare Base/Optimistic/Stress scenarios

import { ForecastMonth } from '@/lib/forecast/engine'

export type ScenarioType = 'base' | 'optimistic' | 'stress' | 'custom'

export interface ScenarioAdjustment {
  categoryId: string | null // null for income adjustments
  adjustmentType: 'percentage' | 'fixed_amount'
  value: number // percentage (e.g., 10 for +10%) or fixed amount
  startMonth?: string // when adjustment starts (default: next month)
  endMonth?: string // when adjustment ends (optional)
  note?: string
}

export interface GlobalShock {
  id: string
  name: string
  description: string
  startMonth: string
  adjustments: ScenarioAdjustment[]
}

export interface Scenario {
  id: string
  name: string
  type: ScenarioType
  description: string
  baseMonth: string
  adjustments: ScenarioAdjustment[]
  globalShocks: string[] // IDs of applied global shocks
  createdAt: string
  forecast?: ForecastMonth[]
}

export interface ScenarioComparison {
  scenarios: Scenario[]
  comparisonData: {
    months: string[]
    netCashFlow: Record<string, number[]> // scenario.id -> monthly values
    rta: Record<string, number[]>
    totalIncome: Record<string, number[]>
    totalExpenses: Record<string, number[]>
  }
  deltaTable: ScenarioDelta[]
}

export interface ScenarioDelta {
  categoryId: string | null
  categoryName: string
  baseValue: number
  optimisticValue: number
  stressValue: number
  optimisticDelta: number
  stressDelta: number
}

/**
 * Create predefined scenario templates
 */
export function createScenarioTemplates(): Omit<Scenario, 'id' | 'createdAt' | 'forecast'>[] {
  const baseMonth = getCurrentMonth()
  
  return [
    {
      name: 'Base Scenario',
      type: 'base',
      description: 'Current plan with no changes',
      baseMonth,
      adjustments: [],
      globalShocks: []
    },
    {
      name: 'Optimistic Scenario',
      type: 'optimistic',
      description: '10% income increase, 5% expense reduction',
      baseMonth,
      adjustments: [
        {
          categoryId: null, // income adjustment
          adjustmentType: 'percentage',
          value: 10,
          note: 'Optimistic income growth'
        }
      ],
      globalShocks: ['optimistic_spending']
    },
    {
      name: 'Stress Test',
      type: 'stress',
      description: '20% income reduction, 15% expense increase',
      baseMonth,
      adjustments: [
        {
          categoryId: null, // income adjustment
          adjustmentType: 'percentage',
          value: -20,
          note: 'Job loss or income reduction'
        }
      ],
      globalShocks: ['inflation_shock', 'emergency_expenses']
    }
  ]
}

/**
 * Create predefined global shock templates
 */
export function createGlobalShockTemplates(): GlobalShock[] {
  const nextMonth = getNextMonth(getCurrentMonth())
  
  return [
    {
      id: 'rent_increase',
      name: 'Rent Increase',
      description: '+10% rent starting next month',
      startMonth: nextMonth,
      adjustments: [
        {
          categoryId: 'housing_rent', // Would need to be mapped to actual category
          adjustmentType: 'percentage',
          value: 10,
          note: 'Annual rent increase'
        }
      ]
    },
    {
      id: 'inflation_shock',
      name: 'Inflation Shock',
      description: '+15% on groceries and utilities',
      startMonth: nextMonth,
      adjustments: [
        {
          categoryId: 'groceries',
          adjustmentType: 'percentage',
          value: 15,
          note: 'Inflation impact on food costs'
        },
        {
          categoryId: 'utilities',
          adjustmentType: 'percentage',
          value: 15,
          note: 'Inflation impact on utilities'
        }
      ]
    },
    {
      id: 'emergency_expenses',
      name: 'Emergency Expenses',
      description: '+$500/month unexpected expenses',
      startMonth: nextMonth,
      adjustments: [
        {
          categoryId: 'emergency_fund',
          adjustmentType: 'fixed_amount',
          value: 500,
          note: 'Unexpected monthly expenses'
        }
      ]
    },
    {
      id: 'optimistic_spending',
      name: 'Optimistic Spending',
      description: '-5% on discretionary categories',
      startMonth: nextMonth,
      adjustments: [
        {
          categoryId: 'entertainment',
          adjustmentType: 'percentage',
          value: -5,
          note: 'Reduced entertainment spending'
        },
        {
          categoryId: 'dining_out',
          adjustmentType: 'percentage',
          value: -5,
          note: 'Reduced dining out'
        }
      ]
    }
  ]
}

/**
 * Apply scenario adjustments to forecast data
 */
export function applyScenarioToForecast(
  baseForecast: ForecastMonth[],
  scenario: Scenario,
  globalShocks: GlobalShock[] = []
): ForecastMonth[] {
  const adjustedForecast = baseForecast.map(month => ({ ...month }))
  
  // Apply scenario adjustments
  for (const adjustment of scenario.adjustments) {
    applyAdjustmentToForecast(adjustedForecast, adjustment)
  }
  
  // Apply global shocks
  for (const shockId of scenario.globalShocks) {
    const shock = globalShocks.find(s => s.id === shockId)
    if (shock) {
      for (const adjustment of shock.adjustments) {
        applyAdjustmentToForecast(adjustedForecast, adjustment, shock.startMonth)
      }
    }
  }
  
  return adjustedForecast
}

/**
 * Apply a single adjustment to forecast data
 */
function applyAdjustmentToForecast(
  forecast: ForecastMonth[],
  adjustment: ScenarioAdjustment,
  startMonth?: string
): void {
  const effectiveStartMonth = startMonth || adjustment.startMonth || getNextMonth(getCurrentMonth())
  
  for (const month of forecast) {
    // Skip months before the adjustment starts
    if (month.month < effectiveStartMonth) continue
    
    // Skip months after the adjustment ends (if specified)
    if (adjustment.endMonth && month.month > adjustment.endMonth) continue
    
    if (adjustment.categoryId === null) {
      // Income adjustment
      const adjustmentAmount = adjustment.adjustmentType === 'percentage' 
        ? month.income * (adjustment.value / 100)
        : adjustment.value
      
      month.income += adjustmentAmount
      month.rta += adjustmentAmount
      month.netCashFlow += adjustmentAmount
    } else {
      // Category adjustment
      const category = month.categories.find(cat => cat.categoryId === adjustment.categoryId)
      if (category) {
        const adjustmentAmount = adjustment.adjustmentType === 'percentage'
          ? category.final * (adjustment.value / 100)
          : adjustment.value
        
        category.final += adjustmentAmount
        month.totalAssigned += adjustmentAmount
        month.rta -= adjustmentAmount
        month.totalSpent += adjustmentAmount * 0.95 // Assume 95% utilization
        month.netCashFlow -= adjustmentAmount * 0.95
      }
    }
  }
}

/**
 * Compare multiple scenarios
 */
export function compareScenarios(scenarios: Scenario[]): ScenarioComparison {
  if (scenarios.length === 0) {
    return {
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
  }

  // Get all months from the first scenario
  const months = scenarios[0].forecast?.map(m => m.month) || []
  
  // Extract comparison data
  const comparisonData = {
    months,
    netCashFlow: {} as Record<string, number[]>,
    rta: {} as Record<string, number[]>,
    totalIncome: {} as Record<string, number[]>,
    totalExpenses: {} as Record<string, number[]>
  }

  for (const scenario of scenarios) {
    if (!scenario.forecast) continue
    
    comparisonData.netCashFlow[scenario.id] = scenario.forecast.map(m => m.netCashFlow)
    comparisonData.rta[scenario.id] = scenario.forecast.map(m => m.rta)
    comparisonData.totalIncome[scenario.id] = scenario.forecast.map(m => m.income)
    comparisonData.totalExpenses[scenario.id] = scenario.forecast.map(m => m.totalSpent)
  }

  // Generate delta table
  const deltaTable = generateDeltaTable(scenarios)

  return {
    scenarios,
    comparisonData,
    deltaTable
  }
}

/**
 * Generate delta comparison table
 */
function generateDeltaTable(scenarios: Scenario[]): ScenarioDelta[] {
  const deltaTable: ScenarioDelta[] = []
  
  if (scenarios.length < 2) return deltaTable

  const baseScenario = scenarios.find(s => s.type === 'base') || scenarios[0]
  const optimisticScenario = scenarios.find(s => s.type === 'optimistic')
  const stressScenario = scenarios.find(s => s.type === 'stress')

  if (!baseScenario.forecast) return deltaTable

  // Compare income
  const baseIncome = baseScenario.forecast.reduce((sum, m) => sum + m.income, 0)
  const optimisticIncome = optimisticScenario?.forecast?.reduce((sum, m) => sum + m.income, 0) || baseIncome
  const stressIncome = stressScenario?.forecast?.reduce((sum, m) => sum + m.income, 0) || baseIncome

  deltaTable.push({
    categoryId: null,
    categoryName: 'Total Income',
    baseValue: baseIncome,
    optimisticValue: optimisticIncome,
    stressValue: stressIncome,
    optimisticDelta: optimisticIncome - baseIncome,
    stressDelta: stressIncome - baseIncome
  })

  // Compare categories
  const allCategories = new Set<string>()
  scenarios.forEach(scenario => {
    scenario.forecast?.forEach(month => {
      month.categories.forEach(cat => {
        allCategories.add(cat.categoryId)
      })
    })
  })

  for (const categoryId of allCategories) {
    const baseTotal = baseScenario.forecast.reduce((sum, month) => {
      const cat = month.categories.find(c => c.categoryId === categoryId)
      return sum + (cat?.final || 0)
    }, 0)

    const optimisticTotal = optimisticScenario?.forecast?.reduce((sum, month) => {
      const cat = month.categories.find(c => c.categoryId === categoryId)
      return sum + (cat?.final || 0)
    }, 0) || baseTotal

    const stressTotal = stressScenario?.forecast?.reduce((sum, month) => {
      const cat = month.categories.find(c => c.categoryId === categoryId)
      return sum + (cat?.final || 0)
    }, 0) || baseTotal

    const categoryName = baseScenario.forecast[0].categories.find(
      c => c.categoryId === categoryId
    )?.categoryName || 'Unknown Category'

    deltaTable.push({
      categoryId,
      categoryName,
      baseValue: baseTotal,
      optimisticValue: optimisticTotal,
      stressValue: stressTotal,
      optimisticDelta: optimisticTotal - baseTotal,
      stressDelta: stressTotal - baseTotal
    })
  }

  return deltaTable.sort((a, b) => Math.abs(b.stressDelta) - Math.abs(a.stressDelta))
}

/**
 * Apply scenario to real plan (dangerous operation)
 */
export function applyScenarioToPlan(
  scenario: Scenario,
  currentBudgetItems: any[],
  categories: any[]
): {
  updatedBudgetItems: any[]
  updatedCategories: any[]
  appliedAdjustments: ScenarioAdjustment[]
  warnings: string[]
} {
  const warnings: string[] = []
  const appliedAdjustments: ScenarioAdjustment[] = []
  const updatedBudgetItems = [...currentBudgetItems]
  const updatedCategories = [...categories]

  warnings.push('⚠️ This will modify your actual budget plan!')
  warnings.push('⚠️ Consider creating a backup scenario first')

  // Apply category adjustments to future months only
  const currentMonth = getCurrentMonth()
  
  for (const adjustment of scenario.adjustments) {
    if (adjustment.categoryId === null) {
      // Income adjustments would need to be applied to income sources
      warnings.push('Income adjustments cannot be applied automatically')
      continue
    }

    // Find category
    const categoryIndex = updatedCategories.findIndex(cat => cat.id === adjustment.categoryId)
    if (categoryIndex === -1) {
      warnings.push(`Category ${adjustment.categoryId} not found`)
      continue
    }

    // Apply adjustment to future budget items
    const futureMonths = generateFutureMonths(currentMonth, 12)
    
    for (const month of futureMonths) {
      const budgetItemIndex = updatedBudgetItems.findIndex(
        item => item.categoryId === adjustment.categoryId && item.month === month
      )

      if (budgetItemIndex >= 0) {
        const currentAssigned = updatedBudgetItems[budgetItemIndex].assigned || 0
        const adjustmentAmount = adjustment.adjustmentType === 'percentage'
          ? currentAssigned * (adjustment.value / 100)
          : adjustment.value

        updatedBudgetItems[budgetItemIndex] = {
          ...updatedBudgetItems[budgetItemIndex],
          assigned: Math.max(0, currentAssigned + adjustmentAmount),
          updatedAt: new Date().toISOString()
        }
      }
    }

    appliedAdjustments.push(adjustment)
  }

  return {
    updatedBudgetItems,
    updatedCategories,
    appliedAdjustments,
    warnings
  }
}

/**
 * Create a new custom scenario
 */
export function createCustomScenario(
  name: string,
  description: string,
  adjustments: ScenarioAdjustment[],
  globalShocks: string[] = []
): Omit<Scenario, 'id' | 'createdAt' | 'forecast'> {
  return {
    name,
    type: 'custom',
    description,
    baseMonth: getCurrentMonth(),
    adjustments,
    globalShocks
  }
}

/**
 * Validate scenario adjustments
 */
export function validateScenario(scenario: Partial<Scenario>): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  if (!scenario.name || scenario.name.trim().length === 0) {
    errors.push('Scenario name is required')
  }

  if (!scenario.adjustments || scenario.adjustments.length === 0) {
    warnings.push('Scenario has no adjustments - it will be identical to base')
  }

  for (const adjustment of scenario.adjustments || []) {
    if (adjustment.adjustmentType === 'percentage') {
      if (Math.abs(adjustment.value) > 100) {
        warnings.push(`Large percentage adjustment: ${adjustment.value}%`)
      }
    } else {
      if (Math.abs(adjustment.value) > 10000) {
        warnings.push(`Large fixed adjustment: $${adjustment.value.toLocaleString()}`)
      }
    }

    if (adjustment.startMonth && adjustment.endMonth) {
      if (adjustment.startMonth >= adjustment.endMonth) {
        errors.push('Start month must be before end month')
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Calculate scenario impact summary
 */
export function calculateScenarioImpact(
  baseScenario: Scenario,
  comparisonScenario: Scenario
): {
  totalIncomeChange: number
  totalExpenseChange: number
  netCashFlowChange: number
  rtaChange: number
  monthsToBreakeven?: number
  riskLevel: 'low' | 'medium' | 'high'
} {
  if (!baseScenario.forecast || !comparisonScenario.forecast) {
    return {
      totalIncomeChange: 0,
      totalExpenseChange: 0,
      netCashFlowChange: 0,
      rtaChange: 0,
      riskLevel: 'low'
    }
  }

  const baseIncome = baseScenario.forecast.reduce((sum, m) => sum + m.income, 0)
  const comparisonIncome = comparisonScenario.forecast.reduce((sum, m) => sum + m.income, 0)
  
  const baseExpenses = baseScenario.forecast.reduce((sum, m) => sum + m.totalSpent, 0)
  const comparisonExpenses = comparisonScenario.forecast.reduce((sum, m) => sum + m.totalSpent, 0)
  
  const baseCashFlow = baseScenario.forecast.reduce((sum, m) => sum + m.netCashFlow, 0)
  const comparisonCashFlow = comparisonScenario.forecast.reduce((sum, m) => sum + m.netCashFlow, 0)
  
  const baseRTA = baseScenario.forecast.reduce((sum, m) => sum + m.rta, 0)
  const comparisonRTA = comparisonScenario.forecast.reduce((sum, m) => sum + m.rta, 0)

  // Calculate risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'low'
  const cashFlowChange = comparisonCashFlow - baseCashFlow
  
  if (cashFlowChange < -1000) riskLevel = 'high'
  else if (cashFlowChange < -500) riskLevel = 'medium'

  // Find months to breakeven (if applicable)
  let monthsToBreakeven: number | undefined
  if (cashFlowChange < 0) {
    for (let i = 0; i < comparisonScenario.forecast.length; i++) {
      if (comparisonScenario.forecast[i].netCashFlow >= 0) {
        monthsToBreakeven = i + 1
        break
      }
    }
  }

  return {
    totalIncomeChange: comparisonIncome - baseIncome,
    totalExpenseChange: comparisonExpenses - baseExpenses,
    netCashFlowChange: cashFlowChange,
    rtaChange: comparisonRTA - baseRTA,
    monthsToBreakeven,
    riskLevel
  }
}

// Helper functions
function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getNextMonth(month: string): string {
  const [year, monthNum] = month.split('-').map(Number)
  const date = new Date(year, monthNum - 1, 1)
  date.setMonth(date.getMonth() + 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function generateFutureMonths(startMonth: string, count: number): string[] {
  const months: string[] = []
  let current = startMonth
  
  for (let i = 0; i < count; i++) {
    current = getNextMonth(current)
    months.push(current)
  }
  
  return months
}
