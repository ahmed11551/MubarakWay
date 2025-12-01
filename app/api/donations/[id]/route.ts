import { NextRequest, NextResponse } from "next/server"
import { getDonationById } from "@/lib/actions/donations"
import { handleApiError } from "@/lib/error-handler"
import { getDonationParamsSchema } from "@/lib/schemas/api"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Валидация параметров
    const validationResult = getDonationParamsSchema.safeParse({ id })
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid donation ID", details: validationResult.error.errors },
        { status: 400 }
      )
    }
    
    const result = await getDonationById(validationResult.data.id)

    if (result.error) {
      const apiError = handleApiError(new Error(result.error))
      return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
    }

    return NextResponse.json({ donation: result.donation })
  } catch (error) {
    const apiError = handleApiError(error)
    return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode })
  }
}

