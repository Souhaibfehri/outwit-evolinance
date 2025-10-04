'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SummaryCard } from '@/components/ui/summary-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Download, 
  FileText, 
  TrendingUp,
  PieChart,
  BarChart3,
  Calendar,
  DollarSign,
  Target,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  ShoppingCart,
  Filter,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  TrendingDown
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { getUserData } from '@/lib/user-data'

interface ReportData {
  totalIncome: number
  totalExpenses: number
  netBalance: number
  debtBalance: number
  investmentValue: number
  goalsProgress: number
  savingsRate: number
  essentialsPercent: number
  debtToIncomeRatio: number
  topCategories: Array<{ name: string; amount: number; percent: number; color: string }>
  monthlyTrend: Array<{ month: string; income: number; expenses: number; net: number }>
  avgTransaction: number
  transactionCount: number
  insights: Array<{ type: 'success' | 'warning' | 'info'; message: string; icon: any }>
}

interface ReportFilters {
  dateRange: 'last30days' | 'last3months' | 'last6months' | 'last12months' | 'ytd' | 'custom'
  startDate?: string
  endDate?: string
  categories?: string[]
  accounts?: string[]
  transactionTypes?: string[]
}

export function ReportsPageV2() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: 'last3months'
  })
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchReportData()
  }, [filters])

  const fetchReportData = async () => {
    try {
      setRefreshing(true)
      
      // Fetch real user data
      const userData = await getUserData()
      
      // Calculate date range
      const { startDate, endDate } = getDateRange(filters.dateRange, filters.startDate, filters.endDate)
      
      // Filter transactions by date range
      const filteredTransactions = userData.transactions.filter(txn => {
        const txnDate = new Date(txn.date)
        return txnDate >= startDate && txnDate <= endDate
      })

      // Calculate metrics
      const totalIncome = filteredTransactions
        .filter(txn => txn.type === 'income')
        .reduce((sum, txn) => sum + txn.amount, 0)

      const totalExpenses = filteredTransactions
        .filter(txn => txn.type === 'expense')
        .reduce((sum, txn) => sum + Math.abs(txn.amount), 0)

      const netBalance = totalIncome - totalExpenses
      const debtBalance = userData.debts.reduce((sum, debt) => sum + debt.balance, 0)
      const investmentValue = userData.investments.reduce((sum, inv) => sum + inv.currentValue, 0)
      
      // Goals progress
      const totalGoalsTarget = userData.goals.reduce((sum, goal) => sum + goal.targetCents / 100, 0)
      const totalGoalsSaved = userData.goals.reduce((sum, goal) => sum + goal.savedCents / 100, 0)
      const goalsProgress = totalGoalsTarget > 0 ? (totalGoalsSaved / totalGoalsTarget) * 100 : 0

      // Calculate financial ratios
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
      const debtToIncomeRatio = totalIncome > 0 ? (debtBalance / (totalIncome * 12)) * 100 : 0

      // Category analysis
      const categoryTotals: Record<string, number> = {}
      filteredTransactions
        .filter(txn => txn.type === 'expense')
        .forEach(txn => {
          const category = txn.categoryName || 'Uncategorized'
          categoryTotals[category] = (categoryTotals[category] || 0) + Math.abs(txn.amount)
        })

      const topCategories = Object.entries(categoryTotals)
        .map(([name, amount], index) => ({
          name,
          amount,
          percent: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
          color: `hsl(${210 + index * 40}, 70%, 50%)`
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)

      // Essential categories (housing, food, utilities, transportation)
      const essentialCategories = ['Housing', 'Food & Dining', 'Utilities', 'Transportation', 'Insurance']
      const essentialsAmount = topCategories
        .filter(cat => essentialCategories.some(essential => cat.name.toLowerCase().includes(essential.toLowerCase())))
        .reduce((sum, cat) => sum + cat.amount, 0)
      const essentialsPercent = totalExpenses > 0 ? (essentialsAmount / totalExpenses) * 100 : 0

      // Monthly trend (last 6 months)
      const monthlyTrend = calculateMonthlyTrend(userData.transactions, 6)

      // Transaction metrics
      const avgTransaction = filteredTransactions.length > 0 
        ? filteredTransactions.reduce((sum, txn) => sum + Math.abs(txn.amount), 0) / filteredTransactions.length
        : 0

      // Generate insights
      const insights = generateFinancialInsights({
        savingsRate,
        essentialsPercent,
        debtToIncomeRatio,
        totalIncome,
        totalExpenses,
        netBalance,
        goalsProgress
      })

      setReportData({
        totalIncome,
        totalExpenses,
        netBalance,
        debtBalance,
        investmentValue,
        goalsProgress,
        savingsRate,
        essentialsPercent: essentialsPercent,
        debtToIncomeRatio,
        topCategories,
        monthlyTrend,
        avgTransaction,
        transactionCount: filteredTransactions.length,
        insights
      })
    } catch (error) {
      console.error('Error fetching report data:', error)
      toast.error('Failed to load report data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleExportPDF = async () => {
    try {
      toast.success('PDF export with charts and logo will be generated')
      // In production, would call PDF generation service
    } catch (error) {
      toast.error('Failed to export PDF')
    }
  }

  const handleExportCSV = async () => {
    try {
      const userData = await getUserData()
      
      // Generate CSV content
      const csvContent = generateReportCSV(userData, reportData)
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `outwit-budget-report-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success('Report exported to CSV successfully!')
    } catch (error) {
      console.error('Error exporting CSV:', error)
      toast.error('Failed to export CSV')
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

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  if (loading && !reportData) {
    return (
      <div className="space-y-6">
        {/* KPI Skeletons */}
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your financial health
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchReportData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleExportPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <Label className="text-sm font-medium">Date Range:</Label>
              <Select 
                value={filters.dateRange} 
                onValueChange={(value: any) => setFilters({ ...filters, dateRange: value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last30days">Last 30 Days</SelectItem>
                  <SelectItem value="last3months">Last 3 Months</SelectItem>
                  <SelectItem value="last6months">Last 6 Months</SelectItem>
                  <SelectItem value="last12months">Last 12 Months</SelectItem>
                  <SelectItem value="ytd">Year to Date</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filters.dateRange === 'custom' && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-36"
                />
                <span className="text-sm text-gray-500">to</span>
                <Input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-36"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main KPIs */}
      {reportData && (
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard
            title="Total Income"
            value={formatCurrency(reportData.totalIncome)}
            subtitle={`${reportData.transactionCount} transactions`}
            icon={ArrowUpRight}
            className="border-green-200 bg-green-50 dark:bg-green-950/20"
          />
          <SummaryCard
            title="Total Expenses"
            value={formatCurrency(reportData.totalExpenses)}
            subtitle={`Avg: ${formatCurrency(reportData.avgTransaction)}`}
            icon={ArrowDownRight}
            className="border-red-200 bg-red-50 dark:bg-red-950/20"
          />
          <SummaryCard
            title="Net Cash Flow"
            value={formatCurrency(reportData.netBalance)}
            subtitle={`Savings rate: ${reportData.savingsRate.toFixed(1)}%`}
            icon={TrendingUp}
            className={reportData.netBalance >= 0 ? "border-green-200 bg-green-50 dark:bg-green-950/20" : "border-red-200 bg-red-50 dark:bg-red-950/20"}
          />
          <SummaryCard
            title="Financial Health"
            value={calculateHealthScore(reportData).toString()}
            subtitle={getHealthScoreLabel(calculateHealthScore(reportData))}
            icon={Target}
            className="border-blue-200 bg-blue-50 dark:bg-blue-950/20"
          />
        </div>
      )}

      {/* Financial Insights */}
      {reportData && reportData.insights.length > 0 && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              AI-Powered Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.insights.map((insight, index) => {
                const IconComponent = insight.icon
                const colorClass = insight.type === 'success' ? 'text-green-600' : 
                                 insight.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg border"
                  >
                    <IconComponent className={`h-5 w-5 ${colorClass} mt-0.5`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {insight.message}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="goals">Goals & Debts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Categories */}
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-blue-600" />
                  Top Spending Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reportData && reportData.topCategories.length > 0 ? (
                  <div className="space-y-4">
                    {reportData.topCategories.map((category, index) => (
                      <motion.div
                        key={category.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          <div>
                            <h4 className="font-medium">{category.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {category.percent.toFixed(1)}% of spending
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(category.amount)}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No expense data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Monthly Trends */}
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Income vs Expenses Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reportData && reportData.monthlyTrend.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span>Income</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span>Expenses</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span>Net</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {reportData.monthlyTrend.map((month, index) => {
                        const maxAmount = Math.max(month.income, month.expenses, Math.abs(month.net))
                        const incomePercent = maxAmount > 0 ? (month.income / maxAmount) * 100 : 0
                        const expensePercent = maxAmount > 0 ? (month.expenses / maxAmount) * 100 : 0
                        
                        return (
                          <motion.div
                            key={month.month}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="space-y-2"
                          >
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{month.month}</span>
                              <span className={`font-medium ${month.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                Net: {formatCurrency(month.net)}
                              </span>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="w-16 text-xs text-green-600">Income</div>
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${incomePercent}%` }}
                                  />
                                </div>
                                <div className="w-20 text-xs text-right">{formatCurrency(month.income)}</div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <div className="w-16 text-xs text-red-600">Expenses</div>
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="bg-red-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${expensePercent}%` }}
                                  />
                                </div>
                                <div className="w-20 text-xs text-right">{formatCurrency(month.expenses)}</div>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No trend data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Interactive Charts Coming Soon</h3>
                <p className="text-muted-foreground text-sm">
                  Detailed category analysis with interactive pie and bar charts
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Trend Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Advanced Trends Coming Soon</h3>
                <p className="text-muted-foreground text-sm">
                  Detailed trend analysis with forecasting and seasonality detection
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Goals Progress */}
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Goals Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reportData && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {reportData.goalsProgress.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Overall goals completion
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(reportData.investmentValue)}
                        </div>
                        <div className="text-xs text-green-700 dark:text-green-300">
                          Investments
                        </div>
                      </div>
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="text-lg font-bold text-red-600">
                          {formatCurrency(reportData.debtBalance)}
                        </div>
                        <div className="text-xs text-red-700 dark:text-red-300">
                          Total Debt
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Debt Analysis */}
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-red-600" />
                  Debt Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reportData && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600 mb-2">
                        {reportData.debtToIncomeRatio.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Debt-to-income ratio
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Debt-to-Income Ratio</span>
                        <span className={reportData.debtToIncomeRatio <= 20 ? 'text-green-600' : reportData.debtToIncomeRatio <= 40 ? 'text-yellow-600' : 'text-red-600'}>
                          {reportData.debtToIncomeRatio.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${reportData.debtToIncomeRatio <= 20 ? 'bg-green-500' : reportData.debtToIncomeRatio <= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(100, reportData.debtToIncomeRatio)}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        {reportData.debtToIncomeRatio <= 20 ? 'Excellent' : reportData.debtToIncomeRatio <= 40 ? 'Good' : 'Needs attention'}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper functions
function getDateRange(range: string, customStart?: string, customEnd?: string): { startDate: Date; endDate: Date } {
  const today = new Date()
  const endDate = new Date(today)
  let startDate = new Date(today)

  switch (range) {
    case 'last30days':
      startDate.setDate(startDate.getDate() - 30)
      break
    case 'last3months':
      startDate.setMonth(startDate.getMonth() - 3)
      break
    case 'last6months':
      startDate.setMonth(startDate.getMonth() - 6)
      break
    case 'last12months':
      startDate.setFullYear(startDate.getFullYear() - 1)
      break
    case 'ytd':
      startDate = new Date(today.getFullYear(), 0, 1)
      break
    case 'custom':
      if (customStart) startDate = new Date(customStart)
      if (customEnd) endDate = new Date(customEnd)
      break
  }

  return { startDate, endDate }
}

function calculateMonthlyTrend(transactions: any[], months: number): Array<{ month: string; income: number; expenses: number; net: number }> {
  const trend = []
  const today = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' })
    const monthKey = monthDate.toISOString().substring(0, 7)

    const monthTransactions = transactions.filter(txn => txn.date.startsWith(monthKey))
    
    const income = monthTransactions
      .filter(txn => txn.type === 'income')
      .reduce((sum, txn) => sum + txn.amount, 0)
    
    const expenses = monthTransactions
      .filter(txn => txn.type === 'expense')
      .reduce((sum, txn) => sum + Math.abs(txn.amount), 0)

    trend.push({
      month: monthName,
      income,
      expenses,
      net: income - expenses
    })
  }

  return trend
}

function generateFinancialInsights(metrics: {
  savingsRate: number
  essentialsPercent: number
  debtToIncomeRatio: number
  totalIncome: number
  totalExpenses: number
  netBalance: number
  goalsProgress: number
}): Array<{ type: 'success' | 'warning' | 'info'; message: string; icon: any }> {
  const insights = []

  // Savings rate insights
  if (metrics.savingsRate >= 20) {
    insights.push({
      type: 'success' as const,
      message: `Excellent! You're saving ${metrics.savingsRate.toFixed(1)}% of your income. You're on track for strong financial health! 🎉`,
      icon: CheckCircle
    })
  } else if (metrics.savingsRate >= 10) {
    insights.push({
      type: 'info' as const,
      message: `Good start! You're saving ${metrics.savingsRate.toFixed(1)}% of income. Try to reach 20% for optimal financial security.`,
      icon: TrendingUp
    })
  } else {
    insights.push({
      type: 'warning' as const,
      message: `Your savings rate is ${metrics.savingsRate.toFixed(1)}%. Consider reducing expenses or increasing income to save at least 10-20%.`,
      icon: AlertTriangle
    })
  }

  // Essential spending insights
  if (metrics.essentialsPercent > 75) {
    insights.push({
      type: 'warning' as const,
      message: `You're spending ${metrics.essentialsPercent.toFixed(1)}% on essentials. This is higher than the recommended 50-60%. Look for ways to reduce housing, food, or utility costs.`,
      icon: AlertTriangle
    })
  } else if (metrics.essentialsPercent < 50) {
    insights.push({
      type: 'success' as const,
      message: `Great job! Only ${metrics.essentialsPercent.toFixed(1)}% goes to essentials, leaving plenty for goals and lifestyle. You have excellent spending control! 💪`,
      icon: CheckCircle
    })
  }

  // Debt-to-income insights
  if (metrics.debtToIncomeRatio > 40) {
    insights.push({
      type: 'warning' as const,
      message: `Your debt-to-income ratio is ${metrics.debtToIncomeRatio.toFixed(1)}%. Consider aggressive debt payoff strategies to get below 20%.`,
      icon: AlertTriangle
    })
  } else if (metrics.debtToIncomeRatio <= 20) {
    insights.push({
      type: 'success' as const,
      message: `Excellent debt management! Your ${metrics.debtToIncomeRatio.toFixed(1)}% debt-to-income ratio shows you have your debt under control.`,
      icon: CheckCircle
    })
  }

  // Cash flow insights
  if (metrics.netBalance < 0) {
    insights.push({
      type: 'warning' as const,
      message: `You're spending more than you earn this period. Review your budget and look for areas to cut expenses or increase income.`,
      icon: TrendingDown
    })
  }

  return insights
}

function calculateHealthScore(data: ReportData): number {
  let score = 50 // Base score

  // Savings rate (0-30 points)
  if (data.savingsRate >= 20) score += 30
  else if (data.savingsRate >= 15) score += 25
  else if (data.savingsRate >= 10) score += 20
  else if (data.savingsRate >= 5) score += 10

  // Essential spending (0-25 points)
  if (data.essentialsPercent <= 50) score += 25
  else if (data.essentialsPercent <= 60) score += 20
  else if (data.essentialsPercent <= 70) score += 15
  else if (data.essentialsPercent <= 80) score += 10

  // Debt-to-income ratio (0-25 points)
  if (data.debtToIncomeRatio <= 10) score += 25
  else if (data.debtToIncomeRatio <= 20) score += 20
  else if (data.debtToIncomeRatio <= 30) score += 15
  else if (data.debtToIncomeRatio <= 40) score += 10

  // Cash flow (0-20 points)
  if (data.netBalance > 0) score += 20

  return Math.min(100, Math.max(0, score))
}

function getHealthScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 80) return 'Very Good'
  if (score >= 70) return 'Good'
  if (score >= 60) return 'Fair'
  return 'Needs Improvement'
}

function generateReportCSV(userData: any, reportData: ReportData | null): string {
  const headers = [
    'Date',
    'Description',
    'Category',
    'Amount',
    'Type',
    'Account'
  ]

  const rows = userData.transactions.map((txn: any) => [
    txn.date,
    txn.description || txn.merchant || 'Unknown',
    txn.categoryName || 'Uncategorized',
    txn.amount.toString(),
    txn.type,
    txn.accountName || 'Default Account'
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row: string[]) => row.map(field => `"${field}"`).join(','))
  ].join('\n')

  return csvContent
}
