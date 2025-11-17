/**
 * Централизованные типы для приложения
 */

// Campaign types
export interface Campaign {
  id: string
  title: string
  description: string
  story?: string
  goal_amount: number
  current_amount: number
  currency: string
  category: "medical" | "education" | "emergency" | "family" | "community" | "other" | "healthcare" | "water" | "orphans" | "general"
  image_url?: string | null
  deadline?: string | null
  status: "pending" | "active" | "completed" | "rejected"
  creator_id: string
  fund_id?: string | null
  donor_count?: number
  created_at: string
  updated_at: string
  documents?: Array<{ name: string; url: string }> | null
  profiles?: {
    display_name?: string
    avatar_url?: string
  }
  campaign_updates?: Array<{
    id: string
    title: string
    content: string
    image_url?: string | null
    created_at: string
  }>
}

export interface CampaignInput {
  title: string
  description: string
  story: string
  goalAmount: number
  currency: string
  category: "medical" | "education" | "emergency" | "family" | "community" | "other"
  imageUrl?: string
  deadline?: Date
  fundId?: string
  linkedProjectIds?: string[]
}

export interface TransformedCampaign {
  id: string
  title: string
  description: string
  goalAmount: number
  currentAmount: number
  category: string
  imageUrl: string
  donorCount: number
  daysLeft: number
  creatorName: string
  urgent?: boolean
}

// Donation types
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
  fundId?: string
  campaignId?: string
  message?: string
  isAnonymous: boolean
}

// Fund types
export interface Fund {
  id: string
  name?: string
  name_ru?: string
  name_ar?: string
  description?: string
  description_ru?: string
  logo_url?: string
  is_verified?: boolean
  is_active?: boolean
  total_raised?: number
  donor_count?: number
  category?: string
  created_at?: string
  updated_at?: string
}

export interface TransformedFund {
  id: string
  name: string
  nameAr?: string
  description: string
  logoUrl: string
  isVerified: boolean
  totalRaised: number
  donorCount: number
  category: string
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total?: number
  page?: number
  limit?: number
  hasMore?: boolean
}

// Error types
export interface ApiError {
  message: string
  code?: string
  statusCode: number
  context?: Record<string, unknown>
}

