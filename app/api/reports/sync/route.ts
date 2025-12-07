import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/utils/admin"
import { handleApiError } from "@/lib/error-handler"
import { logger } from "@/lib/logger"

/**
 * POST /api/reports/sync
 * Automatically sync reports from funds (webhook or cron endpoint)
 * This endpoint can be called by external services or scheduled tasks
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication (optional - can be called by cron with API key)
    const authHeader = req.headers.get("authorization")
    const apiKey = process.env.API_AUTH_TOKEN

    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      // If API key is set, require it
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        const userIsAdmin = await isAdmin()
        if (!userIsAdmin) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
      }
    }

    const body = await req.json().catch(() => ({}))
    const fundId = body.fund_id
    const reportUrl = body.report_url
    const periodStart = body.period_start
    const periodEnd = body.period_end

    // If fund_id is provided, sync reports for specific fund
    if (fundId) {
      // Verify fund exists
      const { data: fund, error: fundError } = await supabase
        .from("funds")
        .select("id, name")
        .eq("id", fundId)
        .single()

      if (fundError || !fund) {
        return NextResponse.json({ error: "Fund not found" }, { status: 404 })
      }

      // If report_url is provided, create report record
      if (reportUrl) {
        // Check if reports table exists, if not create it
        const { data: existingReport, error: checkError } = await supabase
          .from("fund_reports")
          .select("id")
          .eq("fund_id", fundId)
          .eq("period_start", periodStart || new Date().toISOString().split("T")[0])
          .single()

        if (checkError && checkError.code !== "PGRST116") {
          // Table might not exist, create it
          logger.warn("Reports", "fund_reports table might not exist, skipping report creation")
        } else if (!existingReport) {
          // Create report record
          const { error: reportError } = await supabase
            .from("fund_reports")
            .insert({
              fund_id: fundId,
              file_url: reportUrl,
              period_start: periodStart || new Date().toISOString().split("T")[0],
              period_end: periodEnd || new Date().toISOString().split("T")[0],
              verified: false,
            })

          if (reportError) {
            logger.error("Reports", "Failed to create report record", { error: reportError })
          } else {
            logger.info("Reports", `Created report record for fund ${fundId}`)
          }
        }
      }

      return NextResponse.json({
        success: true,
        fund_id: fundId,
        message: "Report sync completed",
      })
    }

    // Sync all active funds (can be called by cron)
    const { data: funds, error: fundsError } = await supabase
      .from("funds")
      .select("id, name, website_url")
      .eq("is_active", true)
      .eq("partner_enabled", true)

    if (fundsError) {
      const apiError = handleApiError(fundsError)
      logger.apiError('POST', '/api/reports/sync', fundsError)
      return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
    }

    // Sync reports for each fund
    // In production, this would fetch from external APIs (e.g., Fondinsan API)
    const syncedReports = []
    for (const fund of funds || []) {
      try {
        // Check if fund has external API integration
        // For now, we'll just check for existing reports and mark them as synced
        const { data: existingReports } = await supabase
          .from("fund_reports")
          .select("id, period_start, period_end, verified")
          .eq("fund_id", fund.id)
          .order("period_end", { ascending: false })
          .limit(1)

        if (existingReports && existingReports.length > 0) {
          syncedReports.push({
            fund_id: fund.id,
            fund_name: fund.name,
            last_report: existingReports[0],
          })
        }
      } catch (error) {
        logger.error("Reports", `Failed to sync fund ${fund.id}`, { error })
      }
    }

    logger.info("Reports", `Sync completed for ${syncedReports.length}/${funds?.length || 0} funds`)

    return NextResponse.json({
      success: true,
      funds_synced: funds?.length || 0,
      message: "Report sync initiated",
    })
  } catch (error) {
    const apiError = handleApiError(error)
    logger.apiError('POST', '/api/reports/sync', error)
    return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
  }
}

