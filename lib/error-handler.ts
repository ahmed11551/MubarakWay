/**
 * Centralized error handling for better error tracking
 */

export interface AppError {
  message: string
  code?: string
  statusCode?: number
  context?: Record<string, unknown>
}

export class AppError extends Error {
  code?: string
  statusCode?: number
  context?: Record<string, unknown>

  constructor(message: string, code?: string, statusCode?: number, context?: Record<string, unknown>) {
    super(message)
    this.name = "AppError"
    this.code = code
    this.statusCode = statusCode
    this.context = context
  }
}

/**
 * Log error with context for better debugging
 */
export function logError(error: unknown, context?: Record<string, unknown>) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  console.error("[Error]", {
    message: errorMessage,
    stack: errorStack,
    context,
    timestamp: new Date().toISOString(),
  })

  // In production, you might want to send to error tracking service
  // e.g., Sentry, LogRocket, etc.
}

/**
 * Handle Supabase errors gracefully
 */
export function handleSupabaseError(error: unknown): AppError {
  if (error && typeof error === "object" && "message" in error) {
    const supabaseError = error as { message: string; code?: string; details?: string; hint?: string }

    // Common Supabase error codes
    const errorMap: Record<string, { message: string; statusCode: number }> = {
      PGRST116: { message: "Resource not found", statusCode: 404 },
      "23505": { message: "Duplicate entry", statusCode: 409 },
      "23503": { message: "Foreign key violation", statusCode: 400 },
      "42501": { message: "Permission denied", statusCode: 403 },
    }

    const mappedError = supabaseError.code ? errorMap[supabaseError.code] : null

    return new AppError(
      mappedError?.message || supabaseError.message || "Database error",
      supabaseError.code,
      mappedError?.statusCode || 500,
      {
        details: supabaseError.details,
        hint: supabaseError.hint,
      }
    )
  }

  return new AppError("Unknown database error", "UNKNOWN", 500)
}

/**
 * Safe async wrapper to catch and log errors
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback?: T,
  context?: Record<string, unknown>
): Promise<T | undefined> {
  try {
    return await fn()
  } catch (error) {
    logError(error, context)
    return fallback
  }
}

