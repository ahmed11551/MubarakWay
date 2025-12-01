import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { handleApiError } from "@/lib/error-handler"
import { z } from "zod"

const convertSubscriptionSchema = z.object({
  donationId: z.string().uuid("Invalid donation ID"),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().length(3, "Currency must be 3 characters"),
  frequency: z.enum(["weekly", "monthly"], { errorMap: () => ({ message: "Frequency must be weekly or monthly" }) }),
})

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
    
    // Валидация с помощью Zod
    const validationResult = convertSubscriptionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.errors },
        { status: 400 }
      )
    }
    
    const { donationId, amount, currency, frequency } = validationResult.data

    // Get donation to verify ownership
    const { data: donation, error: donationError } = await supabase
      .from("donations")
      .select("*")
      .eq("id", donationId)
      .eq("donor_id", user.id)
      .single()

    if (donationError || !donation) {
      const apiError = handleApiError(donationError || new Error("Donation not found"))
      return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
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
      const apiError = handleApiError(subscriptionError || new Error("Failed to create subscription"))
      return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
    }

    return NextResponse.json({ subscription })
  } catch (error) {
    const apiError = handleApiError(error)
    return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
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

