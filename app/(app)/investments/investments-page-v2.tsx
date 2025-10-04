'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SummaryCard } from '@/components/ui/summary-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  Plus, 
  MoreHorizontal,
  DollarSign,
  Calendar,
  Target,
  Edit,
  Trash2,
  Repeat,
  BarChart3,
  Calculator,
  PiggyBank,
  Zap
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { 
  InvestmentAccountWithDetails, 
  InvestmentKPIs, 
  ProjectionResult,
  getInvestmentTypeLabel,
  getInvestmentTypeIcon,
  calculateSIP,
  calculateTargetDelta
} from '@/lib/types/investments'
import { AddInvestmentAccountModal } from '@/components/investments/add-investment-account-modal'
import { EditInvestmentAccountModal } from '@/components/investments/edit-investment-account-modal'
import { ContributeToInvestmentModal } from '@/components/investments/contribute-to-investment-modal'
import { RecordValueModal } from '@/components/investments/record-value-modal'
import { InvestmentPlansTab } from '@/components/investments/investment-plans-tab'
import { ProjectionsTab } from '@/components/investments/projections-tab'

export function InvestmentsPageV2() {
  const [accounts, setAccounts] = useState<InvestmentAccountWithDetails[]>([])
  const [kpis, setKpis] = useState<InvestmentKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Modal states
  const [showAddAccountModal, setShowAddAccountModal] = useState(false)
  const [showEditAccountModal, setShowEditAccountModal] = useState<string | null>(null)
  const [showContributeModal, setShowContributeModal] = useState<string | null>(null)
  const [showValueModal, setShowValueModal] = useState<string | null>(null)

  useEffect(() => {
    fetchInvestmentAccounts()
  }, [])

  const fetchInvestmentAccounts = async () => {
    try {
      const response = await fetch('/api/investments/accounts?kpis=true&details=true')
      const data = await response.json()
      
      if (response.ok) {
        setAccounts(data.accounts || [])
        setKpis(data.kpis)
      } else {
        toast.error('Failed to load investment accounts')
      }
    } catch (error) {
      console.error('Error fetching investment accounts:', error)
      toast.error('Failed to load investment accounts')
    } finally {
      setLoading(false)
    }
  }

  const handleContribute = async (accountId: string, amount: number, source: any, accountSourceId?: string, note?: string) => {
    try {
      const response = await fetch('/api/investments/contribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          amount,
          source,
          accountSourceId,
          note
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'Contribution recorded successfully!')
        fetchInvestmentAccounts()
        setShowContributeModal(null)
      } else {
        toast.error(data.error || 'Failed to record contribution')
      }
    } catch (error) {
      console.error('Error contributing to investment:', error)
      toast.error('Failed to record contribution')
    }
  }

  const handleRecordValue = async (accountId: string, value: number, asOf: string) => {
    try {
      const response = await fetch('/api/investments/value-snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          value,
          asOf
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Market value recorded successfully!')
        fetchInvestmentAccounts()
        setShowValueModal(null)
      } else {
        toast.error(data.error || 'Failed to record market value')
      }
    } catch (error) {
      console.error('Error recording market value:', error)
      toast.error('Failed to record market value')
    }
  }

  const handleDeleteAccount = async (accountId: string) => {
    try {
      const response = await fetch(`/api/investments/accounts/${accountId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Investment account deleted successfully')
        fetchInvestmentAccounts()
      } else {
        toast.error(data.error || 'Failed to delete investment account')
      }
    } catch (error) {
      console.error('Error deleting investment account:', error)
      toast.error('Failed to delete investment account')
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
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  if (loading) {
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
          <h1 className="text-3xl font-bold tracking-tight">Investments</h1>
          <p className="text-muted-foreground">
            Grow your wealth with systematic investing and projections
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={() => setShowAddAccountModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard
            title="This Month"
            value={formatCurrency(kpis.contributedThisMonth)}
            subtitle="Contributed"
            icon={Calendar}
            className="border-blue-200 bg-blue-50 dark:bg-blue-950/20"
          />
          <SummaryCard
            title="YTD Contributions"
            value={formatCurrency(kpis.ytdContributions)}
            subtitle="Year to date"
            icon={TrendingUp}
          />
          <SummaryCard
            title="Total Value"
            value={formatCurrency(kpis.totalCurrentValue)}
            subtitle={`${formatCurrency(kpis.totalContributed)} contributed`}
            icon={DollarSign}
            className="border-green-200 bg-green-50 dark:bg-green-950/20"
          />
          <SummaryCard
            title="5-Year Projection"
            value={formatCurrency(kpis.projectedFiveYear)}
            subtitle={`${kpis.averageAPR}% avg return`}
            icon={Target}
          />
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Recurring Plans</TabsTrigger>
          <TabsTrigger value="projections">Projections</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Investment Accounts */}
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Investment Accounts</CardTitle>
                <Badge variant="outline">
                  {accounts.length} account{accounts.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {accounts.length === 0 ? (
                <div className="text-center py-12">
                  <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No investment accounts</h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    Add your investment accounts to track contributions and growth
                  </p>
                  <Button onClick={() => setShowAddAccountModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Account
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {accounts.map((account, index) => {
                    const typeIcon = getInvestmentTypeIcon(account.type)
                    const totalReturn = account.currentValue ? account.currentValue - account.totalContributed : 0
                    const returnPercent = account.totalContributed > 0 ? (totalReturn / account.totalContributed) * 100 : 0
                    
                    return (
                      <motion.div
                        key={account.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="p-4 rounded-lg border bg-white dark:bg-gray-800/50 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{typeIcon}</div>
                            <div>
                              <h4 className="font-semibold text-lg">{account.name}</h4>
                              <Badge variant="outline" className="text-xs mt-1">
                                {getInvestmentTypeLabel(account.type)}
                              </Badge>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setShowContributeModal(account.id)}>
                                <DollarSign className="h-4 w-4 mr-2" />
                                Contribute
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Repeat className="h-4 w-4 mr-2" />
                                Make Recurring
                              </DropdownMenuItem>
                              {account.trackHoldings && (
                                <DropdownMenuItem onClick={() => setShowValueModal(account.id)}>
                                  <BarChart3 className="h-4 w-4 mr-2" />
                                  Record Value
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setShowEditAccountModal(account.id)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Account
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteAccount(account.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Account
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Account Metrics */}
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-gray-600 dark:text-gray-400">Current Value</div>
                              <div className="text-xl font-bold">
                                {account.currentValue ? formatCurrency(account.currentValue) : 'Not tracked'}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-600 dark:text-gray-400">Total Contributed</div>
                              <div className="text-xl font-bold">
                                {formatCurrency(account.totalContributed)}
                              </div>
                            </div>
                          </div>

                          {account.currentValue && account.totalContributed > 0 && (
                            <div>
                              <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-gray-600 dark:text-gray-400">Total Return</span>
                                <span className={`font-medium ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatCurrency(totalReturn)} ({formatPercent(returnPercent)})
                                </span>
                              </div>
                              <Progress 
                                value={Math.min(100, Math.max(0, 50 + returnPercent))} 
                                className="h-2"
                              />
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-gray-600 dark:text-gray-400">This Month</div>
                              <div className="font-medium">
                                {formatCurrency(account.monthlyContributions)}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-600 dark:text-gray-400">YTD</div>
                              <div className="font-medium">
                                {formatCurrency(account.ytdContributions)}
                              </div>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex gap-2 pt-2 border-t">
                            <Button 
                              size="sm" 
                              onClick={() => setShowContributeModal(account.id)}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Contribute
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                            >
                              <Calculator className="h-4 w-4 mr-1" />
                              Project
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick SIP Calculator */}
          {accounts.length > 0 && (
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-green-600" />
                  Quick Investment Calculator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuickSIPCalculator />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="plans">
          <InvestmentPlansTab accounts={accounts} onRefresh={fetchInvestmentAccounts} />
        </TabsContent>

        <TabsContent value="projections">
          <ProjectionsTab accounts={accounts} />
        </TabsContent>

        <TabsContent value="performance">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Performance Tracking Coming Soon</h3>
                <p className="text-muted-foreground text-sm">
                  Detailed performance analytics and portfolio insights
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddInvestmentAccountModal
        isOpen={showAddAccountModal}
        onClose={() => setShowAddAccountModal(false)}
        onSuccess={() => {
          setShowAddAccountModal(false)
          fetchInvestmentAccounts()
        }}
      />

      {showEditAccountModal && (
        <EditInvestmentAccountModal
          isOpen={!!showEditAccountModal}
          onClose={() => setShowEditAccountModal(null)}
          accountId={showEditAccountModal}
          onSuccess={() => {
            setShowEditAccountModal(null)
            fetchInvestmentAccounts()
          }}
        />
      )}

      {showContributeModal && (
        <ContributeToInvestmentModal
          isOpen={!!showContributeModal}
          onClose={() => setShowContributeModal(null)}
          account={accounts.find(a => a.id === showContributeModal)}
          onSuccess={handleContribute}
        />
      )}

      {showValueModal && (
        <RecordValueModal
          isOpen={!!showValueModal}
          onClose={() => setShowValueModal(null)}
          account={accounts.find(a => a.id === showValueModal)}
          onSuccess={handleRecordValue}
        />
      )}
    </div>
  )
}

// Quick SIP Calculator Component
function QuickSIPCalculator() {
  const [monthlyAmount, setMonthlyAmount] = useState(500)
  const [years, setYears] = useState(10)
  const [apr, setApr] = useState(7)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    if (monthlyAmount > 0 && years > 0 && apr >= 0) {
      const calculation = calculateSIP(monthlyAmount, apr, years)
      setResult(calculation)
    }
  }, [monthlyAmount, years, apr])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Calculate impact of adding $25 more
  const deltaResult = calculateTargetDelta(monthlyAmount, 25, 100000, apr)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-sm font-medium">Monthly Investment</Label>
          <div className="relative mt-1">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="number"
              min="0"
              step="25"
              value={monthlyAmount}
              onChange={(e) => setMonthlyAmount(parseFloat(e.target.value) || 0)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div>
          <Label className="text-sm font-medium">Time Horizon</Label>
          <div className="mt-1">
            <input
              type="number"
              min="1"
              max="50"
              value={years}
              onChange={(e) => setYears(parseFloat(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div>
          <Label className="text-sm font-medium">Expected Return (%)</Label>
          <div className="mt-1">
            <input
              type="number"
              min="0"
              max="20"
              step="0.5"
              value={apr}
              onChange={(e) => setApr(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(result.futureValue)}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">
              Future Value
            </div>
          </div>
          
          <div className="text-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(result.totalContributions)}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              Total Invested
            </div>
          </div>
          
          <div className="text-center p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(result.totalGrowth)}
            </div>
            <div className="text-sm text-purple-700 dark:text-purple-300">
              Growth
            </div>
          </div>
        </div>
      )}

      {deltaResult.monthsSaved > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
            💡 Quick Tip: Add $25/month
          </div>
          <div className="text-xs text-yellow-700 dark:text-yellow-300">
            Reach $100k {deltaResult.monthsSaved} months sooner ({deltaResult.yearsSaved.toFixed(1)} years)
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 text-center">
        <p>* Projections are hypothetical and not guaranteed. Past performance doesn't predict future results.</p>
      </div>
    </div>
  )
}
