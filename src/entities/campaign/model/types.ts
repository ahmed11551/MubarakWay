/**
 * Campaign entity types (FSD entities layer)
 */

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
  story?: string
  goalAmount: number
  currency: string
  category: Campaign["category"]
  imageUrl?: string | null
  deadline?: string | null
  fundId?: string | null
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
  daysLeft: number | null
  creatorName: string
  urgent?: boolean
}

