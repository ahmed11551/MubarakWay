/**
 * Environment variables validation
 */

const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const

const OPTIONAL_ENV_VARS = [
  "BOT_API_BASE_URL",
  "BOT_API_TOKEN",
  "PAYMENT_API_URL",
  "PAYMENT_API_TOKEN",
  "YOOKASSA_SHOP_ID",
  "YOOKASSA_SECRET_KEY",
  "NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID",
  "CLOUDPAYMENTS_API_PASSWORD",
  "FONDINSAN_API_BASE_URL",
  "FONDINSAN_ACCESS_TOKEN",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_SECRET_TOKEN",
  "NEXT_PUBLIC_TELEGRAM_BOT_USERNAME",
  "API_AUTH_TOKEN",
  "NEXT_PUBLIC_SENTRY_DSN",
] as const

export type EnvValidationResult = {
  isValid: boolean
  missing: string[]
  warnings: string[]
}

/**
 * Validate required environment variables
 * Throws error in production if critical vars are missing
 */
export function validateEnv(): EnvValidationResult {
  const missing: string[] = []
  const warnings: string[] = []

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missing.push(varName)
    }
  }

  // Check optional but recommended variables
  const recommendedVars = [
    "BOT_API_TOKEN",
    "PAYMENT_API_URL",
    "API_AUTH_TOKEN",
  ] as const

  for (const varName of recommendedVars) {
    if (!process.env[varName]) {
      warnings.push(`${varName} is recommended but not set`)
    }
  }

  const isValid = missing.length === 0

  // In production, throw error if critical vars are missing
  if (!isValid && process.env.NODE_ENV === "production") {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
      "Please check your .env.local file and ensure all required variables are set."
    )
  }

  return { isValid, missing, warnings }
}

/**
 * Get environment variable with validation
 */
export function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name]
  
  if (!value && defaultValue === undefined) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Required environment variable ${name} is not set`)
    }
    console.warn(`[Env] Environment variable ${name} is not set`)
  }
  
  return value || defaultValue || ""
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development"
}

/**
 * Check if we're in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production"
}

