import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getFundReports } from "@/lib/actions/fund-reports"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const fundId = searchParams.get("fund_id")
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    // If fund_id is provided, get reports for specific fund
    if (fundId) {
      const result = await getFundReports(fundId)
      
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 404 })
      }

      // Filter by date range if provided
      let filteredDonations = result.recentDonations || []
      if (from || to) {
        const fromDate = from ? new Date(from) : null
        const toDate = to ? new Date(to) : null
        
        filteredDonations = filteredDonations.filter((donation: any) => {
          const donationDate = new Date(donation.created_at)
          if (fromDate && donationDate < fromDate) return false
          if (toDate && donationDate > toDate) return false
          return true
        })
      }

      return NextResponse.json({
        fund: result.fund,
        statistics: result.statistics,
        donations: filteredDonations,
        donationsByMonth: result.donationsByMonth,
        campaigns: result.campaigns,
      })
    }

    // Get all funds reports
    const { data: funds, error: fundsError } = await supabase
      .from("funds")
      .select("id, name, logo_url, category, is_verified")
      .eq("is_active", true)
      .order("name")

    if (fundsError) {
      return NextResponse.json({ error: "Failed to fetch funds" }, { status: 500 })
    }

    // Get statistics for each fund
    const fundsWithStats = await Promise.all(
      (funds || []).map(async (fund) => {
        const { data: donations } = await supabase
          .from("donations")
          .select("amount, status, created_at")
          .eq("fund_id", fund.id)
          .eq("status", "completed")

        // Filter by date range if provided
        let filteredDonations = donations || []
        if (from || to) {
          const fromDate = from ? new Date(from) : null
          const toDate = to ? new Date(to) : null
          
          filteredDonations = filteredDonations.filter((donation: any) => {
            const donationDate = new Date(donation.created_at)
            if (fromDate && donationDate < fromDate) return false
            if (toDate && donationDate > toDate) return false
            return true
          })
        }

        const totalDonations = filteredDonations.reduce((sum, d) => sum + Number(d.amount || 0), 0)
        const donationCount = filteredDonations.length

        const { data: campaigns } = await supabase
          .from("campaigns")
          .select("id, status")
          .eq("fund_id", fund.id)

        return {
          ...fund,
          statistics: {
            totalDonations,
            donationCount,
            campaignCount: (campaigns || []).length,
          },
        }
      })
    )

    return NextResponse.json({ funds: fundsWithStats })
  } catch (error) {
    console.error("[Reports API] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

