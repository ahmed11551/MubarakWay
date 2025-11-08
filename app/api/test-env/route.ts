import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  return NextResponse.json({
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlPrefix: supabaseUrl?.substring(0, 30) || "missing",
    keyPrefix: supabaseAnonKey?.substring(0, 30) || "missing",
    timestamp: new Date().toISOString(),
  })
}

