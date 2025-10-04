'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  ArrowRight,
  Shield,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'

interface MigrationStatus {
  userId: string
  email: string
  isMigrated: boolean
  metadataSize: number
  needsMigration: boolean
  dataBreakdown: Record<string, number>
}

export default function MigrationPage() {
  const [status, setStatus] = useState<MigrationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [migrating, setMigrating] = useState(false)
  const [migrationProgress, setMigrationProgress] = useState(0)

  useEffect(() => {
    checkMigrationStatus()
  }, [])

  const checkMigrationStatus = async () => {
    try {
      const response = await fetch('/api/migrate/to-database')
      const data = await response.json()
      
      if (response.ok) {
        setStatus(data)
      } else {
        toast.error('Failed to check migration status')
      }
    } catch (error) {
      console.error('Error checking migration status:', error)
      toast.error('Failed to check migration status')
    } finally {
      setLoading(false)
    }
  }

  const startMigration = async () => {
    if (!confirm('This will migrate your data to the database and clear large metadata. Continue?')) {
      return
    }

    setMigrating(true)
    setMigrationProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setMigrationProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const response = await fetch('/api/migrate/to-database', {
        method: 'POST'
      })

      clearInterval(progressInterval)
      setMigrationProgress(100)

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 2000)
      } else {
        toast.error(data.error || 'Migration failed')
        setMigrationProgress(0)
      }
    } catch (error) {
      console.error('Error during migration:', error)
      toast.error('Migration failed')
      setMigrationProgress(0)
    } finally {
      setMigrating(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Checking migration status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Database Migration</h1>
        <p className="text-muted-foreground">
          Fix REQUEST_HEADER_TOO_LARGE errors by migrating to proper database storage
        </p>
      </div>

      <div className="space-y-6">
        {/* Migration Status */}
        {status && (
          <Alert className={status.needsMigration ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
            {status.needsMigration ? (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            <AlertDescription>
              {status.isMigrated ? (
                <div>
                  <strong>✅ Already Migrated</strong><br />
                  Your data is stored in the database. Header size issues should be resolved.
                </div>
              ) : status.needsMigration ? (
                <div>
                  <strong>🚨 Migration Needed</strong><br />
                  Your metadata is {formatBytes(status.metadataSize)}, which causes header size errors.
                </div>
              ) : (
                <div>
                  <strong>✅ Metadata Size OK</strong><br />
                  Your metadata is {formatBytes(status.metadataSize)}, which is within limits.
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Migration Progress */}
        {migrating && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <Database className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-medium">Migrating Data to Database...</h3>
                <p className="text-sm text-blue-700">
                  This will solve the header size issue permanently
                </p>
              </div>
              <Progress value={migrationProgress} className="mb-2" />
              <div className="text-center text-sm text-blue-600">
                {migrationProgress}% complete
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Breakdown */}
        {status && (
          <Card>
            <CardHeader>
              <CardTitle>Current Data Storage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(status.dataBreakdown).map(([key, value]) => (
                  <div key={key} className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="font-medium text-sm">{key.replace(/_/g, ' ')}</div>
                    <div className="text-lg font-bold">{value}</div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Metadata Size:</span>
                  <span className={`font-bold ${status.needsMigration ? 'text-red-600' : 'text-green-600'}`}>
                    {formatBytes(status.metadataSize)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Migration Action */}
        {status && !status.isMigrated && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Zap className="h-5 w-5" />
                Recommended Action
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">✅ What Migration Does:</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside text-orange-700">
                    <li>Moves your data to proper database tables</li>
                    <li>Reduces metadata size to prevent header errors</li>
                    <li>Improves app performance and reliability</li>
                    <li>Keeps all your data safe and accessible</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">🔒 What's Preserved:</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside text-orange-700">
                    <li>All goals, debts, income sources, investments</li>
                    <li>Profile settings and preferences</li>
                    <li>Onboarding completion status</li>
                    <li>Recent transactions and activity</li>
                  </ul>
                </div>

                <Button 
                  onClick={startMigration}
                  disabled={migrating}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  size="lg"
                >
                  {migrating ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Database className="h-4 w-4 mr-2" />
                  )}
                  {migrating ? 'Migrating...' : 'Migrate to Database'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success State */}
        {status?.isMigrated && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                ✅ Migration Complete!
              </h3>
              <p className="text-green-700 mb-6">
                Your data is now stored in the database. Header size issues are resolved.
              </p>
              <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
                <a href="/dashboard">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">🚨 The Problem:</h4>
              <p className="text-sm text-gray-600">
                Storing large amounts of financial data in Supabase user metadata causes 
                REQUEST_HEADER_TOO_LARGE (HTTP 431) errors when headers exceed size limits.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">✅ The Solution:</h4>
              <p className="text-sm text-gray-600">
                Migrate data to proper PostgreSQL database tables with indexed queries, 
                keeping only essential profile information in metadata.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">🔒 Data Safety:</h4>
              <p className="text-sm text-gray-600">
                Migration uses database transactions to ensure data integrity. 
                Your original data remains until migration is confirmed successful.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
