'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, Calculator } from 'lucide-react'
import { InvestmentAccountWithDetails } from '@/lib/types/investments'

interface ProjectionsTabProps {
  accounts: InvestmentAccountWithDetails[]
}

export function ProjectionsTab({ accounts }: ProjectionsTabProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Investment Projections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Advanced Projections Coming Soon</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Detailed growth projections and retirement planning tools
            </p>
            <Button disabled>
              <Calculator className="h-4 w-4 mr-2" />
              Run Projections
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
