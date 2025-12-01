import { NextRequest, NextResponse } from "next/server"
import { searchCampaigns } from "@/lib/actions/campaigns"
import { handleApiError } from "@/lib/error-handler"
import { searchCampaignsQuerySchema } from "@/lib/schemas/api"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get("q") || searchParams.get("query") || ""
    const category = searchParams.get("category") || undefined
    const status = searchParams.get("status") || "active"
    const limit = parseInt(searchParams.get("limit") || "10")

    // Валидация параметров
    const validationResult = searchCampaignsQuerySchema.safeParse({
      query,
      category,
      status,
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    if (!query.trim()) {
      return NextResponse.json({ campaigns: [] })
    }

    const result = await searchCampaigns(query, category, status)
    
    if (result.error) {
      const apiError = handleApiError(new Error(result.error))
      return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
    }

    // Limit results
    const campaigns = (result.campaigns || []).slice(0, limit)

    return NextResponse.json({ campaigns })
  } catch (err) {
    const apiError = handleApiError(err)
    return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
  }
}

