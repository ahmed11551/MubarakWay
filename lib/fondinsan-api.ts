// Client for fondinsan.ru API
const FONDINSAN_API_BASE = process.env.FONDINSAN_API_BASE_URL || "https://fondinsan.ru/api/v1"
const FONDINSAN_ACCESS_TOKEN = process.env.FONDINSAN_ACCESS_TOKEN || "0xRs6obpvPOx4lkGLYxepBOcMju"

export type FondinsanProgram = {
  id: number
  title: string
  url: string
  short: string
  description: string
  created: string
  image: string
  default_amount: number
}

export type FondinsanApiResponse = {
  success: boolean
  status: number
  data: FondinsanProgram[]
}

/**
 * Fetch programs from Fondinsan API
 */
export async function fetchFondinsanPrograms(): Promise<FondinsanProgram[] | null> {
  try {
    const url = `${FONDINSAN_API_BASE}/programs?access-token=${FONDINSAN_ACCESS_TOKEN}`
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Fondinsan API returned ${response.status}`)
    }

    const data: FondinsanApiResponse = await response.json()

    if (!data.success || !Array.isArray(data.data)) {
      console.error("[Fondinsan API] Invalid response format:", data)
      return null
    }

    return data.data
  } catch (error) {
    console.error("[Fondinsan API] Error fetching programs:", error)
    return null
  }
}

/**
 * Fetch a single program by ID
 */
export async function fetchFondinsanProgramById(id: number): Promise<FondinsanProgram | null> {
  try {
    const url = `${FONDINSAN_API_BASE}/program/by-id/${id}?access-token=${FONDINSAN_ACCESS_TOKEN}`
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Fondinsan API returned ${response.status}`)
    }

    const data: FondinsanApiResponse = await response.json()

    if (!data.success || !data.data || data.data.length === 0) {
      console.error("[Fondinsan API] Invalid response format or program not found:", data)
      return null
    }

    return data.data[0]
  } catch (error) {
    console.error("[Fondinsan API] Error fetching program by ID:", error)
    return null
  }
}

/**
 * Transform Fondinsan program to fund format
 */
export function transformFondinsanProgramToFund(program: FondinsanProgram): any {
  // Extract category from title or description (if needed)
  // For now, we'll use "general" as default
  let category = "general"
  
  // Try to determine category from title/description
  const titleLower = program.title.toLowerCase()
  const descLower = program.description.toLowerCase()
  
  if (titleLower.includes("закят") || descLower.includes("закят")) {
    category = "zakat"
  } else if (titleLower.includes("сирот") || descLower.includes("сирот") || titleLower.includes("опекун")) {
    category = "orphans"
  } else if (titleLower.includes("вода") || descLower.includes("вода") || titleLower.includes("колодец")) {
    category = "water"
  } else if (titleLower.includes("мечеть") || descLower.includes("мечеть") || titleLower.includes("уборка")) {
    category = "mosque"
  } else if (titleLower.includes("образование") || descLower.includes("образование") || titleLower.includes("хифз")) {
    category = "education"
  } else if (titleLower.includes("медицин") || descLower.includes("медицин")) {
    category = "healthcare"
  } else if (titleLower.includes("экстрен") || descLower.includes("экстрен")) {
    category = "emergency"
  }

  return {
    id: `fondinsan_${program.id}`,
    name: program.title,
    name_ru: program.title,
    description: program.short || program.description.replace(/<[^>]*>/g, "").substring(0, 500),
    description_ru: program.description,
    category: category,
    logo_url: program.image,
    image_url: program.image,
    website_url: program.url,
    is_active: true,
    is_verified: true,
    total_raised: 0, // API doesn't provide this
    donor_count: 0, // API doesn't provide this
    default_amount: program.default_amount,
    created_at: program.created,
    // Mark as external fund
    source: "fondinsan",
    external_id: program.id.toString(),
  }
}

/**
 * Transform Fondinsan programs array to funds array
 */
export function transformFondinsanProgramsToFunds(programs: FondinsanProgram[]): any[] {
  return programs.map(transformFondinsanProgramToFund)
}

