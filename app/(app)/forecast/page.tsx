import { Suspense } from 'react'
import { ForecastPageClient } from './forecast-client'
import { Card, CardContent } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default function ForecastPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Forecast
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            12-month predictive cashflow timeline with what-if scenarios
          </p>
        </div>
      </div>

      {/* Forecast Content */}
      <Suspense fallback={<ForecastSkeleton />}>
        <ForecastPageClient />
      </Suspense>
    </div>
  )
}

function ForecastSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
