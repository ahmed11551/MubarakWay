/**
 * Middleware utilities for Telegram WebApp authentication
 * 
 * Use these helpers in API routes to validate Telegram initData
 * and extract user information securely.
 */

import { NextRequest } from "next/server"
import { validateTelegramInitData } from "@/lib/telegram-validation"

/**
 * Extract initData from request
 * Supports both header and body
 */
function extractInitData(req: NextRequest): string | null {
  // Try header first (recommended for API routes)
  const headerInitData = req.headers.get("x-telegram-init-data")
  if (headerInitData) {
    return headerInitData
  }

  // Try body (for POST requests)
  // Note: This requires the body to be parsed first
  return null
}

/**
 * Validate Telegram initData from request
 * 
 * @param req - Next.js request object
 * @param initData - Optional initData string (if already extracted)
 * @returns Validation result with user data if valid
 */
export async function validateTelegramRequest(
  req: NextRequest,
  initData?: string
): Promise<{
  valid: boolean
  user: {
    id: number
    first_name: string
    last_name?: string
    username?: string
    language_code?: string
    photo_url?: string
    is_premium?: boolean
  } | null
  error?: string
}> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN

  if (!botToken) {
    return {
      valid: false,
      user: null,
      error: "TELEGRAM_BOT_TOKEN not configured",
    }
  }

  // Extract initData if not provided
  const data = initData || extractInitData(req)

  if (!data) {
    return {
      valid: false,
      user: null,
      error: "Telegram initData not found in request",
    }
  }

  return validateTelegramInitData(data, botToken)
}

/**
 * Require Telegram authentication in API route
 * 
 * Returns 401 if initData is invalid or missing
 * 
 * @example
 * ```ts
 * export async function POST(req: NextRequest) {
 *   const auth = await requireTelegramAuth(req)
 *   if (!auth.valid) {
 *     return NextResponse.json({ error: auth.error }, { status: 401 })
 *   }
 *   // Use auth.user.id, auth.user.first_name, etc.
 * }
 * ```
 */
export async function requireTelegramAuth(req: NextRequest) {
  const validation = await validateTelegramRequest(req)

  if (!validation.valid) {
    return {
      valid: false as const,
      user: null,
      error: validation.error || "Unauthorized",
      response: null, // Will be set by caller
    }
  }

  return {
    valid: true as const,
    user: validation.user!,
    error: undefined,
    response: null,
  }
}

/**
 * Optional Telegram authentication
 * 
 * Returns user if initData is valid, null otherwise (doesn't fail)
 * 
 * @example
 * ```ts
 * export async function GET(req: NextRequest) {
 *   const auth = await optionalTelegramAuth(req)
 *   if (auth.user) {
 *     // User is authenticated via Telegram
 *   } else {
 *     // User is not authenticated (or using other auth method)
 *   }
 * }
 * ```
 */
export async function optionalTelegramAuth(req: NextRequest) {
  const validation = await validateTelegramRequest(req)

  return {
    user: validation.valid ? validation.user : null,
    error: validation.error,
  }
}

