import { NextRequest, NextResponse } from "next/server"
import { getDonationById } from "@/lib/actions/donations"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await getDonationById(id)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }

    return NextResponse.json({ donation: result.donation })
  } catch (error) {
    console.error("[Donations API] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

