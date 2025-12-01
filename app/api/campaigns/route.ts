import { NextRequest, NextResponse } from "next/server"
import { getCampaigns } from "@/lib/actions/campaigns"
import { fetchBotApiCampaigns } from "@/lib/bot-api"
import { handleApiError } from "@/lib/error-handler"
import { getCampaignsQuerySchema } from "@/lib/schemas/api"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    
    // Валидация параметров запроса с помощью Zod
    const queryParams = {
      status: searchParams.get("status") || undefined,
      limit: searchParams.get("limit") || undefined,
      ids: searchParams.get("ids") || undefined,
    }
    
    const validationResult = getCampaignsQuerySchema.safeParse(queryParams)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validationResult.error.errors },
        { status: 400 }
      )
    }
    
    const { status, limit, ids } = validationResult.data

    // Если запрашиваются конкретные ID - используем batch-запрос вместо цикла
    if (ids) {
      const { createClient } = await import("@/lib/supabase/server")
      const supabase = await createClient()
      const idArray = ids.split(",").filter(Boolean)
      
      if (idArray.length === 0) {
        return NextResponse.json({ error: "No valid IDs provided" }, { status: 400 })
      }
      
      // Batch-запрос с .in() вместо цикла
      const { data: campaigns, error } = await supabase
        .from("campaigns")
        .select(`
          *,
          profiles:creator_id (display_name, avatar_url),
          campaign_updates (*)
        `)
        .in("id", idArray)
      
      if (error) {
        const apiError = handleApiError(error)
        return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
      }
      
      return NextResponse.json({ campaigns: campaigns || [] })
    }

    // Try to fetch from bot.e-replika.ru API first
    const botApiCampaigns = await fetchBotApiCampaigns(status, limit)
    if (botApiCampaigns && Array.isArray(botApiCampaigns) && botApiCampaigns.length > 0) {
      return NextResponse.json({ campaigns: botApiCampaigns })
    }

    // Fallback to Supabase
    const result = await getCampaigns(status)
    
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

