import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  Download, 
  Upload,
  Zap,
  Filter,
  Search,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { TransactionsList } from './components/transactions-list'
import { TransactionsStats } from './components/transactions-stats'
import { QuickCaptureModal } from '@/components/transactions/quick-capture-modal'
import { AddTransactionModal } from './components/add-transaction-modal'

interface TransactionsPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const showQuickCapture = searchParams['quick-capture'] === 'true'

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            Track your income and expenses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" data-testid="import-csv-btn">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" size="sm" data-testid="export-csv-btn">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <QuickCaptureModal>
            <Button variant="outline">
              <Zap className="h-4 w-4 mr-2" />
              Quick Catch-Up
            </Button>
          </QuickCaptureModal>
          <AddTransactionModal>
            <Button data-testid="add-transaction-btn">
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </AddTransactionModal>
        </div>
      </div>

      {/* Quick Capture Banner */}
      {showQuickCapture && (
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between w-full">
            <div>
              <span className="font-medium">Catch up on your spending</span>
              <span className="ml-2">
                Use Quick Catch-Up to add approximate transactions for the time you were away.
              </span>
            </div>
            <QuickCaptureModal>
              <Button size="sm">
                Start Quick Catch-Up
              </Button>
            </QuickCaptureModal>
          </AlertDescription>
        </Alert>
      )}

      {/* Transaction Stats */}
      <Suspense fallback={<TransactionsStatsSkeleton />}>
        <TransactionsStats />
      </Suspense>

      {/* Main Content */}
      <div className="grid gap-6">
        {/* Transactions List */}
        <Suspense fallback={<TransactionsListSkeleton />}>
          <TransactionsList />
        </Suspense>
      </div>
    </div>
  )
}

// Skeleton components
function TransactionsStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="h-4 w-4 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-24 bg-muted rounded animate-pulse mb-2" />
            <div className="h-3 w-40 bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function TransactionsListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                <div>
                  <div className="h-4 w-32 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                </div>
              </div>
              <div className="text-right">
                <div className="h-4 w-16 bg-muted rounded animate-pulse mb-2" />
                <div className="h-3 w-12 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export const metadata = {
  title: 'Transactions - Outwit Budget',
  description: 'View and manage your financial transactions'
}
