'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight, Calendar, DollarSign, Receipt } from 'lucide-react'
import { formatCurrency } from '@/lib/budget/calcs'

type ForecastMonth = {
  month: string
  income: number
  totalAssigned: number
  totalSpent: number
  netCashFlow: number
}

interface IncomeSource {
  id: string
  name: string
  amount: number
  frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'annual'
  active: boolean
}

interface BillItem {
  id: string
  name: string
  amount: number
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'annual'
  autoPay: boolean
  status?: 'upcoming' | 'paid' | 'overdue'
}

export function DetailedForecast() {
  const [months, setMonths] = useState<ForecastMonth[]>([])
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([])
  const [bills, setBills] = useState<BillItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const load = async () => {
      try {
        const [fc, inc, bl] = await Promise.all([
          fetch('/api/forecast').then(r => r.json()).catch(() => ({ success: false })),
          fetch('/api/income/sources').then(r => r.json()).catch(() => ({ success: false })),
          fetch('/api/bills').then(r => r.json()).catch(() => ({ success: false }))
        ])

        if (fc?.success && Array.isArray(fc.forecast)) {
          // Keep next 12 months starting from current
          const current = getCurrentMonth()
          const future12 = fc.forecast
            .filter((m: any) => m.month >= current)
            .slice(0, 12)
            .map((m: any) => ({
              month: m.month,
              income: Number(m.income) || 0,
              totalAssigned: Number(m.totalAssigned) || 0,
              totalSpent: Number(m.totalSpent) || 0,
              netCashFlow: Number(m.netCashFlow) || 0
            }))
          setMonths(future12)
        }

        if (inc?.success && Array.isArray(inc.sources)) {
          setIncomeSources(inc.sources)
        }

        if (bl?.success && Array.isArray(bl.bills)) {
          setBills(bl.bills)
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const totals = useMemo(() => {
    return months.reduce(
      (acc, m) => {
        acc.income += m.income
        acc.expenses += m.totalSpent
        acc.net += m.netCashFlow
        return acc
      },
      { income: 0, expenses: 0, net: 0 }
    )
  }, [months])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            Month-by-Month Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">Month</th>
                  <th className="p-2 text-right">Income</th>
                  <th className="p-2 text-right">Expenses</th>
                  <th className="p-2 text-right">RTA</th>
                  <th className="p-2 text-right">Net Cash Flow</th>
                  <th className="p-2 text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                {months.map(m => {
                  const open = !!expanded[m.month]
                  const rta = m.income - m.totalAssigned
                  return (
                    <>
                      <tr key={m.month} className="border-b hover:bg-muted/40">
                        <td className="p-2 font-medium">
                          {formatMonth(m.month)}
                        </td>
                        <td className="p-2 text-right text-blue-600 font-medium">{formatCurrency(m.income)}</td>
                        <td className="p-2 text-right text-gray-600">{formatCurrency(m.totalSpent)}</td>
                        <td className={`p-2 text-right font-medium ${rta >= 0 ? 'text-orange-600' : 'text-red-600'}`}>{formatCurrency(rta)}</td>
                        <td className={`p-2 text-right font-medium ${m.netCashFlow >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(m.netCashFlow)}</td>
                        <td className="p-2 text-right">
                          <Button variant="ghost" size="sm" onClick={() => setExpanded(prev => ({ ...prev, [m.month]: !open }))}>
                            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <span className="ml-1">{open ? 'Hide' : 'View'}</span>
                          </Button>
                        </td>
                      </tr>
                      {open && (
                        <tr className="border-b bg-muted/30">
                          <td className="p-3" colSpan={6}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <DollarSign className="h-4 w-4 text-blue-600" />
                                  <span className="font-medium">Recurring Income</span>
                                  <Badge variant="secondary">{incomeSources.filter(s => s.active).length}</Badge>
                                </div>
                                <div className="space-y-2">
                                  {incomeSources.filter(s => s.active).length === 0 && (
                                    <p className="text-xs text-muted-foreground">No income sources configured</p>
                                  )}
                                  {incomeSources.filter(s => s.active).map(src => (
                                    <div key={src.id} className="flex items-center justify-between text-xs">
                                      <div className="truncate">
                                        {src.name}
                                        <span className="ml-2 text-muted-foreground">({src.frequency})</span>
                                      </div>
                                      <div className="font-medium text-blue-600">{formatCurrency(src.amount)}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Receipt className="h-4 w-4 text-gray-600" />
                                  <span className="font-medium">Recurring Bills</span>
                                  <Badge variant="secondary">{bills.length}</Badge>
                                </div>
                                <div className="space-y-2">
                                  {bills.length === 0 && (
                                    <p className="text-xs text-muted-foreground">No bills configured</p>
                                  )}
                                  {bills.map(b => (
                                    <div key={b.id} className="flex items-center justify-between text-xs">
                                      <div className="truncate">
                                        {b.name}
                                        <span className="ml-2 text-muted-foreground">({b.frequency})</span>
                                      </div>
                                      <div className="font-medium text-gray-700">{formatCurrency(b.amount)}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t">
                  <td className="p-2 font-semibold">Totals (12 mo)</td>
                  <td className="p-2 text-right font-semibold text-blue-600">{formatCurrency(totals.income)}</td>
                  <td className="p-2 text-right font-semibold text-gray-700">{formatCurrency(totals.expenses)}</td>
                  <td className="p-2 text-right font-semibold text-orange-600">{formatCurrency(totals.income - totals.expenses)}</td>
                  <td className={`p-2 text-right font-semibold ${totals.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(totals.net)}</td>
                  <td className="p-2" />
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function formatMonth(yyyyMm: string): string {
  try {
    return new Date(yyyyMm + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  } catch {
    return yyyyMm
  }
}


