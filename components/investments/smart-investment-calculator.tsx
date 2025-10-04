'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Target,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  PiggyBank,
  Zap,
  ArrowRight,
  BarChart3
} from 'lucide-react'
import { motion } from 'framer-motion'

interface InvestmentScenario {
  name: string
  description: string
  expectedReturn: number
  risk: 'Low' | 'Medium' | 'High' | 'Very High'
  examples: string[]
  color: string
}

const investmentScenarios: InvestmentScenario[] = [
  {
    name: 'High-Yield Savings',
    description: 'Safe, guaranteed returns',
    expectedReturn: 4.5,
    risk: 'Low',
    examples: ['High-yield savings accounts', 'CDs', 'Treasury bills'],
    color: 'green'
  },
  {
    name: 'Conservative Portfolio',
    description: 'Stable, long-term growth',
    expectedReturn: 6,
    risk: 'Low',
    examples: ['Bond index funds', '60/40 portfolio', 'Target-date funds'],
    color: 'blue'
  },
  {
    name: 'Balanced Portfolio',
    description: 'Moderate risk, solid returns',
    expectedReturn: 8,
    risk: 'Medium',
    examples: ['S&P 500 index', 'Total market funds', 'Diversified ETFs'],
    color: 'purple'
  },
  {
    name: 'Growth Portfolio',
    description: 'Higher risk, higher potential',
    expectedReturn: 10,
    risk: 'High',
    examples: ['Growth stocks', 'Tech ETFs', 'Emerging markets'],
    color: 'orange'
  },
  {
    name: 'Aggressive Portfolio',
    description: 'Maximum growth potential',
    expectedReturn: 12,
    risk: 'Very High',
    examples: ['Individual stocks', 'Crypto', 'Startup investments'],
    color: 'red'
  }
]

export function SmartInvestmentCalculator() {
  const [currentAge, setCurrentAge] = useState(30)
  const [retirementAge, setRetirementAge] = useState(65)
  const [currentSavings, setCurrentSavings] = useState(10000)
  const [monthlyContribution, setMonthlyContribution] = useState(500)
  const [selectedScenario, setSelectedScenario] = useState(investmentScenarios[2])
  const [inflationRate, setInflationRate] = useState(2.5)
  const [retirementGoal, setRetirementGoal] = useState(1000000)

  // Smart calculations
  const calculations = useMemo(() => {
    const yearsToRetirement = retirementAge - currentAge
    const monthsToRetirement = yearsToRetirement * 12
    const monthlyReturn = selectedScenario.expectedReturn / 100 / 12

    // Future value calculation with compound interest
    let futureValue = currentSavings
    for (let month = 0; month < monthsToRetirement; month++) {
      futureValue = futureValue * (1 + monthlyReturn) + monthlyContribution
    }

    const totalContributions = currentSavings + (monthlyContribution * monthsToRetirement)
    const totalGrowth = futureValue - totalContributions

    // Retirement income using 4% rule
    const annualRetirementIncome = futureValue * 0.04
    const monthlyRetirementIncome = annualRetirementIncome / 12

    // Inflation-adjusted values
    const inflationFactor = Math.pow(1 + inflationRate / 100, yearsToRetirement)
    const realValue = futureValue / inflationFactor
    const realMonthlyIncome = monthlyRetirementIncome / inflationFactor

    // Goal analysis
    const goalProgress = (futureValue / retirementGoal) * 100
    const shortfall = Math.max(0, retirementGoal - futureValue)
    const extraMonthlyNeeded = shortfall > 0 
      ? (shortfall - totalGrowth) / monthsToRetirement 
      : 0

    return {
      yearsToRetirement,
      futureValue,
      totalContributions,
      totalGrowth,
      annualRetirementIncome,
      monthlyRetirementIncome,
      realValue,
      realMonthlyIncome,
      goalProgress,
      shortfall,
      extraMonthlyNeeded,
      returnOnInvestment: (totalGrowth / totalContributions) * 100
    }
  }, [currentAge, retirementAge, currentSavings, monthlyContribution, selectedScenario, inflationRate, retirementGoal])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getScenarioColor = (color: string) => {
    const colors = {
      green: 'border-green-500 bg-green-50 dark:bg-green-950/30',
      blue: 'border-blue-500 bg-blue-50 dark:bg-blue-950/30',
      purple: 'border-purple-500 bg-purple-50 dark:bg-purple-950/30',
      orange: 'border-orange-500 bg-orange-50 dark:bg-orange-950/30',
      red: 'border-red-500 bg-red-50 dark:bg-red-950/30'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-600 bg-green-100 dark:bg-green-900'
      case 'Medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900'
      case 'High': return 'text-orange-600 bg-orange-100 dark:bg-orange-900'
      case 'Very High': return 'text-red-600 bg-red-100 dark:bg-red-900'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900'
    }
  }

  return (
    <div className="space-y-6" data-testid="smart-investment-calculator">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
          <Calculator className="h-6 w-6 text-blue-500" />
          Smart Investment Calculator
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Plan your retirement with realistic scenarios and actionable insights
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-500" />
              Your Investment Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Current Age</Label>
                <Input
                  type="number"
                  value={currentAge}
                  onChange={(e) => setCurrentAge(Number(e.target.value))}
                  min="18"
                  max="70"
                />
              </div>
              <div className="space-y-2">
                <Label>Retirement Age</Label>
                <Input
                  type="number"
                  value={retirementAge}
                  onChange={(e) => setRetirementAge(Number(e.target.value))}
                  min={currentAge + 1}
                  max="80"
                />
              </div>
            </div>

            {/* Financial inputs */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Current Savings</Label>
                <Input
                  type="number"
                  value={currentSavings}
                  onChange={(e) => setCurrentSavings(Number(e.target.value))}
                  min="0"
                  step="1000"
                />
              </div>
              <div className="space-y-2">
                <Label>Monthly Investment</Label>
                <Input
                  type="number"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                  min="0"
                  step="50"
                />
              </div>
              <div className="space-y-2">
                <Label>Retirement Goal</Label>
                <Input
                  type="number"
                  value={retirementGoal}
                  onChange={(e) => setRetirementGoal(Number(e.target.value))}
                  min="100000"
                  step="100000"
                />
              </div>
            </div>

            {/* Investment Strategy Selection */}
            <div className="space-y-3">
              <Label>Investment Strategy</Label>
              <div className="space-y-2">
                {investmentScenarios.map((scenario) => (
                  <motion.button
                    key={scenario.name}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedScenario(scenario)}
                    className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                      selectedScenario.name === scenario.name
                        ? getScenarioColor(scenario.color)
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {scenario.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {scenario.description} • {scenario.expectedReturn}% annual return
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {scenario.examples.join(', ')}
                        </div>
                      </div>
                      <Badge className={getRiskColor(scenario.risk)}>
                        {scenario.risk} Risk
                      </Badge>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results & Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-500" />
              Retirement Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Key Results */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(calculations.futureValue)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Portfolio at Retirement
                </div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(calculations.monthlyRetirementIncome)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Monthly Income (4% rule)
                </div>
              </div>
            </div>

            {/* Goal Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Retirement Goal Progress</Label>
                <Badge variant={calculations.goalProgress >= 100 ? "default" : "outline"}>
                  {calculations.goalProgress.toFixed(0)}%
                </Badge>
              </div>
              <Progress value={Math.min(100, calculations.goalProgress)} className="h-3" />
              
              {calculations.goalProgress < 100 && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium text-yellow-800 dark:text-yellow-200">
                        Shortfall: {formatCurrency(calculations.shortfall)}
                      </div>
                      <div className="text-yellow-700 dark:text-yellow-300 mt-1">
                        Increase monthly investment by {formatCurrency(calculations.extraMonthlyNeeded)} 
                        or consider a higher-return strategy.
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {calculations.goalProgress >= 100 && (
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium text-green-800 dark:text-green-200">
                        🎉 Goal Achieved!
                      </div>
                      <div className="text-green-700 dark:text-green-300 mt-1">
                        You're on track to exceed your retirement goal by {formatCurrency(calculations.futureValue - retirementGoal)}.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Smart Insights */}
            <Tabs defaultValue="insights" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="insights">Smart Insights</TabsTrigger>
                <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
              </TabsList>

              <TabsContent value="insights" className="space-y-3 mt-4">
                {/* Time advantage */}
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium text-blue-800 dark:text-blue-200">
                        Time Advantage: {calculations.yearsToRetirement} years
                      </div>
                      <div className="text-blue-700 dark:text-blue-300">
                        Starting early gives you {calculations.yearsToRetirement} years of compound growth.
                        Each year you wait costs approximately {formatCurrency(calculations.futureValue * 0.08)}.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compound power */}
                <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-600 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium text-purple-800 dark:text-purple-200">
                        Compound Power: {calculations.returnOnInvestment.toFixed(0)}% total return
                      </div>
                      <div className="text-purple-700 dark:text-purple-300">
                        Your {formatCurrency(calculations.totalContributions)} investment grows to {formatCurrency(calculations.futureValue)}.
                        That's {formatCurrency(calculations.totalGrowth)} in free money!
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inflation impact */}
                <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-orange-600 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium text-orange-800 dark:text-orange-200">
                        Inflation Reality Check
                      </div>
                      <div className="text-orange-700 dark:text-orange-300">
                        Your {formatCurrency(calculations.futureValue)} will have the buying power of {formatCurrency(calculations.realValue)} in today's dollars.
                        Monthly income: {formatCurrency(calculations.realMonthlyIncome)} (today's purchasing power).
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="breakdown" className="space-y-3 mt-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Starting Amount</span>
                    <span className="font-medium">{formatCurrency(currentSavings)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Contributions</span>
                    <span className="font-medium">{formatCurrency(calculations.totalContributions - currentSavings)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Investment Growth</span>
                    <span className="font-medium text-green-600">{formatCurrency(calculations.totalGrowth)}</span>
                  </div>
                  <hr className="border-gray-200 dark:border-gray-700" />
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total at Retirement</span>
                    <span className="text-green-600">{formatCurrency(calculations.futureValue)}</span>
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <div>• Monthly contribution for {calculations.yearsToRetirement} years</div>
                      <div>• {selectedScenario.expectedReturn}% annual return ({selectedScenario.name})</div>
                      <div>• 4% withdrawal rule for retirement income</div>
                      <div>• {inflationRate}% inflation adjustment</div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Action Recommendations */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <PiggyBank className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              Start Today
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Every month you wait costs you compound growth
            </div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-4">
            <Zap className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              Automate It
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Set up automatic transfers to remove emotion
            </div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-4">
            <TrendingUp className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              Stay Consistent
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Regular contributions beat market timing
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        <Button className="btn-primary">
          <PiggyBank className="h-4 w-4 mr-2" />
          Create Investment Plan
        </Button>
        <Button variant="outline">
          <Calculator className="h-4 w-4 mr-2" />
          Save Calculation
        </Button>
        <Button variant="outline">
          <ArrowRight className="h-4 w-4 mr-2" />
          Open Brokerage Account
        </Button>
      </div>
    </div>
  )
}
