'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MoreHorizontal, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Calendar,
  DollarSign,
  Repeat
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { InfoHint, FINANCIAL_EXPLANATIONS } from '@/components/ui/info-hint'
import { PayBillModal } from './pay-bill-modal'

interface Bill {
  id: string
  name: string
  amount: number
  categoryName: string
  accountName: string
  nextDue: string
  lastPaid?: string
  active: boolean
  recurrence?: {
    frequency: string
    interval: number
  }
}

export function BillsList() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'dueDate' | 'amount' | 'name'>('dueDate')
  const [filterBy, setFilterBy] = useState<'all' | 'upcoming' | 'overdue'>('all')

  useEffect(() => {
    async function fetchBills() {
      try {
        const response = await fetch('/api/bills')
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setBills(result.bills)
          }
        }
      } catch (error) {
        console.error('Error fetching bills:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBills()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getDaysUntil = (dueDateString: string) => {
    const dueDate = new Date(dueDateString)
    const today = new Date()
    const diffTime = dueDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const formatDaysUntil = (days: number) => {
    if (days < 0) return `${Math.abs(days)} days overdue`
    if (days === 0) return 'Due today'
    if (days === 1) return 'Due tomorrow'
    return `Due in ${days} days`
  }

  const getBillStatus = (bill: Bill) => {
    const days = getDaysUntil(bill.nextDue)
    if (days < 0) return 'overdue'
    if (days <= 3) return 'due-soon'
    return 'upcoming'
  }

  const getBillStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return 'text-red-600 bg-red-50 border-red-200'
      case 'due-soon': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-green-600 bg-green-50 border-green-200'
    }
  }

  const getBillStatusIcon = (status: string) => {
    switch (status) {
      case 'overdue': return AlertTriangle
      case 'due-soon': return Clock
      default: return Calendar
    }
  }

  const getFrequencyText = (recurrence: any) => {
    if (!recurrence) return 'One-time'
    
    const { frequency, interval = 1 } = recurrence
    const intervalText = interval > 1 ? `${interval} ` : ''
    
    switch (frequency) {
      case 'weekly': return `Every ${intervalText}week${interval > 1 ? 's' : ''}`
      case 'bi-weekly': return 'Bi-weekly'
      case 'monthly': return `Every ${intervalText}month${interval > 1 ? 's' : ''}`
      case 'quarterly': return 'Quarterly'
      case 'annual': return 'Annually'
      default: return frequency
    }
  }

  // Filter and sort bills
  const filteredBills = bills.filter(bill => {
    if (!bill.active) return false
    
    if (filterBy === 'all') return true
    
    const status = getBillStatus(bill)
    if (filterBy === 'upcoming') return status === 'upcoming'
    if (filterBy === 'overdue') return status === 'overdue'
    
    return true
  })

  const sortedBills = [...filteredBills].sort((a, b) => {
    switch (sortBy) {
      case 'dueDate':
        return new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime()
      case 'amount':
        return b.amount - a.amount
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

  if (loading) {
    return <BillsListSkeleton />
  }

  if (bills.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Bills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No bills yet</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Add your first recurring bill to track due dates and payments.
            </p>
            <Button>Add Your First Bill</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Your Bills
            <InfoHint
              title="Bill Management"
              content="Track recurring bills and mark them as paid to create transactions automatically. Bills with recurrence will calculate the next due date for you."
            />
          </CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as any)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="all">All Bills</option>
              <option value="upcoming">Upcoming</option>
              <option value="overdue">Overdue</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="dueDate">Sort by Due Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedBills.map((bill) => {
            const status = getBillStatus(bill)
            const StatusIcon = getBillStatusIcon(status)
            const days = getDaysUntil(bill.nextDue)
            
            return (
              <div
                key={bill.id}
                className={cn(
                  'flex items-center justify-between p-4 rounded-lg border transition-colors hover:bg-muted/50',
                  getBillStatusColor(status)
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background border">
                    <StatusIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{bill.name}</h4>
                      {bill.recurrence && (
                        <Badge variant="outline" className="text-xs">
                          <Repeat className="h-3 w-3 mr-1" />
                          {getFrequencyText(bill.recurrence)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{bill.categoryName}</span>
                      <span>•</span>
                      <span>{formatDate(bill.nextDue)}</span>
                      <span>•</span>
                      <span>{formatDaysUntil(days)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(bill.amount)}</p>
                    <p className="text-xs text-muted-foreground">{bill.accountName}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <PayBillModal bill={bill} onPaid={() => window.location.reload()}>
                      <Button size="sm" variant={status === 'overdue' ? 'destructive' : 'default'}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Pay
                      </Button>
                    </PayBillModal>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit Bill</DropdownMenuItem>
                        <DropdownMenuItem>View History</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          Delete Bill
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {sortedBills.length === 0 && filterBy !== 'all' && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No {filterBy} bills found.
            </p>
            <Button
              variant="link"
              size="sm"
              onClick={() => setFilterBy('all')}
              className="mt-2"
            >
              Show all bills
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function BillsListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                <div>
                  <div className="h-4 w-32 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="h-4 w-16 bg-muted rounded animate-pulse mb-1" />
                  <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                <div className="h-8 w-8 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
