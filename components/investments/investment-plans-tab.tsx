'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Repeat, Plus } from 'lucide-react'
import { InvestmentAccountWithDetails } from '@/lib/types/investments'

interface InvestmentPlansTabProps {
  accounts: InvestmentAccountWithDetails[]
  onRefresh: () => void
}

export function InvestmentPlansTab({ accounts, onRefresh }: InvestmentPlansTabProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-blue-600" />
            Recurring Investment Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Repeat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Recurring Plans Coming Soon</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Set up automatic investment contributions like bills
            </p>
            <Button disabled>
              <Plus className="h-4 w-4 mr-2" />
              Add Recurring Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
