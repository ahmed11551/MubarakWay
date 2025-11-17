/**
 * Centralized error handling for better error tracking
 */

import type { ApiError } from "@/types"

export class AppError extends Error {
  code?: string
  statusCode: number
  context?: Record<string, unknown>

  constructor(message: string, code?: string, statusCode: number = 500, context?: Record<string, unknown>) {
    super(message)
    this.name = "AppError"
    this.code = code
    this.statusCode = statusCode
    this.context = context
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }

  toApiError(): ApiError {
    return {
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
    }
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

  // Send to Sentry if available
  if (typeof window !== "undefined") {
    // Client-side
    import("@sentry/nextjs").then((Sentry) => {
      Sentry.captureException(error, {
        contexts: {
          custom: context || {},
        },
      })
    }).catch(() => {
      // Sentry not available, ignore
    })
  } else {
    // Server-side
    import("@sentry/nextjs").then((Sentry) => {
      Sentry.captureException(error, {
        contexts: {
          custom: context || {},
        },
      })
    }).catch(() => {
      // Sentry not available, ignore
    })
  }
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

/**
 * Обработчик ошибок для API routes
 * Преобразует любую ошибку в безопасный ответ API
 */
export function handleApiError(error: unknown): { message: string; statusCode: number; code?: string } {
  // Если это уже AppError, используем его
  if (error instanceof AppError) {
    logError(error, error.context)
    return {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
    }
  }

  // Если это Supabase ошибка
  if (error && typeof error === "object" && "message" in error) {
    const supabaseError = handleSupabaseError(error)
    return {
      message: supabaseError.message,
      statusCode: supabaseError.statusCode,
      code: supabaseError.code,
    }
  }

  // Неизвестная ошибка - не раскрываем детали в production
  const isDevelopment = process.env.NODE_ENV === "development"
  const errorMessage = error instanceof Error ? error.message : String(error)
  
  logError(error)
  
  return {
    message: isDevelopment ? errorMessage : "Внутренняя ошибка сервера",
    statusCode: 500,
    code: "INTERNAL_ERROR",
  }
}

