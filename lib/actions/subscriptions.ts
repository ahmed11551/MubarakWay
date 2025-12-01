"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type SubscriptionInput = {
  tier: "mutahsin_pro" | "sahib_al_waqf_premium"
  billingFrequency: "monthly" | "yearly"
  amount: number
  currency: string
}

export async function createSubscription(input: SubscriptionInput) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be logged in to create a subscription" }
  }

  try {
    // Calculate next billing date
    const nextBillingDate = new Date()
    if (input.billingFrequency === "monthly") {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
    } else {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1)
    }

    // Insert subscription record
    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: user.id,
        tier: input.tier,
        amount: input.amount,
        currency: input.currency,
        billing_frequency: input.billingFrequency,
        next_billing_date: nextBillingDate.toISOString(),
        status: "active",
      })
      .select()
      .single()

    if (subscriptionError) {
      console.error("[v0] Subscription creation error:", subscriptionError)
      return { error: "Failed to create subscription" }
    }

    revalidatePath("/profile")
    revalidatePath("/subscription")

    return { success: true, subscription }
  } catch (error) {
    console.error("[v0] Unexpected subscription error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function getUserSubscriptions() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be logged in to view subscriptions" }
  }

  try {
    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Get subscriptions error:", error)
      return { error: "Failed to fetch subscriptions" }
    }

    return { subscriptions: subscriptions || [] }
  } catch (error) {
    console.error("[v0] Get subscriptions exception:", error)
    return { subscriptions: [], error: "Failed to fetch subscriptions" }
  }
}

export async function cancelSubscription(subscriptionId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be logged in to cancel subscriptions" }
  }

  try {
    // Verify subscription belongs to user
    const { data: subscription, error: fetchError } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("id", subscriptionId)
      .single()

    if (fetchError || !subscription || subscription.user_id !== user.id) {
      return { error: "Subscription not found" }
    }

    // Update subscription status
    const { data: updatedSubscription, error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Subscription cancellation error:", updateError)
      return { error: "Failed to cancel subscription" }
    }

    revalidatePath("/profile")
    revalidatePath("/subscription")

    return { success: true, subscription: updatedSubscription }
  } catch (error) {
    console.error("[v0] Unexpected cancellation error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function pauseSubscription(subscriptionId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be logged in to pause subscriptions" }
  }

  try {
    // Verify subscription belongs to user
    const { data: subscription, error: fetchError } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("id", subscriptionId)
      .single()

    if (fetchError || !subscription || subscription.user_id !== user.id) {
      return { error: "Subscription not found" }
    }

    // Update subscription status
    const { data: updatedSubscription, error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "paused",
      })
      .eq("id", subscriptionId)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Subscription pause error:", updateError)
      return { error: "Failed to pause subscription" }
    }

    revalidatePath("/profile")
    revalidatePath("/subscription")

    return { success: true, subscription: updatedSubscription }
  } catch (error) {
    console.error("[v0] Unexpected pause error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function resumeSubscription(subscriptionId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be logged in to resume subscriptions" }
  }

  try {
    // Verify subscription belongs to user
    const { data: subscription, error: fetchError } = await supabase
      .from("subscriptions")
      .select("user_id, billing_frequency")
      .eq("id", subscriptionId)
      .single()

    if (fetchError || !subscription || subscription.user_id !== user.id) {
      return { error: "Subscription not found" }
    }

    // Calculate next billing date based on billing frequency
    const nextBillingDate = new Date()
    if (subscription.billing_frequency === "monthly") {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
    } else {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1)
    }

    // Update subscription status
    const { data: updatedSubscription, error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "active",
        next_billing_date: nextBillingDate.toISOString(),
      })
      .eq("id", subscriptionId)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Subscription resume error:", updateError)
      return { error: "Failed to resume subscription" }
    }

    revalidatePath("/profile")
    revalidatePath("/subscription")

    return { success: true, subscription: updatedSubscription }
  } catch (error) {
    console.error("[v0] Unexpected resume error:", error)
    return { error: "An unexpected error occurred" }
  }
}

