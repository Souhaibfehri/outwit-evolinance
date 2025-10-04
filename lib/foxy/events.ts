// Events system for Foxy AI Coach to track user actions

export type FoxyEvent = 
  | 'view_dashboard'
  | 'create_category'
  | 'add_recurring_income'
  | 'add_transaction'
  | 'import_csv'
  | 'export_csv'
  | 'add_bill'
  | 'add_investment_rule'
  | 'run_debt_sim'
  | 'create_goal'
  | 'enable_goal_notifications'
  | 'view_reports'
  | 'open_notification_settings'
  | 'enable_notifications'
  | 'complete_tutorial'
  | 'goal_completed'
  | 'debt_paid_off'
  | 'month_balanced'
  | 'csv_operation'
  | 'daily_activity'

export interface EventPayload {
  event: FoxyEvent
  userId: string
  metadata?: Record<string, any>
  timestamp?: Date
}

export interface EventContext {
  stepId?: string
  badgeId?: string
  progress?: number
  streakDays?: number
}

// Event tracking utility
export class FoxyEventTracker {
  private static instance: FoxyEventTracker
  private listeners: Map<FoxyEvent, Array<(payload: EventPayload) => void>> = new Map()

  static getInstance(): FoxyEventTracker {
    if (!FoxyEventTracker.instance) {
      FoxyEventTracker.instance = new FoxyEventTracker()
    }
    return FoxyEventTracker.instance
  }

  // Emit an event
  async emit(event: FoxyEvent, userId: string, metadata?: Record<string, any>) {
    const payload: EventPayload = {
      event,
      userId,
      metadata,
      timestamp: new Date()
    }

    // Call API to process event
    try {
      await fetch('/api/coach/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } catch (error) {
      console.error('Failed to emit Foxy event:', error)
    }

    // Notify local listeners
    const eventListeners = this.listeners.get(event) || []
    eventListeners.forEach(listener => {
      try {
        listener(payload)
      } catch (error) {
        console.error('Event listener error:', error)
      }
    })
  }

  // Subscribe to events (for UI reactions)
  on(event: FoxyEvent, listener: (payload: EventPayload) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(listener)

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(event) || []
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  // Remove all listeners for an event
  off(event: FoxyEvent) {
    this.listeners.delete(event)
  }
}

// Convenience function for components
export const foxyEvents = FoxyEventTracker.getInstance()

// Helper to emit events from components
export function useFoxyEvent() {
  return {
    emit: foxyEvents.emit.bind(foxyEvents),
    on: foxyEvents.on.bind(foxyEvents),
    off: foxyEvents.off.bind(foxyEvents)
  }
}

// Event validation
export function isValidFoxyEvent(event: string): event is FoxyEvent {
  const validEvents: FoxyEvent[] = [
    'view_dashboard',
    'create_category',
    'add_recurring_income',
    'add_transaction',
    'import_csv',
    'export_csv',
    'add_bill',
    'add_investment_rule',
    'run_debt_sim',
    'create_goal',
    'enable_goal_notifications',
    'view_reports',
    'open_notification_settings',
    'enable_notifications',
    'complete_tutorial',
    'goal_completed',
    'debt_paid_off',
    'month_balanced',
    'csv_operation',
    'daily_activity'
  ]
  
  return validEvents.includes(event as FoxyEvent)
}
