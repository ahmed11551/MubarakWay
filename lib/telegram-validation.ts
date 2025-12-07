/**
 * Telegram WebApp initData validation
 * 
 * Validates the signature of Telegram WebApp initData to ensure
 * the data comes from Telegram and hasn't been tampered with.
 * 
 * Documentation: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */

import crypto from "crypto"

/**
 * Parse initData string into key-value pairs
 * Example: "query_id=...&user=...&auth_date=...&hash=..." -> { query_id: "...", user: "...", ... }
 */
function parseInitData(initData: string): Record<string, string> {
  const params: Record<string, string> = {}
  
  for (const pair of initData.split("&")) {
    const [key, value] = pair.split("=")
    if (key && value) {
      params[decodeURIComponent(key)] = decodeURIComponent(value)
    }
  }
  
  return params
}

/**
 * Validate Telegram WebApp initData signature
 * 
 * @param initData - The initData string from Telegram WebApp (tg.initData)
 * @param botToken - Telegram Bot Token (from TELEGRAM_BOT_TOKEN env var)
 * @returns true if signature is valid, false otherwise
 */
export function verifyTelegramInitData(initData: string, botToken: string): boolean {
  if (!initData || !botToken) {
    console.warn("[Telegram Validation] Missing initData or botToken")
    return false
  }

  try {
    const params = parseInitData(initData)
    const hash = params.hash

    if (!hash) {
      console.warn("[Telegram Validation] No hash found in initData")
      return false
    }

    // Remove hash from params for validation
    delete params.hash

    // Sort parameters by key and create data_check_string
    const dataCheckString = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("\n")

    // Create secret key: HMAC-SHA256("WebAppData", botToken)
    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest()

    // Calculate expected hash: HMAC-SHA256(secretKey, data_check_string)
    const expectedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex")

    // Compare hashes (constant-time comparison to prevent timing attacks)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(hash, "hex"),
      Buffer.from(expectedHash, "hex")
    )

    if (!isValid) {
      console.warn("[Telegram Validation] Invalid signature", {
        received: hash.substring(0, 8) + "...",
        expected: expectedHash.substring(0, 8) + "...",
      })
    }

    return isValid
  } catch (error) {
    console.error("[Telegram Validation] Error validating initData:", error)
    return false
  }
}

/**
 * Extract user data from validated initData
 * 
 * @param initData - The initData string from Telegram WebApp
 * @returns Parsed user data or null if invalid
 */
export function parseTelegramUserFromInitData(initData: string): {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  photo_url?: string
  is_premium?: boolean
  auth_date: number
} | null {
  try {
    const params = parseInitData(initData)
    
    if (!params.user) {
      return null
    }

    const userData = JSON.parse(params.user)
    
    return {
      id: userData.id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      username: userData.username,
      language_code: userData.language_code,
      photo_url: userData.photo_url,
      is_premium: userData.is_premium || false,
      auth_date: parseInt(params.auth_date || "0", 10),
    }
  } catch (error) {
    console.error("[Telegram Validation] Error parsing user data:", error)
    return null
  }
}

/**
 * Check if initData is not expired (auth_date should be within last 24 hours)
 * 
 * @param authDate - Unix timestamp from auth_date parameter
 * @param maxAgeSeconds - Maximum age in seconds (default: 86400 = 24 hours)
 * @returns true if not expired, false otherwise
 */
export function isInitDataNotExpired(authDate: number, maxAgeSeconds: number = 86400): boolean {
  if (!authDate) {
    return false
  }

  const now = Math.floor(Date.now() / 1000)
  const age = now - authDate

  // Allow up to 5 minutes clock skew
  if (age < -300) {
    console.warn("[Telegram Validation] Auth date is in the future (clock skew?)", { authDate, now, age })
    return false
  }

  return age <= maxAgeSeconds
}

/**
 * Full validation of Telegram WebApp initData
 * 
 * @param initData - The initData string from Telegram WebApp
 * @param botToken - Telegram Bot Token
 * @returns Validation result with user data if valid
 */
export function validateTelegramInitData(
  initData: string,
  botToken: string
): {
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
} {
  // Step 1: Verify signature
  if (!verifyTelegramInitData(initData, botToken)) {
    return {
      valid: false,
      user: null,
      error: "Invalid signature",
    }
  }

  // Step 2: Parse user data
  const userData = parseTelegramUserFromInitData(initData)
  if (!userData) {
    return {
      valid: false,
      user: null,
      error: "Failed to parse user data",
    }
  }

  // Step 3: Check expiration (optional but recommended)
  if (!isInitDataNotExpired(userData.auth_date)) {
    return {
      valid: false,
      user: null,
      error: "InitData expired",
    }
  }

  return {
    valid: true,
    user: {
      id: userData.id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      username: userData.username,
      language_code: userData.language_code,
      photo_url: userData.photo_url,
      is_premium: userData.is_premium,
    },
  }
}

