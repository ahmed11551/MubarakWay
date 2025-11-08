import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { logError } from "@/lib/error-handler"

export async function createClient() {
  // Try to get env vars from multiple sources
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Fallback: try to get from Vercel env vars if not available
  if (!supabaseUrl) {
    supabaseUrl = process.env.VERCEL_ENV === "production" 
      ? process.env.NEXT_PUBLIC_SUPABASE_URL 
      : process.env.NEXT_PUBLIC_SUPABASE_URL
  }
  if (!supabaseAnonKey) {
    supabaseAnonKey = process.env.VERCEL_ENV === "production"
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    // Log detailed information for debugging
    console.error("[Supabase Server] Missing environment variables:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlValue: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : "undefined",
      keyValue: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : "undefined",
      allEnvKeys: Object.keys(process.env).filter(k => k.includes("SUPABASE")),
      vercelEnv: process.env.VERCEL_ENV,
      nodeEnv: process.env.NODE_ENV,
    })
    const error = new Error("Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.")
    logError(error, {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
    })
    throw error
  }

  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}
