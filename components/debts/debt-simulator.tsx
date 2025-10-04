'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  Calculator, 
  TrendingDown, 
  Snowflake, 
  HelpCircle,
  Target,
  Calendar,
  DollarSign,
  Zap,
  Trophy,
  ArrowRight,
  Plus
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { 
  DebtAccount, 
  PayoffSimulation, 
  DEBT_METHODS 
} from '@/lib/types/debts'
import { 
  computePayoffSchedule, 
  generateDebtExamples 
} from '@/lib/debt-payoff-engine'

interface DebtSimulatorProps {
  debts: DebtAccount[]
  onApplyPlan?: (simulation: PayoffSimulation) => void
}

export function DebtSimulator({ debts, onApplyPlan }: DebtSimulatorProps) {
  const [method, setMethod] = useState<'avalanche' | 'snowball'>('avalanche')
  const [extraPerMonth, setExtraPerMonth] = useState(100)
  const [lumpSum, setLumpSum] = useState({ amount: 0, date: '' })
  const [roundUpToNearest, setRoundUpToNearest] = useState(0)
  const [keepMinimums, setKeepMinimums] = useState(true)
  const [simulation, setSimulation] = useState<PayoffSimulation | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  // Generate examples with user's actual data
  const examples = generateDebtExamples(debts)

  useEffect(() => {
    if (debts.length > 0) {
      runSimulation()
    }
  }, [method, extraPerMonth, lumpSum, roundUpToNearest, keepMinimums, debts])

  const runSimulation = async () => {
    if (debts.length === 0) return

    setIsCalculating(true)
    
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const options = {
        method,
        extraPerMonth,
        lumpSum: lumpSum.amount > 0 && lumpSum.date ? lumpSum : undefined,
        roundUpToNearest: roundUpToNearest > 0 ? roundUpToNearest : undefined,
        keepMinimums
      }

      const results = computePayoffSchedule(debts, options)
      setSimulation(results)
    } catch (error) {
      console.error('Error running simulation:', error)
      toast.error('Failed to run simulation')
    } finally {
      setIsCalculating(false)
    }
  }

  const handleApplyPlan = () => {
    if (simulation && onApplyPlan) {
      onApplyPlan(simulation)
      toast.success('Debt payoff plan applied to your budget!')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatMonthsDisplay = (months: number) => {
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    
    if (years === 0) return `${months} months`
    if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`
    return `${years}y ${remainingMonths}m`
  }

  if (debts.length === 0) {
    return (
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-8 text-center">
          <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-medium mb-2">No debts to simulate</h3>
          <p className="text-gray-500 text-sm mb-6">
            Add your first debt to see personalized payoff strategies
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Debt
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Method Selection */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-orange-600" />
            Debt Payoff Simulator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={method} onValueChange={(value: any) => setMethod(value)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="avalanche" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Avalanche
              </TabsTrigger>
              <TabsTrigger value="snowball" className="flex items-center gap-2">
                <Snowflake className="h-4 w-4" />
                Snowball
              </TabsTrigger>
            </TabsList>

            <TabsContent value="avalanche" className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <TrendingDown className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Debt Avalanche Method
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 inline ml-2 text-blue-600 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <div className="space-y-2">
                              <div className="font-medium">How it works:</div>
                              <div className="text-sm">
                                {DEBT_METHODS.avalanche.description}
                              </div>
                              <div className="text-sm">
                                <strong>Best for:</strong> {DEBT_METHODS.avalanche.bestFor}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </h4>
                    <p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
                      {DEBT_METHODS.avalanche.description}
                    </p>
                    <div className="bg-white dark:bg-blue-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                      <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                        With Your Debts:
                      </div>
                      <div className="text-blue-700 dark:text-blue-300 text-sm">
                        {examples.avalanche}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="snowball" className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <Snowflake className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                      Debt Snowball Method
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 inline ml-2 text-green-600 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <div className="space-y-2">
                              <div className="font-medium">How it works:</div>
                              <div className="text-sm">
                                {DEBT_METHODS.snowball.description}
                              </div>
                              <div className="text-sm">
                                <strong>Best for:</strong> {DEBT_METHODS.snowball.bestFor}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </h4>
                    <p className="text-green-700 dark:text-green-300 text-sm mb-3">
                      {DEBT_METHODS.snowball.description}
                    </p>
                    <div className="bg-white dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-700">
                      <div className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                        With Your Debts:
                      </div>
                      <div className="text-green-700 dark:text-green-300 text-sm">
                        {examples.snowball}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Simulation Controls */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle>Simulation Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base font-medium mb-3 block">
              Extra Payment per Month: {formatCurrency(extraPerMonth)}
            </Label>
            <Slider
              value={[extraPerMonth]}
              onValueChange={([value]) => setExtraPerMonth(value)}
              max={2000}
              step={25}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>$0</span>
              <span>$2,000</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lump-amount">One-time Lump Sum (Optional)</Label>
              <Input
                id="lump-amount"
                type="number"
                min="0"
                step="100"
                value={lumpSum.amount || ''}
                onChange={(e) => setLumpSum({ ...lumpSum, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="lump-date">Lump Sum Date</Label>
              <Input
                id="lump-date"
                type="date"
                value={lumpSum.date}
                onChange={(e) => setLumpSum({ ...lumpSum, date: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="round-up">Round up payments to nearest:</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="round-up"
                  type="number"
                  min="0"
                  step="5"
                  value={roundUpToNearest || ''}
                  onChange={(e) => setRoundUpToNearest(parseInt(e.target.value) || 0)}
                  placeholder="0 (disabled)"
                  className="w-32"
                />
                <span className="text-sm text-gray-500">dollars</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="keep-minimums"
                checked={keepMinimums}
                onCheckedChange={setKeepMinimums}
              />
              <Label htmlFor="keep-minimums" className="text-sm">
                Keep minimum payments when debts are paid off
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simulation Results */}
      {simulation && (
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Payoff Results
              </CardTitle>
              {onApplyPlan && (
                <Button onClick={handleApplyPlan} className="bg-green-600 hover:bg-green-700 text-white">
                  <Zap className="h-4 w-4 mr-2" />
                  Apply This Plan
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formatMonthsDisplay(simulation.results.monthsToDebtFree)}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  To Debt Freedom
                </div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(simulation.results.totalInterestPaid)}
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  Total Interest
                </div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(simulation.results.interestSaved)}
                </div>
                <div className="text-sm text-orange-700 dark:text-orange-300">
                  Interest Saved
                </div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {simulation.results.monthsSaved}
                </div>
                <div className="text-sm text-purple-700 dark:text-purple-300">
                  Months Saved
                </div>
              </div>
            </div>

            {/* Comparison Message */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800 mb-6">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  🔥 Your Personalized Result
                </div>
                <div className="text-gray-700 dark:text-gray-300">
                  Adding <strong>{formatCurrency(extraPerMonth)}/month</strong> with the{' '}
                  <strong>{method === 'avalanche' ? 'Avalanche' : 'Snowball'}</strong> method:
                </div>
                <div className="text-xl font-bold text-green-600 mt-2">
                  Save {formatCurrency(simulation.results.interestSaved)} and become debt-free{' '}
                  {simulation.results.monthsSaved} months sooner! 🎉
                </div>
              </div>
            </div>

            {/* Milestones */}
            {simulation.results.milestones.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Payoff Milestones
                </h4>
                <div className="space-y-2">
                  {simulation.results.milestones.slice(0, 5).map((milestone, index) => (
                    <motion.div
                      key={milestone.debtId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                    >
                      <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {milestone.month}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-green-900 dark:text-green-100">
                          {milestone.message}
                        </div>
                        <div className="text-sm text-green-700 dark:text-green-300">
                          Month {milestone.month} ({formatMonthsDisplay(milestone.month)})
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Method Comparison */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Method Comparison
              </h4>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {examples.comparison}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

}
