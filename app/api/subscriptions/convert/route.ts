import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Convert one-time donation to recurring subscription
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { donationId, amount, currency, frequency } = body

    if (!donationId || !amount || !currency || !frequency) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["weekly", "monthly"].includes(frequency)) {
      return NextResponse.json({ error: "Invalid frequency" }, { status: 400 })
    }

    // Get donation to verify ownership
    const { data: donation, error: donationError } = await supabase
      .from("donations")
      .select("*")
      .eq("id", donationId)
      .eq("donor_id", user.id)
      .single()

    if (donationError || !donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 })
    }

    // Check if subscription already exists for this donation
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("donor_id", user.id)
      .eq("amount", amount)
      .eq("currency", currency)
      .eq("frequency", frequency)
      .eq("status", "active")
      .single()

    if (existingSubscription) {
      return NextResponse.json({ 
        error: "Subscription already exists",
        subscription: existingSubscription 
      }, { status: 400 })
    }

    // Create subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .insert({
        donor_id: user.id,
        amount,
        currency,
        frequency,
        status: "active",
        payment_provider: donation.payment_provider || "cloudpayments",
        next_charge_at: calculateNextChargeDate(frequency),
      })
      .select()
      .single()

    if (subscriptionError || !subscription) {
      console.error("[Convert Subscription] Error:", subscriptionError)
      return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
    }

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error("[Convert Subscription] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function calculateNextChargeDate(frequency: "weekly" | "monthly"): string {
  const now = new Date()
  const nextDate = new Date(now)
  
  if (frequency === "weekly") {
    nextDate.setDate(now.getDate() + 7)
  } else if (frequency === "monthly") {
    nextDate.setMonth(now.getMonth() + 1)
  }
  
  return nextDate.toISOString()
}

