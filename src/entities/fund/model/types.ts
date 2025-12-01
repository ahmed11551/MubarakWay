/**
 * Fund entity types (FSD entities layer)
 */

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
  description: string
  logoUrl: string
  isVerified: boolean
  totalRaised: number
  donorCount: number
  category: string
}

