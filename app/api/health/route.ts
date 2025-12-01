import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { fetchBotApiStats } from "@/lib/bot-api"

/**
 * Health check endpoint with dependency checks
 * Returns 200 if healthy, 503 if degraded
 */
export async function GET() {
  const checks: Record<string, { status: boolean; message?: string; latency?: number }> = {}
  const startTime = Date.now()

  // Check Supabase connection
  try {
    const supabase = await createClient()
    const supabaseStart = Date.now()
    const { error } = await supabase.from("profiles").select("id").limit(1)
    const supabaseLatency = Date.now() - supabaseStart
    
    checks.supabase = {
      status: !error,
      message: error ? error.message : "Connected",
      latency: supabaseLatency,
    }
  } catch (error) {
    checks.supabase = {
      status: false,
      message: error instanceof Error ? error.message : "Connection failed",
    }
  }

  // Check Bot API (optional, non-blocking)
  try {
    const botApiStart = Date.now()
    const stats = await fetchBotApiStats()
    const botApiLatency = Date.now() - botApiStart
    
    checks.botApi = {
      status: stats !== null,
      message: stats ? "Connected" : "Not configured or unavailable",
      latency: botApiLatency,
    }
  } catch (error) {
    checks.botApi = {
      status: false,
      message: error instanceof Error ? error.message : "Connection failed",
    }
  }

  // Check environment variables
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ]
  
  const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v])
  checks.environment = {
    status: missingEnvVars.length === 0,
    message: missingEnvVars.length > 0 
      ? `Missing: ${missingEnvVars.join(", ")}` 
      : "All required variables present",
  }

  // Determine overall health
  const criticalChecks = [checks.supabase, checks.environment]
  const isHealthy = criticalChecks.every((check) => check.status)
  const isDegraded = !isHealthy || !checks.botApi?.status

  const totalLatency = Date.now() - startTime

  return NextResponse.json(
    {
      status: isHealthy ? (isDegraded ? "degraded" : "ok") : "unhealthy",
      timestamp: new Date().toISOString(),
      checks,
      latency: totalLatency,
      version: process.env.npm_package_version || "unknown",
    },
    { status: isHealthy ? (isDegraded ? 200 : 200) : 503 }
  )
}

