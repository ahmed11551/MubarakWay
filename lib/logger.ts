/**
 * Structured logging utility
 * Provides consistent logging format across the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  /**
   * Format log message with context
   */
  private format(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    }

    return JSON.stringify(logEntry)
  }

  /**
   * Debug log (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.format('debug', message, context))
    }
  }

  /**
   * Info log
   */
  info(message: string, context?: LogContext): void {
    console.log(this.format('info', message, context))
  }

  /**
   * Warning log
   */
  warn(message: string, context?: LogContext): void {
    console.warn(this.format('warn', message, context))
  }

  /**
   * Error log
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext: LogContext = {
      ...context,
    }

    if (error instanceof Error) {
      errorContext.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    } else if (error) {
      errorContext.error = error
    }

    console.error(this.format('error', message, errorContext))
  }

  /**
   * API request log
   */
  apiRequest(method: string, path: string, statusCode: number, duration?: number, context?: LogContext): void {
    this.info('API Request', {
      method,
      path,
      statusCode,
      duration: duration ? `${duration}ms` : undefined,
      ...context,
    })
  }

  /**
   * API error log
   */
  apiError(method: string, path: string, error: Error | unknown, context?: LogContext): void {
    this.error('API Error', error, {
      method,
      path,
      ...context,
    })
  }

  /**
   * Database query log
   */
  dbQuery(operation: string, table: string, duration?: number, context?: LogContext): void {
    if (this.isDevelopment) {
      this.debug('Database Query', {
        operation,
        table,
        duration: duration ? `${duration}ms` : undefined,
        ...context,
      })
    }
  }

  /**
   * Rate limit log
   */
  rateLimit(identifier: string, limit: number, remaining: number, context?: LogContext): void {
    this.info('Rate Limit Check', {
      identifier,
      limit,
      remaining,
      ...context,
    })
  }

  /**
   * Cache operation log
   */
  cache(operation: 'hit' | 'miss' | 'set', key: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.debug('Cache Operation', {
        operation,
        key,
        ...context,
      })
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Export Logger class for testing
export { Logger }

