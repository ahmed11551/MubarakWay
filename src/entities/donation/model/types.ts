/**
 * Donation entity types (FSD entities layer)
 */

export interface Donation {
  id: string
  donor_id?: string | null
  fund_id?: string | null
  campaign_id?: string | null
  amount: number
  currency: string
  donation_type: "one_time" | "recurring" | "zakat" | "sadaqah"
  recurring_frequency?: "daily" | "weekly" | "monthly" | "yearly" | null
  is_anonymous: boolean
  message?: string | null
  status: "pending" | "completed" | "failed" | "refunded"
  payment_method?: string | null
  transaction_id?: string | null
  created_at: string
  updated_at: string
  profiles?: {
    display_name?: string
    avatar_url?: string
  }
  funds?: {
    name?: string
    logo_url?: string
  }
  campaigns?: {
    title?: string
    image_url?: string
  }
}

export interface DonationInput {
  amount: number
  currency: string
  donationType: "one_time" | "recurring"
  frequency?: "daily" | "weekly" | "monthly" | "yearly"
  category: "sadaqah" | "zakat" | "general"
  campaignId?: string
  message?: string
  isAnonymous: boolean
}

