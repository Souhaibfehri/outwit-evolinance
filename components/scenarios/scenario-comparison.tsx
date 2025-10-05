'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Download
} from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { ScenarioComparison, Scenario, calculateScenarioImpact } from '@/lib/scenarios/engine'
import { formatCurrency } from '@/lib/budget/calcs'

interface ScenarioComparisonProps {
  comparison: ScenarioComparison
  onApplyScenario: (scenarioId: string) => void
  onDeleteScenario: (scenarioId: string) => void
  className?: string
}

export function ScenarioComparisonView({
  comparison,
  onApplyScenario,
  onDeleteScenario,
  className
}: ScenarioComparisonProps) {
  const [selectedMetric, setSelectedMetric] = useState<'netCashFlow' | 'rta' | 'totalIncome' | 'totalExpenses'>('netCashFlow')

  if (comparison.scenarios.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Scenarios to Compare</h3>
          <p className="text-muted-foreground">
            Create multiple scenarios to see side-by-side comparisons
          </p>
        </CardContent>
      </Card>
    )
  }

  // Prepare chart data
  const chartData = comparison.comparisonData.months.map(month => {
    const dataPoint: any = { month: formatMonthForChart(month) }
    
    comparison.scenarios.forEach(scenario => {
      const monthIndex = comparison.comparisonData.months.indexOf(month)
      dataPoint[scenario.name] = comparison.comparisonData[selectedMetric][scenario.id]?.[monthIndex] || 0
    })
    
    return dataPoint
  })

  const baseScenario = comparison.scenarios.find(s => s.type === 'base')
  const otherScenarios = comparison.scenarios.filter(s => s.type !== 'base')

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Comparison Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              Scenario Comparison
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="netCashFlow">Net Cash Flow</SelectItem>
                  <SelectItem value="rta">Ready to Assign</SelectItem>
                  <SelectItem value="totalIncome">Total Income</SelectItem>
                  <SelectItem value="totalExpenses">Total Expenses</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                {comparison.scenarios.map((scenario, index) => (
                  <Line
                    key={scenario.id}
                    type="monotone"
                    dataKey={scenario.name}
                    stroke={getScenarioColor(scenario.type, index)}
                    strokeWidth={scenario.type === 'base' ? 3 : 2}
                    strokeDasharray={scenario.type === 'base' ? '0' : '5,5'}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Impact Summary Cards */}
      {baseScenario && otherScenarios.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {otherScenarios.map(scenario => {
            const impact = calculateScenarioImpact(baseScenario, scenario)
            return (
              <Card key={scenario.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{scenario.name}</CardTitle>
                    <Badge variant={
                      impact.riskLevel === 'high' ? 'destructive' :
                      impact.riskLevel === 'medium' ? 'secondary' : 'outline'
                    }>
                      {impact.riskLevel} risk
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Income Change</span>
                      <span className={`font-medium ${
                        impact.totalIncomeChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {impact.totalIncomeChange >= 0 ? '+' : ''}{formatCurrency(impact.totalIncomeChange)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Expense Change</span>
                      <span className={`font-medium ${
                        impact.totalExpenseChange <= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {impact.totalExpenseChange >= 0 ? '+' : ''}{formatCurrency(impact.totalExpenseChange)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="font-medium">Net Impact</span>
                      <span className={`font-bold ${
                        impact.netCashFlowChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {impact.netCashFlowChange >= 0 ? '+' : ''}{formatCurrency(impact.netCashFlowChange)}
                      </span>
                    </div>
                  </div>

                  {impact.monthsToBreakeven && (
                    <div className="p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded text-xs">
                      <div className="flex items-center gap-1 text-yellow-700 dark:text-yellow-300">
                        <AlertTriangle className="h-3 w-3" />
                        Breakeven in {impact.monthsToBreakeven} months
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onApplyScenario(scenario.id)}
                      className="flex-1"
                    >
                      <ArrowRight className="h-3 w-3 mr-1" />
                      Apply to Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Delta Table */}
      <Card>
        <CardHeader>
          <CardTitle>Category Impact Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Base</TableHead>
                  {comparison.scenarios.filter(s => s.type === 'optimistic').length > 0 && (
                    <>
                      <TableHead className="text-right">Optimistic</TableHead>
                      <TableHead className="text-right">Δ Optimistic</TableHead>
                    </>
                  )}
                  {comparison.scenarios.filter(s => s.type === 'stress').length > 0 && (
                    <>
                      <TableHead className="text-right">Stress</TableHead>
                      <TableHead className="text-right">Δ Stress</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparison.deltaTable.slice(0, 10).map(delta => (
                  <TableRow key={delta.categoryId || 'income'}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {delta.categoryId === null && <DollarSign className="h-4 w-4 text-green-600" />}
                        {delta.categoryName}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(delta.baseValue)}
                    </TableCell>
                    {comparison.scenarios.filter(s => s.type === 'optimistic').length > 0 && (
                      <>
                        <TableCell className="text-right">
                          {formatCurrency(delta.optimisticValue)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-medium ${
                            delta.optimisticDelta >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {delta.optimisticDelta >= 0 ? '+' : ''}{formatCurrency(delta.optimisticDelta)}
                          </span>
                        </TableCell>
                      </>
                    )}
                    {comparison.scenarios.filter(s => s.type === 'stress').length > 0 && (
                      <>
                        <TableCell className="text-right">
                          {formatCurrency(delta.stressValue)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-medium ${
                            delta.stressDelta >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {delta.stressDelta >= 0 ? '+' : ''}{formatCurrency(delta.stressDelta)}
                          </span>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function formatMonthForChart(month: string): string {
  const date = new Date(month + '-01')
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

function getScenarioColor(type: string, index: number): string {
  const colors = {
    base: '#6b7280', // gray
    optimistic: '#3b82f6', // blue (Outwit positive)
    stress: '#ef4444', // red (keep for danger)
    custom: '#f97316' // orange (Outwit primary)
  }
  
  return colors[type as keyof typeof colors] || `hsl(${index * 60}, 70%, 50%)`
}
