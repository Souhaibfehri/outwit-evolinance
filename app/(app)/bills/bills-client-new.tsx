'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SummaryCard } from '@/components/ui/summary-card'
import { 
  Plus, 
  Calendar, 
  CreditCard, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  DollarSign,
  Zap,
  Link as LinkIcon
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
import { BillKPIs, BillListItem } from '@/lib/types/bills'
import { getBillStatusColor } from '@/lib/bill-scheduler'

export function BillsClientNew() {
  const [bills, setBills] = useState<BillListItem[]>([])
  const [kpis, setKpis] = useState<BillKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPayModal, setShowPayModal] = useState<string | null>(null)

  useEffect(() => {
    fetchBills()
  }, [])

  const fetchBills = async () => {
    try {
      const response = await fetch('/api/bills?kpis=true')
      const data = await response.json()
      
      if (response.ok) {
        setBills(data.bills)
        setKpis(data.kpis)
      } else {
        toast.error('Failed to load bills')
      }
    } catch (error) {
      console.error('Error fetching bills:', error)
      toast.error('Failed to load bills')
    } finally {
      setLoading(false)
    }
  }

  const handlePayBill = async (billId: string, amount?: number) => {
    try {
      const response = await fetch(`/api/bills/${billId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billId,
          amount,
          markAsPaid: true
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success(data.message)
        fetchBills() // Refresh the list
      } else {
        toast.error(data.error || 'Failed to pay bill')
      }
    } catch (error) {
      console.error('Error paying bill:', error)
      toast.error('Failed to pay bill')
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

  const formatDueDate = (daysUntilDue: number) => {
    if (daysUntilDue < 0) return `${Math.abs(daysUntilDue)} days overdue`
    if (daysUntilDue === 0) return 'Due today'
    if (daysUntilDue === 1) return 'Due tomorrow'
    return `Due in ${daysUntilDue} days`
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
        
        {/* List Skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-1 h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div>
                      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bills</h1>
          <p className="text-muted-foreground">
            Manage your recurring expenses and never miss a payment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Zap className="h-4 w-4 mr-2" />
            Quick Catch-Up
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Bill
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid gap-4 md:grid-cols-4" data-testid="bills-kpis">
          <SummaryCard
            title="Upcoming Bills"
            value={kpis.upcomingCount}
            subtitle="Due in next 30 days"
            icon={Calendar}
          />
          <SummaryCard
            title="Overdue Bills"
            value={kpis.overdueCount}
            subtitle="Need immediate attention"
            icon={AlertTriangle}
            className={kpis.overdueCount > 0 ? "border-red-200 bg-red-50 dark:bg-red-950/20" : ""}
          />
          <SummaryCard
            title="This Month Total"
            value={formatCurrency(kpis.thisMonthTotal)}
            subtitle="Total bills due this month"
            icon={DollarSign}
          />
          <SummaryCard
            title="Auto-pay Bills"
            value={kpis.autopayCount}
            subtitle="Set on auto-payment"
            icon={CheckCircle}
          />
        </div>
      )}

      {/* Bills List */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Bills</CardTitle>
            <Badge variant="outline">
              {bills.length} bill{bills.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {bills.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No bills yet</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Add your first recurring bill to get started
              </p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Bill
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {bills.map((bill) => {
                const statusColors = getBillStatusColor(bill.status)
                
                return (
                  <motion.div
                    key={bill.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border-l-4 ${statusColors.stripe} bg-white dark:bg-gray-800/50 hover:shadow-md transition-all duration-200`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-lg">{bill.name}</h4>
                          {bill.autopayEnabled && (
                            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 text-xs">
                              Auto-pay
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            <LinkIcon className="h-3 w-3 mr-1" />
                            {bill.categoryName}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium text-lg text-gray-900 dark:text-white">
                            {formatCurrency(bill.amount)}
                          </span>
                          <span>{bill.frequencyDisplay}</span>
                          <span className={statusColors.text}>
                            {formatDueDate(bill.daysUntilDue)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {bill.canPay && (
                          <Button
                            size="sm"
                            onClick={() => handlePayBill(bill.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Pay Now
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
                              Edit Bill
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Calendar className="h-4 w-4 mr-2" />
                              View Schedule
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Bill
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
    </div>
  )
}
