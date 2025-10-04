'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalendarBill {
  id: string
  name: string
  amount: number
  nextDue: string
  status: 'overdue' | 'due-today' | 'upcoming'
}

export function BillsCalendar() {
  const [bills, setBills] = useState<CalendarBill[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    async function fetchCalendarBills() {
      try {
        // Mock data for now - would fetch from /api/bills/calendar
        const mockBills: CalendarBill[] = [
          {
            id: '1',
            name: 'Rent',
            amount: 1200,
            nextDue: new Date(2024, 11, 1).toISOString(),
            status: 'upcoming'
          },
          {
            id: '2',
            name: 'Electric Bill',
            amount: 85,
            nextDue: new Date().toISOString(),
            status: 'due-today'
          },
          {
            id: '3',
            name: 'Internet',
            amount: 60,
            nextDue: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'overdue'
          },
          {
            id: '4',
            name: 'Netflix',
            amount: 15,
            nextDue: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'upcoming'
          },
          {
            id: '5',
            name: 'Car Payment',
            amount: 350,
            nextDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'upcoming'
          }
        ]

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        setBills(mockBills)
      } catch (error) {
        console.error('Error fetching calendar bills:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCalendarBills()
  }, [currentDate])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    }
    
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days ago`
    }
    if (diffDays <= 7) {
      return `In ${diffDays} days`
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'bg-red-500'
      case 'due-today':
        return 'bg-yellow-500'
      default:
        return 'bg-green-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overdue':
        return AlertTriangle
      case 'due-today':
        return Clock
      default:
        return Calendar
    }
  }

  // Get next 30 days of bills
  const upcomingBills = bills
    .filter(bill => {
      const dueDate = new Date(bill.nextDue)
      const today = new Date()
      const thirtyDaysFromNow = new Date(today)
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      
      return dueDate <= thirtyDaysFromNow
    })
    .sort((a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime())

  if (loading) {
    return <BillsCalendarSkeleton />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Bills
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingBills.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No upcoming bills</h3>
            <p className="text-muted-foreground text-sm">
              All bills are paid or no bills scheduled for the next 30 days.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingBills.map((bill) => {
              const StatusIcon = getStatusIcon(bill.status)
              
              return (
                <div
                  key={bill.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className={cn(
                        'w-2 h-2 rounded-full absolute -top-1 -right-1 z-10',
                        getStatusColor(bill.status)
                      )} />
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <StatusIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{bill.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(bill.nextDue)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{formatCurrency(bill.amount)}</p>
                    <Badge 
                      variant={
                        bill.status === 'overdue' 
                          ? 'destructive' 
                          : bill.status === 'due-today' 
                          ? 'secondary' 
                          : 'outline'
                      }
                      className="text-xs"
                    >
                      {bill.status === 'overdue' 
                        ? 'Overdue' 
                        : bill.status === 'due-today' 
                        ? 'Due Today' 
                        : 'Upcoming'}
                    </Badge>
                  </div>
                </div>
              )
            })}
            
            {upcomingBills.length > 7 && (
              <div className="pt-3 border-t">
                <Button variant="ghost" size="sm" className="w-full">
                  View All Bills
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function BillsCalendarSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                <div>
                  <div className="h-4 w-24 bg-muted rounded animate-pulse mb-1" />
                  <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                </div>
              </div>
              <div className="text-right">
                <div className="h-4 w-12 bg-muted rounded animate-pulse mb-1" />
                <div className="h-5 w-16 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
