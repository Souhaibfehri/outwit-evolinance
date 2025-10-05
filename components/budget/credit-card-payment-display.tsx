'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CreditCard, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Zap
} from 'lucide-react'
import { PaymentCategoryState } from '@/lib/credit-cards/engine'
import { formatCurrency } from '@/lib/budget/calcs'

interface CreditCardPaymentDisplayProps {
  paymentStates: PaymentCategoryState[]
  onFundPayment: (categoryId: string, amount: number) => void
  onMakePayment: (categoryId: string, amount: number) => void
  className?: string
}

export function CreditCardPaymentDisplay({
  paymentStates,
  onFundPayment,
  onMakePayment,
  className
}: CreditCardPaymentDisplayProps) {
  if (paymentStates.length === 0) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-orange-600" />
          Credit Card Payments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {paymentStates.map(state => (
          <CreditCardPaymentItem
            key={state.categoryId}
            state={state}
            onFundPayment={onFundPayment}
            onMakePayment={onMakePayment}
          />
        ))}
      </CardContent>
    </Card>
  )
}

interface CreditCardPaymentItemProps {
  state: PaymentCategoryState
  onFundPayment: (categoryId: string, amount: number) => void
  onMakePayment: (categoryId: string, amount: number) => void
}

function CreditCardPaymentItem({
  state,
  onFundPayment,
  onMakePayment
}: CreditCardPaymentItemProps) {
  const targetAmount = state.shouldPayInFull ? state.cardBalance : (state.monthlyTarget || 0)
  const fundingProgress = targetAmount > 0 ? (state.paymentAvailable / targetAmount) * 100 : 0
  const canMakePayment = state.paymentAvailable > 0

  const getStatusBadge = () => {
    if (state.overfunded) {
      return (
        <Badge variant="outline" className="text-blue-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Overfunded
        </Badge>
      )
    }
    
    if (state.underfunded) {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Underfunded
        </Badge>
      )
    }

    return (
      <Badge variant="outline" className="text-blue-600">
        <CheckCircle className="h-3 w-3 mr-1" />
        Fully Funded
      </Badge>
    )
  }

  const getNeededAmount = () => {
    if (state.shouldPayInFull) {
      return Math.max(0, state.cardBalance - state.paymentAvailable)
    } else {
      return Math.max(0, (state.monthlyTarget || 0) - state.paymentAvailable)
    }
  }

  return (
    <div className="p-3 border rounded-lg space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm">{state.categoryName}</h4>
          {getStatusBadge()}
        </div>
        <div className="text-right text-xs text-muted-foreground">
          {state.shouldPayInFull ? 'Pay in Full' : 'Pay Over Time'}
        </div>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-muted-foreground text-xs">Card Balance</div>
          <div className="font-semibold text-red-600">
            -{formatCurrency(state.cardBalance)}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs">Payment Available</div>
          <div className="font-semibold text-blue-600">
            {formatCurrency(state.paymentAvailable)}
          </div>
        </div>
      </div>

      {/* Target Progress */}
      {targetAmount > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {state.shouldPayInFull ? 'Full Balance Coverage' : 'Monthly Target Progress'}
            </span>
            <span className="font-medium">{fundingProgress.toFixed(1)}%</span>
          </div>
          <Progress value={Math.min(100, fundingProgress)} className="h-2" />
          {state.shouldPayInFull && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Available: {formatCurrency(state.paymentAvailable)}</span>
              <span>Balance: {formatCurrency(state.cardBalance)}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {state.underfunded && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFundPayment(state.categoryId, getNeededAmount())}
            className="flex-1"
          >
            <Zap className="h-3 w-3 mr-1" />
            Fund {formatCurrency(getNeededAmount())}
          </Button>
        )}
        
        {canMakePayment && (
          <Button
            size="sm"
            onClick={() => onMakePayment(state.categoryId, state.paymentAvailable)}
            className="flex-1"
          >
            <CreditCard className="h-3 w-3 mr-1" />
            Pay {formatCurrency(state.paymentAvailable)}
          </Button>
        )}
      </div>

      {/* Strategy Info */}
      <div className="text-xs text-muted-foreground">
        {state.shouldPayInFull ? (
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Pay-in-full strategy: Payment Available should equal Card Balance
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Pay-over-time strategy: Target {formatCurrency(state.monthlyTarget || 0)} monthly
          </div>
        )}
      </div>
    </div>
  )
}
