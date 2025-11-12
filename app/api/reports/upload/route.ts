import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/utils/admin"

/**
 * Upload PDF report for a fund
 * Only admins can upload reports
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const fundId = formData.get("fundId") as string
    const periodStart = formData.get("periodStart") as string
    const periodEnd = formData.get("periodEnd") as string

    if (!file || !fundId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 })
    }

    // Verify fund exists
    const { data: fund, error: fundError } = await supabase
      .from("funds")
      .select("id, name")
      .eq("id", fundId)
      .single()

    if (fundError || !fund) {
      return NextResponse.json({ error: "Fund not found" }, { status: 404 })
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate unique filename
    const timestamp = Date.now()
    const fileName = `fund-${fundId}-${timestamp}.pdf`
    const filePath = `reports/${fileName}`

    // Upload to Supabase Storage (assuming 'reports' bucket exists)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("reports")
      .upload(filePath, buffer, {
        contentType: "application/pdf",
        upsert: false,
      })

    if (uploadError) {
      console.error("[Reports Upload] Storage error:", uploadError)
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("reports").getPublicUrl(filePath)
    const fileUrl = urlData?.publicUrl

    if (!fileUrl) {
      return NextResponse.json({ error: "Failed to get file URL" }, { status: 500 })
    }

    // Create report record in database
    // First, check if we need to create a fund_reports table or use existing reports table
    // For now, we'll store in a simple structure
    const { data: reportData, error: reportError } = await supabase
      .from("reports")
      .insert({
        user_id: user.id, // Admin who uploaded
        report_type: "monthly", // Can be adjusted
        period_start: periodStart ? new Date(periodStart).toISOString() : null,
        period_end: periodEnd ? new Date(periodEnd).toISOString() : null,
        total_amount: 0, // Will be calculated or set manually
        donation_count: 0,
        file_url: fileUrl,
      })
      .select()
      .single()

    if (reportError) {
      console.error("[Reports Upload] Database error:", reportError)
      // Try to delete uploaded file
      await supabase.storage.from("reports").remove([filePath])
      return NextResponse.json({ error: "Failed to create report record" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      report: reportData,
      fileUrl,
    })
  } catch (error) {
    console.error("[Reports Upload] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

