import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { handleApiError } from "@/lib/error-handler"
import { rateLimitRequest } from "@/lib/utils/rate-limit-redis"
import { logger } from "@/lib/logger"

/**
 * Generate simple PDF content (text-based)
 * For production, replace with pdfkit or @react-pdf/renderer
 */
function generatePDFContent(donations: any[], userId: string): string {
  // Simple PDF structure (minimal PDF format)
  // In production, use a proper PDF library
  const lines: string[] = []
  
  lines.push("%PDF-1.4")
  lines.push("1 0 obj")
  lines.push("<< /Type /Catalog /Pages 2 0 R >>")
  lines.push("endobj")
  
  // For now, return a simple text representation
  // In production, implement proper PDF generation
  const textContent = [
    "MubarakWay - История пожертвований",
    `Дата экспорта: ${new Date().toLocaleDateString("ru-RU")}`,
    "",
    ...donations.map((d, i) => {
      const date = new Date(d.created_at).toLocaleDateString("ru-RU")
      const type = d.donation_type === "zakat" ? "Закят" : d.donation_type === "sadaqah" ? "Садака" : "Пожертвование"
      const recipient = (d.funds as any)?.name || (d.campaigns as any)?.title || "-"
      return `${i + 1}. ${date} - ${type} - ${d.amount} ${d.currency} - ${recipient} - ${d.status}`
    }),
  ].join("\n")
  
  // Return as base64 encoded or use proper PDF library
  // For MVP, return JSON with instruction to use client-side generation
  return JSON.stringify({
    message: "PDF generation requires client-side library. Please use jsPDF or download CSV format.",
    data: donations,
    textContent,
  })
}

/**
 * GET /api/export/history
 * Export user's donation history as PDF or CSV
 * Query params: format (pdf|csv), type, status, from, to
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now()
  const rateLimitResult = await rateLimitRequest(req, { max: 20, window: 60 })
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: "Too many requests",
        message: `Rate limit exceeded. Maximum ${rateLimitResult.limit} requests per minute.`,
        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          "Retry-After": Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
        },
      }
    )
  }

  try {
    const supabase = await createClient()
    
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const format = searchParams.get("format") || "csv"
    const type = searchParams.get("type")
    const status = searchParams.get("status")
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    // Get donations
    let query = supabase
      .from("donations")
      .select(`
        id,
        amount,
        currency,
        donation_type,
        status,
        created_at,
        funds(name),
        campaigns(title)
      `)
      .eq("donor_id", user.id)
      .order("created_at", { ascending: false })

    if (type && type !== "all") {
      query = query.eq("donation_type", type)
    }

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (from) {
      query = query.gte("created_at", from)
    }

    if (to) {
      query = query.lte("created_at", to)
    }

    const { data: donations, error: donationsError } = await query

    if (donationsError) {
      const apiError = handleApiError(donationsError)
      logger.apiError('GET', '/api/export/history', donationsError)
      return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
    }

    if (format === "csv") {
      // Generate CSV
      const csvRows = [
        ["ID", "Дата", "Тип", "Сумма", "Валюта", "Фонд/Кампания", "Статус"],
        ...(donations || []).map((d) => [
          d.id,
          new Date(d.created_at).toLocaleDateString("ru-RU"),
          d.donation_type === "zakat" ? "Закят" : d.donation_type === "sadaqah" ? "Садака" : "Пожертвование",
          d.amount.toString(),
          d.currency,
          (d.funds as any)?.name || (d.campaigns as any)?.title || "-",
          d.status === "completed" ? "Завершено" : d.status === "pending" ? "Ожидает" : d.status,
        ]),
      ]

      const csv = csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })

      return new NextResponse(blob, {
        headers: {
          "Content-Type": "text/csv;charset=utf-8",
          "Content-Disposition": `attachment; filename="donations_${new Date().toISOString().split("T")[0]}.csv"`,
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.reset.toString(),
        },
      })
    } else if (format === "pdf") {
      // Generate PDF using simple text-based approach
      // For production, consider using pdfkit or @react-pdf/renderer
      const pdfContent = generatePDFContent(donations || [], user.id)
      
      return new NextResponse(pdfContent, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="donations_${new Date().toISOString().split("T")[0]}.pdf"`,
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.reset.toString(),
        },
      })
    } else {
      return NextResponse.json({ error: "Invalid format. Use 'csv' or 'pdf'" }, { status: 400 })
    }
  } catch (error) {
    const apiError = handleApiError(error)
    logger.apiError('GET', '/api/export/history', error)
    return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
  }
}

