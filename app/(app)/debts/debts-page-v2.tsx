'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SummaryCard } from '@/components/ui/summary-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CreditCard, 
  TrendingDown, 
  Calculator, 
  Plus, 
  MoreHorizontal,
  Edit,
  Trash2,
  Zap,
  AlertTriangle,
  Trophy,
  Target,
  DollarSign,
  Calendar,
  Percent,
  GraduationCap,
  Car,
  Home,
  FileText
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { DebtAccount, DebtKPIs, DebtListItem, PayoffSimulation } from '@/lib/types/debts'
import { DebtSimulator } from '@/components/debts/debt-simulator'
import { MakePaymentModal } from '@/components/debts/make-payment-modal'
import { getDebtStatus, calculateUtilization, getPromoInfo } from '@/lib/types/debts'

export function DebtsPageV2() {
  const [debts, setDebts] = useState<DebtListItem[]>([])
  const [kpis, setKpis] = useState<DebtKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showPayModal, setShowPayModal] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchDebts()
  }, [])

  const fetchDebts = async () => {
    try {
      const response = await fetch('/api/debts?kpis=true')
      const data = await response.json()
      
      if (response.ok) {
        setDebts(data.debts)
        setKpis(data.kpis)
      } else {
        toast.error('Failed to load debts')
      }
    } catch (error) {
      console.error('Error fetching debts:', error)
      toast.error('Failed to load debts')
    } finally {
      setLoading(false)
    }
  }

  const handlePayDebt = async (debtId: string, amount: number, accountId: string) => {
    try {
      const response = await fetch(`/api/debts/${debtId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debtId,
          amount,
          date: new Date().toISOString().split('T')[0],
          accountId,
          assignToMonth: 'current'
        })
      })

      const data = await response.json()

      if (response.ok) {
        if (data.paid_off) {
          // Show celebration for paid off debt
          toast.success(data.message, {
            duration: 5000,
            className: 'bg-green-50 border-green-200 text-green-800'
          })
        } else {
          toast.success(data.message)
        }
        
        fetchDebts() // Refresh data
        setShowPayModal(null)
      } else {
        toast.error(data.error || 'Failed to record payment')
      }
    } catch (error) {
      console.error('Error paying debt:', error)
      toast.error('Failed to record payment')
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

  const getDebtTypeIcon = (type: string) => {
    switch (type) {
      case 'credit_card': return CreditCard
      case 'student_loan': return GraduationCap
      case 'auto_loan': return Car
      case 'mortgage': return Home
      default: return FileText
    }
  }

  const getStatusColor = (status: DebtListItem['status']) => {
    switch (status) {
      case 'overdue': return 'border-l-red-500 bg-red-50 dark:bg-red-950/20'
      case 'autopay': return 'border-l-purple-500 bg-purple-50 dark:bg-purple-950/20'
      default: return 'border-l-gray-300 bg-white dark:bg-gray-800'
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Debts</h1>
          <p className="text-muted-foreground">
            Strategic debt elimination with personalized payoff plans
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calculator className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Debt
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid gap-4 md:grid-cols-4" data-testid="debt-kpis">
          <SummaryCard
            title="Total Debt"
            value={formatCurrency(kpis.totalDebt)}
            subtitle="All outstanding balances"
            icon={CreditCard}
            className={kpis.totalDebt > 0 ? "border-red-200 bg-red-50 dark:bg-red-950/20" : ""}
          />
          <SummaryCard
            title="Monthly Minimum"
            value={formatCurrency(kpis.monthlyMinimum)}
            subtitle="Required payments"
            icon={Calendar}
          />
          <SummaryCard
            title="Debt-Free Date"
            value={kpis.projectedDebtFreeDate || 'Not projected'}
            subtitle="At current pace"
            icon={Target}
          />
          <SummaryCard
            title="Credit Utilization"
            value={kpis.totalCreditUtilization ? `${kpis.totalCreditUtilization.toFixed(1)}%` : 'N/A'}
            subtitle="Credit cards usage"
            icon={Percent}
            className={kpis.totalCreditUtilization && kpis.totalCreditUtilization > 30 ? "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20" : ""}
          />
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Debt Overview</TabsTrigger>
          <TabsTrigger value="simulator">Payoff Simulator</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Debts List */}
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your Debts</CardTitle>
                <Badge variant="outline">
                  {debts.length} debt{debts.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {debts.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No debts tracked</h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    Add your debts to create a strategic payoff plan
                  </p>
                  <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Debt
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {debts.map((debt) => {
                    const TypeIcon = getDebtTypeIcon(debt.type)
                    const statusColor = getStatusColor(debt.status)
                    
                    return (
                      <motion.div
                        key={debt.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-lg border-l-4 ${statusColor} hover:shadow-md transition-all duration-200`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <TypeIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h4 className="font-semibold text-lg">{debt.name}</h4>
                                {debt.autopayEnabled && (
                                  <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 text-xs">
                                    Auto-pay
                                  </Badge>
                                )}
                                {debt.promoRate && (
                                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs">
                                    {debt.promoRate.rate}% till {new Date(debt.promoRate.endsOn).toLocaleDateString()}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium text-xl text-gray-900 dark:text-white">
                                  {formatCurrency(debt.balance)}
                                </span>
                                <span>{debt.apr}% APR</span>
                                <span>Min: {formatCurrency(debt.minPayment)}</span>
                                {debt.utilization && (
                                  <span className={debt.utilization > 30 ? 'text-yellow-600' : 'text-gray-600'}>
                                    {debt.utilization.toFixed(1)}% utilized
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {debt.canPay && (
                              <Button
                                size="sm"
                                onClick={() => setShowPayModal(debt.id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                Make Payment
                              </Button>
                            )}
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Debt
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Calculator className="h-4 w-4 mr-2" />
                                  View in Simulator
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Archive Debt
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Educational Section */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800" data-testid="debt-education">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-blue-600" />
                Debt Elimination Strategies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                    🏔️ Debt Avalanche
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Target highest interest rates first. Saves the most money overall.
                  </p>
                  <div className="text-xs text-blue-600 dark:text-blue-400 bg-white dark:bg-blue-950/30 p-2 rounded">
                    💡 Best for disciplined savers who want maximum interest savings
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-green-900 dark:text-green-100">
                    ⛄ Debt Snowball
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Target smallest balances first. Builds momentum with quick wins.
                  </p>
                  <div className="text-xs text-green-600 dark:text-green-400 bg-white dark:bg-green-950/30 p-2 rounded">
                    💡 Best for motivation-driven people who need early victories
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-blue-200 dark:border-blue-700">
                <Button 
                  onClick={() => setActiveTab('simulator')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Try Simulator with Your Debts
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulator" className="space-y-6">
          <DebtSimulator 
            debts={debts.map(debt => ({
              id: debt.id,
              userId: 'current',
              name: debt.name,
              type: debt.type as any,
              currency: 'USD',
              principalBalance: debt.balance,
              apr: debt.apr,
              minPayment: debt.minPayment,
              startDate: new Date().toISOString(),
              timezone: 'UTC',
              autopayEnabled: debt.autopayEnabled,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }))}
            onApplyPlan={(simulation) => {
              toast.success('Payoff plan applied! Check your budget for updated assignments.')
              setActiveTab('overview')
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Make Payment Modal */}
      {showPayModal && (
        <MakePaymentModal
          isOpen={!!showPayModal}
          onClose={() => setShowPayModal(null)}
          debtId={showPayModal}
          debt={debts.find(d => d.id === showPayModal)}
          onSuccess={(debtId, amount, accountId) => handlePayDebt(debtId, amount, accountId)}
        />
      )}
    </div>
  )
}
