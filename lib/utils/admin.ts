/**
 * Utility functions for admin checks
 */

import { createClient } from "@/lib/supabase/server"

/**
 * Check if current user is admin
 * Uses is_admin field from profiles table
 * Falls back to subscription_tier check for backward compatibility
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return false
    }

    // Check if user has admin role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin, subscription_tier")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return false
    }

    // Primary check: is_admin field (new approach)
    if (profile.is_admin === true) {
      return true
    }

    // Fallback: premium subscription tier (backward compatibility)
    // This can be removed after migration is complete
    if (profile.subscription_tier === "sahib_al_waqf_premium") {
      return true
    }

    return false
  } catch (error) {
    console.error("[Admin] Error checking admin status:", error)
    return false
  }
}

