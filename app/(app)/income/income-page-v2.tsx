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
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Plus, 
  MoreHorizontal,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  Trash2,
  Zap,
  Target,
  AlertTriangle,
  Repeat
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
  IncomeSourceWithOccurrences, 
  IncomeKPIs, 
  IncomeOccurrence,
  getIncomeTypeLabel,
  getPayScheduleLabel,
  getStatusColor
} from '@/lib/types/income'
import { AddIncomeSourceModal } from '@/components/income/add-income-source-modal'
import { EditIncomeSourceModal } from '@/components/income/edit-income-source-modal'
import { ReceiveIncomeModal } from '@/components/income/receive-income-modal'
import { OneOffIncomeModal } from '@/components/income/one-off-income-modal'
import { QuickCatchUpModal } from '@/components/income/quick-catch-up-modal'
import { AllocationTemplatesTab } from '@/components/income/allocation-templates-tab'

export function IncomePageV2() {
  const [sources, setSources] = useState<IncomeSourceWithOccurrences[]>([])
  const [kpis, setKpis] = useState<IncomeKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState<string | null>(null)
  const [showReceiveModal, setShowReceiveModal] = useState<string | null>(null)
  const [showOneOffModal, setShowOneOffModal] = useState(false)
  const [showCatchUpModal, setShowCatchUpModal] = useState(false)

  useEffect(() => {
    fetchIncomeSources()
  }, [])

  const fetchIncomeSources = async () => {
    try {
      const response = await fetch('/api/income/sources?kpis=true&occurrences=true')
      const data = await response.json()
      
      if (response.ok) {
        setSources(data.sources || [])
        setKpis(data.kpis)
      } else {
        toast.error('Failed to load income sources')
      }
    } catch (error) {
      console.error('Error fetching income sources:', error)
      toast.error('Failed to load income sources')
    } finally {
      setLoading(false)
    }
  }

  const handleReceiveIncome = async (occurrenceId: string, amount: number, accountId: string, budgetMonth: 'current' | 'next', note?: string) => {
    try {
      const response = await fetch(`/api/income/occurrences/${occurrenceId}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occurrenceId,
          amount,
          accountId,
          budgetMonth,
          note
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'Income received successfully!')
        fetchIncomeSources()
        setShowReceiveModal(null)
      } else {
        toast.error(data.error || 'Failed to receive income')
      }
    } catch (error) {
      console.error('Error receiving income:', error)
      toast.error('Failed to receive income')
    }
  }

  const handleSkipIncome = async (occurrenceId: string) => {
    try {
      const response = await fetch(`/api/income/occurrences/${occurrenceId}/skip`, {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Income marked as skipped')
        fetchIncomeSources()
      } else {
        toast.error(data.error || 'Failed to skip income')
      }
    } catch (error) {
      console.error('Error skipping income:', error)
      toast.error('Failed to skip income')
    }
  }

  const handleDeleteSource = async (sourceId: string) => {
    try {
      const response = await fetch(`/api/income/sources/${sourceId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Income source deleted successfully')
        fetchIncomeSources()
      } else {
        toast.error(data.error || 'Failed to delete income source')
      }
    } catch (error) {
      console.error('Error deleting income source:', error)
      toast.error('Failed to delete income source')
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RECEIVED': return CheckCircle
      case 'SCHEDULED': return Clock
      case 'SKIPPED': return XCircle
      default: return Clock
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
          <h1 className="text-3xl font-bold tracking-tight">Income</h1>
          <p className="text-muted-foreground">
            Track your income sources and manage pay schedules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowCatchUpModal(true)}>
            <Zap className="h-4 w-4 mr-2" />
            Quick Catch-Up
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowOneOffModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            One-Off Income
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Source
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard
            title="Next Pay"
            value={kpis.nextPay ? formatCurrency(kpis.nextPay.amount) : 'None scheduled'}
            subtitle={kpis.nextPay ? `${kpis.nextPay.sourceName} • ${formatDate(kpis.nextPay.date)}` : 'No upcoming payments'}
            icon={Calendar}
            className={kpis.nextPay ? "border-green-200 bg-green-50 dark:bg-green-950/20" : ""}
          />
          <SummaryCard
            title="This Month Received"
            value={formatCurrency(kpis.thisMonthReceived)}
            subtitle={`of ${formatCurrency(kpis.thisMonthScheduled)} scheduled`}
            icon={CheckCircle}
          />
          <SummaryCard
            title="Monthly Average"
            value={formatCurrency(kpis.averageMonthly)}
            subtitle={`Variance: ${kpis.variance >= 0 ? '+' : ''}${formatCurrency(kpis.variance)}`}
            icon={TrendingUp}
            className={kpis.variance < 0 ? "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20" : ""}
          />
          <SummaryCard
            title="YTD Received"
            value={formatCurrency(kpis.ytdReceived)}
            subtitle={`${kpis.upcomingCount} upcoming`}
            icon={DollarSign}
          />
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="templates">Allocation Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Income Sources */}
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Income Sources</CardTitle>
                <Badge variant="outline">
                  {sources.length} source{sources.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {sources.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No income sources</h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    Add your income sources to track payments and budget allocation
                  </p>
                  <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Source
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sources.map((source, index) => (
                    <motion.div
                      key={source.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="p-4 rounded-lg border bg-white dark:bg-gray-800/50 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-lg">{source.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {getIncomeTypeLabel(source.type)}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {getPayScheduleLabel(source.paySchedule)}
                            </Badge>
                            {source.isVariable && (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                                Variable
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-gray-600 dark:text-gray-400">Expected Amount</div>
                              <div className="font-medium">
                                {source.calculatedNet ? formatCurrency(source.calculatedNet) : 'TBD'}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-600 dark:text-gray-400">Next Pay</div>
                              <div className="font-medium">
                                {source.nextPayDate ? formatDate(source.nextPayDate) : 'Not scheduled'}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-600 dark:text-gray-400">Monthly Average</div>
                              <div className="font-medium">
                                {source.averageMonthly ? formatCurrency(source.averageMonthly) : 'N/A'}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-600 dark:text-gray-400">Autopost</div>
                              <div className="font-medium">
                                {source.autopost ? (
                                  <span className="text-green-600">Enabled</span>
                                ) : (
                                  <span className="text-gray-500">Disabled</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setShowEditModal(source.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Source
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Repeat className="h-4 w-4 mr-2" />
                              View Schedule
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteSource(source.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Source
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          {/* Upcoming and Recent Income */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Upcoming Income */}
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Upcoming Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sources.flatMap(source => source.upcomingOccurrences).length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">
                      No upcoming income scheduled
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sources.flatMap(source => 
                      source.upcomingOccurrences.slice(0, 5).map(occurrence => {
                        const StatusIcon = getStatusIcon(occurrence.status)
                        
                        return (
                          <div 
                            key={occurrence.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          >
                            <div className="flex items-center gap-3">
                              <StatusIcon className={`h-4 w-4 ${occurrence.status === 'SCHEDULED' ? 'text-blue-600' : 'text-gray-400'}`} />
                              <div>
                                <div className="font-medium">
                                  {sources.find(s => s.id === occurrence.sourceId)?.name}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatDate(occurrence.scheduledAt)}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div className="font-medium">
                                  {formatCurrency(occurrence.net)}
                                </div>
                                <Badge className={`text-xs ${getStatusColor(occurrence.status)}`}>
                                  {occurrence.status}
                                </Badge>
                              </div>
                              
                              {occurrence.status === 'SCHEDULED' && (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowReceiveModal(occurrence.id)}
                                  >
                                    Receive
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleSkipIncome(occurrence.id)}
                                  >
                                    Skip
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Income */}
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Recent Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sources.flatMap(source => source.recentOccurrences).length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">
                      No recent income recorded
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sources.flatMap(source => source.recentOccurrences)
                      .sort((a, b) => new Date(b.postedAt || b.scheduledAt).getTime() - new Date(a.postedAt || a.scheduledAt).getTime())
                      .slice(0, 5)
                      .map(occurrence => {
                        const StatusIcon = getStatusIcon(occurrence.status)
                        
                        return (
                          <div 
                            key={occurrence.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <StatusIcon className={`h-4 w-4 ${occurrence.status === 'RECEIVED' ? 'text-green-600' : 'text-gray-400'}`} />
                              <div>
                                <div className="font-medium">
                                  {sources.find(s => s.id === occurrence.sourceId)?.name}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatDate(occurrence.postedAt || occurrence.scheduledAt)}
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="font-medium text-green-600">
                                {formatCurrency(occurrence.net)}
                              </div>
                              <Badge className={`text-xs ${getStatusColor(occurrence.status)}`}>
                                {occurrence.status}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <AllocationTemplatesTab onRefresh={fetchIncomeSources} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddIncomeSourceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false)
          fetchIncomeSources()
        }}
      />

      {showEditModal && (
        <EditIncomeSourceModal
          isOpen={!!showEditModal}
          onClose={() => setShowEditModal(null)}
          sourceId={showEditModal}
          onSuccess={() => {
            setShowEditModal(null)
            fetchIncomeSources()
          }}
        />
      )}

      {showReceiveModal && (
        <ReceiveIncomeModal
          isOpen={!!showReceiveModal}
          onClose={() => setShowReceiveModal(null)}
          occurrenceId={showReceiveModal}
          occurrence={sources.flatMap(s => s.upcomingOccurrences).find(o => o.id === showReceiveModal)}
          onSuccess={handleReceiveIncome}
        />
      )}

      <OneOffIncomeModal
        isOpen={showOneOffModal}
        onClose={() => setShowOneOffModal(false)}
        onSuccess={() => {
          setShowOneOffModal(false)
          fetchIncomeSources()
        }}
      />

      <QuickCatchUpModal
        isOpen={showCatchUpModal}
        onClose={() => setShowCatchUpModal(false)}
        sources={sources}
        onSuccess={() => {
          setShowCatchUpModal(false)
          fetchIncomeSources()
        }}
      />
    </div>
  )
}
