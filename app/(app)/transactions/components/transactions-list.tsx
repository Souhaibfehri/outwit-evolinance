'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  ArrowUpDown, 
  ArrowDown, 
  ArrowUp, 
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2
} from 'lucide-react'
import { getUserData } from '@/lib/user-data'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface Transaction {
  id: string
  date: string
  merchant: string
  categoryName: string
  accountName: string
  type: string
  amountCents: number
  note?: string
  isApproximate?: boolean
  source?: string
}

export function TransactionsList() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all')

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      // Fetch real user data from Supabase
      const userData = await getUserData()
      
      // Convert user transactions to component format
      const userTransactions: Transaction[] = userData.transactions.map(txn => ({
        id: txn.id,
        date: txn.date,
        merchant: txn.description || txn.merchant || 'Unknown',
        categoryName: txn.categoryName || txn.category || 'Uncategorized',
        accountName: txn.accountName || txn.account || 'Default Account',
        type: txn.type.toUpperCase() as 'INCOME' | 'EXPENSE' | 'TRANSFER',
        amountCents: Math.round(txn.amount * 100), // Convert to cents
        note: `Real transaction data`,
        isApproximate: false,
        source: 'user_data'
      })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setTransactions(userTransactions)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      // Set empty array instead of mock data
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(Math.abs(cents) / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'INCOME':
        return ArrowUp
      case 'EXPENSE':
        return ArrowDown
      case 'TRANSFER':
        return ArrowUpDown
      default:
        return ArrowUpDown
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'INCOME':
        return 'text-green-600'
      case 'EXPENSE':
        return 'text-red-600'
      case 'TRANSFER':
        return 'text-blue-600'
      default:
        return 'text-muted-foreground'
    }
  }

  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = txn.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         txn.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         txn.accountName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterType === 'all' || txn.type.toLowerCase() === filterType.toLowerCase()
    
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return <TransactionsListSkeleton />
  }

  return (
    <Card data-testid="transaction-list">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <div className="flex items-center gap-2" data-testid="transaction-filters">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="text-sm border rounded px-3 py-2"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
              <option value="transfer">Transfers</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <ArrowUpDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No transactions found</h3>
            <p className="text-muted-foreground text-sm mb-6">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Start by adding your first transaction'
              }
            </p>
            <Button>Add Transaction</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => {
              const Icon = getTransactionIcon(transaction.type)
              const colorClass = getTransactionColor(transaction.type)
              
              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'p-2 rounded-full bg-muted',
                      colorClass
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{transaction.merchant}</h4>
                        {transaction.isApproximate && (
                          <Badge variant="secondary" className="text-xs">
                            Approx
                          </Badge>
                        )}
                        {transaction.source === 'quick_capture' && (
                          <Badge variant="outline" className="text-xs">
                            Quick Capture
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{transaction.categoryName}</span>
                        <span>•</span>
                        <span>{transaction.accountName}</span>
                        <span>•</span>
                        <span>{formatDate(transaction.date)}</span>
                      </div>
                      {transaction.note && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {transaction.note}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={cn('font-medium', colorClass)}>
                        {transaction.type === 'EXPENSE' ? '-' : '+'}
                        {formatCurrency(transaction.amountCents)}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {transaction.type.toLowerCase()}
                      </p>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Transaction
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
            
            {filteredTransactions.length >= 50 && (
              <div className="text-center pt-4">
                <Button variant="outline">Load More Transactions</Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TransactionsListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
