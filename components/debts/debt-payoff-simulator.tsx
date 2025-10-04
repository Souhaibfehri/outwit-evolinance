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
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Area,
  AreaChart
} from 'recharts'
import { 
  Calculator, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Zap,
  Target,
  Trophy,
  AlertCircle,
  CheckCircle,
  Snowflake,
  Mountain
} from 'lucide-react'
import { motion } from 'framer-motion'

interface Debt {
  id: string
  name: string
  balance: number
  minPayment: number
  interestRate: number
  type: 'credit_card' | 'loan' | 'other'
}

interface PayoffScenario {
  method: 'avalanche' | 'snowball'
  totalInterest: number
  totalTime: number
  monthlyPayments: Array<{
    month: number
    debt: string
    payment: number
    balance: number
    totalPaid: number
  }>
}

interface DebtSimulatorProps {
  initialDebts?: Debt[]
}

const sampleDebts: Debt[] = [
  { id: '1', name: 'Credit Card 1', balance: 5000, minPayment: 150, interestRate: 18.99, type: 'credit_card' },
  { id: '2', name: 'Credit Card 2', balance: 3000, minPayment: 90, interestRate: 22.99, type: 'credit_card' },
  { id: '3', name: 'Student Loan', balance: 15000, minPayment: 200, interestRate: 6.8, type: 'loan' },
  { id: '4', name: 'Car Loan', balance: 12000, minPayment: 350, interestRate: 4.5, type: 'loan' }
]

export function DebtPayoffSimulator({ initialDebts = sampleDebts }: DebtSimulatorProps) {
  const [debts, setDebts] = useState<Debt[]>(initialDebts)
  const [extraPayment, setExtraPayment] = useState(200)
  const [selectedMethod, setSelectedMethod] = useState<'avalanche' | 'snowball'>('avalanche')

  // Calculate debt payoff scenarios
  const scenarios = useMemo(() => {
    const calculatePayoff = (method: 'avalanche' | 'snowball'): PayoffScenario => {
      let workingDebts = debts.map(d => ({ ...d }))
      const payments: PayoffScenario['monthlyPayments'] = []
      let month = 0
      let totalInterest = 0

      while (workingDebts.some(d => d.balance > 0)) {
        month++
        
        // Sort debts based on method
        if (method === 'avalanche') {
          workingDebts.sort((a, b) => b.interestRate - a.interestRate)
        } else {
          workingDebts.sort((a, b) => a.balance - b.balance)
        }

        // Calculate minimum payments and interest
        workingDebts.forEach(debt => {
          if (debt.balance > 0) {
            const monthlyInterest = (debt.balance * debt.interestRate / 100) / 12
            totalInterest += monthlyInterest
            debt.balance += monthlyInterest
            
            const payment = Math.min(debt.minPayment, debt.balance)
            debt.balance -= payment
            
            payments.push({
              month,
              debt: debt.name,
              payment,
              balance: Math.max(0, debt.balance),
              totalPaid: payment
            })
          }
        })

        // Apply extra payment to target debt
        const targetDebt = workingDebts.find(d => d.balance > 0)
        if (targetDebt && extraPayment > 0) {
          const extraApplied = Math.min(extraPayment, targetDebt.balance)
          targetDebt.balance -= extraApplied
          
          payments.push({
            month,
            debt: `${targetDebt.name} (Extra)`,
            payment: extraApplied,
            balance: Math.max(0, targetDebt.balance),
            totalPaid: extraApplied
          })
        }

        // Safety check to prevent infinite loops
        if (month > 600) break // 50 years max
      }

      return {
        method,
        totalInterest,
        totalTime: month,
        monthlyPayments: payments
      }
    }

    return {
      avalanche: calculatePayoff('avalanche'),
      snowball: calculatePayoff('snowball')
    }
  }, [debts, extraPayment])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatMonths = (months: number) => {
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    if (years === 0) return `${months} months`
    if (remainingMonths === 0) return `${years} years`
    return `${years}y ${remainingMonths}m`
  }

  const updateDebt = (id: string, field: keyof Debt, value: any) => {
    setDebts(debts.map(debt => 
      debt.id === id ? { ...debt, [field]: value } : debt
    ))
  }

  const addDebt = () => {
    const newDebt: Debt = {
      id: Date.now().toString(),
      name: 'New Debt',
      balance: 1000,
      minPayment: 50,
      interestRate: 15,
      type: 'credit_card'
    }
    setDebts([...debts, newDebt])
  }

  const removeDebt = (id: string) => {
    setDebts(debts.filter(debt => debt.id !== id))
  }

  const totalBalance = debts.reduce((sum, debt) => sum + debt.balance, 0)
  const totalMinPayment = debts.reduce((sum, debt) => sum + debt.minPayment, 0)
  const avgInterestRate = debts.reduce((sum, debt) => sum + debt.interestRate * debt.balance, 0) / totalBalance

  const bestMethod = scenarios.avalanche.totalInterest < scenarios.snowball.totalInterest ? 'avalanche' : 'snowball'
  const savings = Math.abs(scenarios.avalanche.totalInterest - scenarios.snowball.totalInterest)
  const timeSavings = Math.abs(scenarios.avalanche.totalTime - scenarios.snowball.totalTime)

  return (
    <div className="space-y-6" data-coach-anchor="debt-simulator">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
          <Calculator className="h-6 w-6 text-red-500" />
          Debt Payoff Simulator
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Compare Avalanche vs Snowball methods and find your optimal debt payoff strategy
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Debt Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-500" />
              Your Debts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {debts.map((debt, index) => (
              <motion.div
                key={debt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 border rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Input
                    value={debt.name}
                    onChange={(e) => updateDebt(debt.id, 'name', e.target.value)}
                    className="font-medium"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDebt(debt.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </Button>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Balance</Label>
                    <Input
                      type="number"
                      value={debt.balance}
                      onChange={(e) => updateDebt(debt.id, 'balance', parseFloat(e.target.value) || 0)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Min Payment</Label>
                    <Input
                      type="number"
                      value={debt.minPayment}
                      onChange={(e) => updateDebt(debt.id, 'minPayment', parseFloat(e.target.value) || 0)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">APR (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={debt.interestRate}
                      onChange={(e) => updateDebt(debt.id, 'interestRate', parseFloat(e.target.value) || 0)}
                      className="text-sm"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
            
            <div className="flex gap-2">
              <Button onClick={addDebt} variant="outline" className="flex-1">
                + Add Debt
              </Button>
              <div className="flex-1">
                <Label className="text-xs">Extra Payment</Label>
                <Input
                  type="number"
                  value={extraPayment}
                  onChange={(e) => setExtraPayment(parseFloat(e.target.value) || 0)}
                  placeholder="Extra monthly payment"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Payoff Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as 'avalanche' | 'snowball')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="avalanche" className="flex items-center gap-2">
                  <Mountain className="h-4 w-4" />
                  Avalanche
                </TabsTrigger>
                <TabsTrigger value="snowball" className="flex items-center gap-2">
                  <Snowflake className="h-4 w-4" />
                  Snowball
                </TabsTrigger>
              </TabsList>

              <div className="mt-6 space-y-4">
                {/* Method comparison */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg border-2 transition-all ${
                    bestMethod === 'avalanche' 
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/30' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}>
                    <div className="text-center space-y-2">
                      <Mountain className="h-6 w-6 text-red-500 mx-auto" />
                      <div className="font-semibold">Avalanche Method</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Pay minimums, then attack highest interest rate first
                      </div>
                      <div className="space-y-1">
                        <div className="text-lg font-bold text-red-600">
                          {formatCurrency(scenarios.avalanche.totalInterest)}
                        </div>
                        <div className="text-xs">Total Interest</div>
                        <div className="text-sm font-medium">
                          {formatMonths(scenarios.avalanche.totalTime)}
                        </div>
                      </div>
                      {bestMethod === 'avalanche' && (
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Best Choice
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border-2 transition-all ${
                    bestMethod === 'snowball' 
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/30' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}>
                    <div className="text-center space-y-2">
                      <Snowflake className="h-6 w-6 text-blue-500 mx-auto" />
                      <div className="font-semibold">Snowball Method</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Pay minimums, then attack smallest balance first
                      </div>
                      <div className="space-y-1">
                        <div className="text-lg font-bold text-blue-600">
                          {formatCurrency(scenarios.snowball.totalInterest)}
                        </div>
                        <div className="text-xs">Total Interest</div>
                        <div className="text-sm font-medium">
                          {formatMonths(scenarios.snowball.totalTime)}
                        </div>
                      </div>
                      {bestMethod === 'snowball' && (
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Best Choice
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Savings comparison */}
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-center space-y-2">
                    <Trophy className="h-6 w-6 text-green-600 mx-auto" />
                    <div className="font-semibold text-green-800 dark:text-green-200">
                      {bestMethod === 'avalanche' ? 'Avalanche' : 'Snowball'} Method Saves You:
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(savings)}
                        </div>
                        <div className="text-sm text-green-700 dark:text-green-300">
                          In Interest
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {formatMonths(timeSavings)}
                        </div>
                        <div className="text-sm text-green-700 dark:text-green-300">
                          Faster Payoff
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed timeline */}
                <TabsContent value="avalanche">
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Mountain className="h-4 w-4 text-red-500" />
                      Avalanche Method Timeline
                    </h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={scenarios.avalanche.monthlyPayments.slice(0, 60)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" label={{ value: 'Months', position: 'insideBottom', offset: -5 }} />
                          <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Area
                            type="monotone"
                            dataKey="balance"
                            stroke="#ef4444"
                            fill="#ef4444"
                            fillOpacity={0.6}
                            name="Remaining Balance"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="snowball">
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Snowflake className="h-4 w-4 text-blue-500" />
                      Snowball Method Timeline
                    </h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={scenarios.snowball.monthlyPayments.slice(0, 60)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" label={{ value: 'Months', position: 'insideBottom', offset: -5 }} />
                          <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Area
                            type="monotone"
                            dataKey="balance"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.6}
                            name="Remaining Balance"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Summary stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingDown className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalBalance)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Debt
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalMinPayment + extraPayment)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Monthly Payment
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {avgInterestRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Avg Interest Rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {formatMonths(scenarios[bestMethod].totalTime)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Payoff Time ({bestMethod})
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Educational content */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 border-red-200 dark:border-red-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Mountain className="h-6 w-6 text-red-600 mt-1" />
              <div className="space-y-2">
                <h4 className="font-semibold text-red-800 dark:text-red-200">
                  🏔️ Avalanche Method
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300">
                  <strong>Mathematically optimal.</strong> Pay minimums on all debts, then put extra money toward the highest interest rate debt first.
                </p>
                <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                  <li>• Saves the most money overall</li>
                  <li>• Reduces total interest paid</li>
                  <li>• Requires discipline and patience</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Snowflake className="h-6 w-6 text-blue-600 mt-1" />
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                  ❄️ Snowball Method
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Psychologically motivating.</strong> Pay minimums on all debts, then put extra money toward the smallest balance first.
                </p>
                <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                  <li>• Provides quick wins and motivation</li>
                  <li>• Builds momentum with early victories</li>
                  <li>• May cost more in total interest</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 justify-center">
        <Button className="btn-primary">
          <Target className="h-4 w-4 mr-2" />
          Create Debt Payoff Plan
        </Button>
        <Button variant="outline">
          <Calculator className="h-4 w-4 mr-2" />
          Save Simulation
        </Button>
      </div>
    </div>
  )
}
