'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error!} retry={this.retry} />
      }

      return <DefaultErrorFallback error={this.state.error!} retry={this.retry} />
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  const errorId = Math.floor(Math.random() * 1000000000)

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-950/20">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-bold">Something went wrong!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            We encountered an unexpected error. Please try again or contact support if the problem persists.
          </p>
          
          <div className="flex gap-2 justify-center">
            <Button onClick={retry} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/dashboard'}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Button>
          </div>
          
          <div className="text-xs text-blue-600 mt-4">
            Error ID: {errorId}
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left mt-4">
              <summary className="text-sm font-medium cursor-pointer">Error Details</summary>
              <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
                {error.message}
                {error.stack}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
