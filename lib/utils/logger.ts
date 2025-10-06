/**
 * Production-ready logging utility
 * Replaces all console.log statements with proper logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: string
  data?: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  private formatMessage(level: LogLevel, message: string, context?: string, data?: any): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      data
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true
    if (this.isProduction) return level === 'warn' || level === 'error'
    return false
  }

  debug(message: string, context?: string, data?: any): void {
    if (!this.shouldLog('debug')) return
    
    const entry = this.formatMessage('debug', message, context, data)
    console.log(`[DEBUG] ${entry.timestamp} ${context ? `[${context}]` : ''} ${message}`, data || '')
  }

  info(message: string, context?: string, data?: any): void {
    if (!this.shouldLog('info')) return
    
    const entry = this.formatMessage('info', message, context, data)
    console.log(`[INFO] ${entry.timestamp} ${context ? `[${context}]` : ''} ${message}`, data || '')
  }

  warn(message: string, context?: string, data?: any): void {
    if (!this.shouldLog('warn')) return
    
    const entry = this.formatMessage('warn', message, context, data)
    console.warn(`[WARN] ${entry.timestamp} ${context ? `[${context}]` : ''} ${message}`, data || '')
  }

  error(message: string, context?: string, data?: any): void {
    if (!this.shouldLog('error')) return
    
    const entry = this.formatMessage('error', message, context, data)
    console.error(`[ERROR] ${entry.timestamp} ${context ? `[${context}]` : ''} ${message}`, data || '')
  }

  // Special methods for common use cases
  auth(message: string, data?: any): void {
    this.info(message, 'AUTH', data)
  }

  api(message: string, data?: any): void {
    this.info(message, 'API', data)
  }

  middleware(message: string, data?: any): void {
    this.info(message, 'MIDDLEWARE', data)
  }

  database(message: string, data?: any): void {
    this.info(message, 'DATABASE', data)
  }
}

// Export singleton instance
export const logger = new Logger()

// Export individual methods for convenience
export const { debug, info, warn, error, auth, api, middleware, database } = logger
