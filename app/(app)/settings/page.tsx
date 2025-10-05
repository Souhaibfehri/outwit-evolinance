import { SimpleSettings } from './simple-settings'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Customize your Outwit Budget experience
          </p>
        </div>
      </div>

      {/* Settings Content */}
      <SimpleSettings />
    </div>
  )
}