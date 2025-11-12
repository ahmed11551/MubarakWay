import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const period = searchParams.get("period") || "6months"

    // Calculate date range
    const now = new Date()
    let startDate: Date | null = null

    if (period === "6months") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
    } else if (period === "12months") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1)
    }
    // "all" - no date filter

    // Get user donations
    let query = supabase
      .from("donations")
      .select("amount, created_at, status")
      .eq("donor_id", user.id)
      .eq("status", "completed")

    if (startDate) {
      query = query.gte("created_at", startDate.toISOString())
    }

    const { data: donations, error } = await query.order("created_at", { ascending: true })

    if (error) {
      console.error("[Donations Chart] Error:", error)
      return NextResponse.json({ error: "Failed to fetch donations" }, { status: 500 })
    }

    // Group by month
    const donationsByMonth: Record<string, number> = {}
    const countsByMonth: Record<string, number> = {}

    ;(donations || []).forEach((donation) => {
      const date = new Date(donation.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      
      donationsByMonth[monthKey] = (donationsByMonth[monthKey] || 0) + Number(donation.amount || 0)
      countsByMonth[monthKey] = (countsByMonth[monthKey] || 0) + 1
    })

    return NextResponse.json({
      data: donationsByMonth,
      counts: countsByMonth,
    })
  } catch (error) {
    console.error("[Donations Chart] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

