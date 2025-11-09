"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendEmail, getDonationConfirmationEmail, getCampaignDonationNotificationEmail } from "@/lib/email"
import { sendTelegramMessage, getCampaignDonationNotificationMessage } from "@/lib/telegram"

export type DonationInput = {
  amount: number
  currency: string
  donationType: "one_time" | "recurring"
  frequency?: "daily" | "weekly" | "monthly" | "yearly"
  category: "sadaqah" | "zakat" | "general"
  fundId?: string
  campaignId?: string
  message?: string
  isAnonymous: boolean
}

// Validation constants
const MIN_DONATION_AMOUNT = 1
const MAX_DONATION_AMOUNT = 10000000 // 10 million
const MAX_MESSAGE_LENGTH = 500
const VALID_CURRENCIES = ["RUB", "USD", "EUR"]
const VALID_CATEGORIES = ["sadaqah", "zakat", "general"]
const VALID_DONATION_TYPES = ["one_time", "recurring"]
const VALID_FREQUENCIES = ["daily", "weekly", "monthly", "yearly"]

function validateDonationInput(input: DonationInput): string | null {
  // Validate amount
  if (typeof input.amount !== "number" || Number.isNaN(input.amount)) {
    return "Сумма пожертвования должна быть числом"
  }
  if (input.amount < MIN_DONATION_AMOUNT) {
    return `Минимальная сумма пожертвования: ${MIN_DONATION_AMOUNT} ${input.currency || "RUB"}`
  }
  if (input.amount > MAX_DONATION_AMOUNT) {
    return `Максимальная сумма пожертвования: ${MAX_DONATION_AMOUNT.toLocaleString("ru-RU")} ${input.currency || "RUB"}`
  }

  // Validate currency
  if (!input.currency || !VALID_CURRENCIES.includes(input.currency)) {
    return `Неверная валюта. Допустимые валюты: ${VALID_CURRENCIES.join(", ")}`
  }

  // Validate donation type
  if (!VALID_DONATION_TYPES.includes(input.donationType)) {
    return `Неверный тип пожертвования. Допустимые типы: ${VALID_DONATION_TYPES.join(", ")}`
  }

  // Validate frequency for recurring donations
  if (input.donationType === "recurring") {
    if (!input.frequency || !VALID_FREQUENCIES.includes(input.frequency)) {
      return `Для регулярных пожертвований необходимо указать периодичность: ${VALID_FREQUENCIES.join(", ")}`
    }
  }

  // Validate category
  if (!input.category || !VALID_CATEGORIES.includes(input.category)) {
    return `Неверная категория. Допустимые категории: ${VALID_CATEGORIES.join(", ")}`
  }

  // Validate message length
  if (input.message && input.message.length > MAX_MESSAGE_LENGTH) {
    return `Сообщение не должно превышать ${MAX_MESSAGE_LENGTH} символов`
  }

  // Validate fundId and campaignId format (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (input.fundId && !uuidRegex.test(input.fundId)) {
    return "Неверный формат ID фонда"
  }
  if (input.campaignId && !uuidRegex.test(input.campaignId)) {
    return "Неверный формат ID кампании"
  }

  return null
}

export async function createDonation(input: DonationInput) {
  const supabase = await createClient()

  // Validate input data
  const validationError = validateDonationInput(input)
  if (validationError) {
    return { error: validationError }
  }

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "Для создания пожертвования необходимо войти в систему" }
  }

  try {
    // Insert donation record
    const { data: donation, error: donationError } = await supabase
      .from("donations")
      .insert({
        donor_id: user.id,
        fund_id: input.fundId || null,
        campaign_id: input.campaignId || null,
        amount: input.amount,
        currency: input.currency,
        donation_type: input.donationType === "one_time" ? "one_time" : "recurring",
        recurring_frequency: input.frequency || null,
        is_anonymous: input.isAnonymous,
        message: input.message || null,
        status: "pending",
      })
      .select()
      .single()

    if (donationError) {
      console.error("[v0] Donation creation error:", donationError)
      return { error: "Не удалось создать пожертвование. Проверьте данные и попробуйте снова." }
    }

    // NOTE: Do NOT update amounts here - they will be updated in webhook after successful payment
    // This prevents double-counting if payment fails or is cancelled

    revalidatePath("/")
    revalidatePath("/profile")

    // NOTE: Email confirmation will be sent in webhook after successful payment
    // This prevents sending emails for failed or cancelled payments

    return { success: true, donation }
  } catch (error) {
    console.error("[v0] Unexpected donation error:", error)
    return { error: "Произошла непредвиденная ошибка. Пожалуйста, попробуйте позже." }
  }
}

export async function getUserDonations() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { donations: [], error: "You must be logged in to view donations" }
    }

    const { data: donations, error } = await supabase
      .from("donations")
      .select(`
        *,
        funds:fund_id (name, logo_url),
        campaigns:campaign_id (title, image_url)
      `)
      .eq("donor_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Get donations error:", error)
      return { donations: [], error: "Failed to fetch donations" }
    }

    return { donations: donations || [] }
  } catch (error) {
    console.error("[v0] Get donations exception:", error)
    return { donations: [], error: "Failed to fetch donations" }
  }
}

export async function getAllDonations() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be logged in to view all donations" }
  }

  // TODO: Check if user is admin
  // For now, allow any logged-in user to view all donations

  try {
    const { data: donations, error } = await supabase
      .from("donations")
      .select(`
        *,
        profiles:donor_id (display_name, email),
        funds:fund_id (name),
        campaigns:campaign_id (title)
      `)
      .order("created_at", { ascending: false })
      .limit(100) // Limit to last 100 donations

    if (error) {
      console.error("[v0] Get all donations error:", error)
      return { donations: [], error: "Failed to fetch donations" }
    }

    return { donations: donations || [] }
  } catch (error) {
    console.error("[v0] Get all donations exception:", error)
    return { donations: [], error: "Failed to fetch donations" }
  }
}
