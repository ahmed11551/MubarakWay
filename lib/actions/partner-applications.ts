"use server"

import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/utils/admin"
import { revalidatePath } from "next/cache"

/**
 * Get all partner applications with optional status filter
 */
export async function getPartnerApplications(status?: "received" | "in_review" | "approved" | "rejected") {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be logged in to view partner applications" }
  }

  // Check if user is admin
  const userIsAdmin = await isAdmin()
  if (!userIsAdmin) {
    return { error: "You must be an admin to view partner applications" }
  }

  try {
    let query = supabase.from("partner_applications").select("*").order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      console.error("[Partner Applications] Error fetching:", error)
      return { error: "Failed to fetch partner applications" }
    }

    return { applications: data || [] }
  } catch (error) {
    console.error("[Partner Applications] Unexpected error:", error)
    return { error: "An unexpected error occurred" }
  }
}

/**
 * Approve partner application
 * Creates or updates fund with partner_enabled=true
 */
export async function approvePartnerApplication(applicationId: string, comment?: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be logged in to approve applications" }
  }

  // Check if user is admin
  const userIsAdmin = await isAdmin()
  if (!userIsAdmin) {
    return { error: "You must be an admin to approve applications" }
  }

  try {
    // Get application
    const { data: application, error: appError } = await supabase
      .from("partner_applications")
      .select("*")
      .eq("id", applicationId)
      .single()

    if (appError || !application) {
      return { error: "Application not found" }
    }

    // Update application status
    const { data: updatedApp, error: updateError } = await supabase
      .from("partner_applications")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewer_id: user.id,
        comment: comment || null,
      })
      .eq("id", applicationId)
      .select()
      .single()

    if (updateError) {
      console.error("[Partner Applications] Error updating:", updateError)
      return { error: "Failed to approve application" }
    }

    // Create or update fund with partner_enabled=true
    // Check if fund with same name exists
    const { data: existingFund } = await supabase
      .from("funds")
      .select("id")
      .ilike("name", application.org_name)
      .limit(1)
      .single()

    if (existingFund) {
      // Update existing fund
      await supabase
        .from("funds")
        .update({
          partner_enabled: true,
          is_verified: true,
          country_code: application.country_code,
          website_url: application.website,
          categories: application.categories,
        })
        .eq("id", existingFund.id)
    } else {
      // Create new fund
      const { error: fundError } = await supabase.from("funds").insert({
        name: application.org_name,
        description: application.about || "",
        category: "general",
        partner_enabled: true,
        is_verified: true,
        is_active: true,
        country_code: application.country_code,
        website_url: application.website,
        categories: application.categories,
      })

      if (fundError) {
        console.error("[Partner Applications] Error creating fund:", fundError)
        // Don't fail the approval if fund creation fails
      }
    }

    // Send notification (if email is available)
    // TODO: Implement email notification

    revalidatePath("/admin")
    revalidatePath("/funds")

    return { success: true, application: updatedApp }
  } catch (error) {
    console.error("[Partner Applications] Unexpected error:", error)
    return { error: "An unexpected error occurred" }
  }
}

/**
 * Reject partner application
 */
export async function rejectPartnerApplication(applicationId: string, reason?: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be logged in to reject applications" }
  }

  // Check if user is admin
  const userIsAdmin = await isAdmin()
  if (!userIsAdmin) {
    return { error: "You must be an admin to reject applications" }
  }

  try {
    const { data: application, error: updateError } = await supabase
      .from("partner_applications")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewer_id: user.id,
        comment: reason || null,
      })
      .eq("id", applicationId)
      .select()
      .single()

    if (updateError) {
      console.error("[Partner Applications] Error updating:", updateError)
      return { error: "Failed to reject application" }
    }

    // Send notification (if email is available)
    // TODO: Implement email notification

    revalidatePath("/admin")

    return { success: true, application }
  } catch (error) {
    console.error("[Partner Applications] Unexpected error:", error)
    return { error: "An unexpected error occurred" }
  }
}

