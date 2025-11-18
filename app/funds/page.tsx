// FSD widgets
import { AppHeader } from "@/widgets/header/ui/app-header"
import { BottomNav } from "@/widgets/navigation/ui/bottom-nav"
// FSD entities
import { getFunds } from "@/entities/fund/api"
import { FundsClient } from "./funds-client"
import type { Metadata } from "next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mubarakway.app"

export const metadata: Metadata = {
  title: "Фонды-партнёры",
  description: "Поддержите проверенные благотворительные организации. Фонды-партнёры MubarakWay с проверенной репутацией.",
  openGraph: {
    title: "Фонды-партнёры | MubarakWay",
    description: "Поддержите проверенные благотворительные организации",
    url: `${siteUrl}/funds`,
  },
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function FundsPage() {
  // Fetch funds from Supabase with error handling
  // Try multiple approaches to ensure we get funds
  let result
  try {
    // First try: direct getFunds call
    result = await getFunds()
    // Debug logging
    console.log("[FundsPage] getFunds result:", {
      fundsCount: result.funds?.length || 0,
      error: result.error,
      funds: result.funds?.map((f: any) => ({ id: f.id, name: f.name })),
    })
    
    // If no funds and no error, try API route as fallback
    if ((!result.funds || result.funds.length === 0) && !result.error) {
      console.log("[FundsPage] Trying API route as fallback...")
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mubarak-way.vercel.app'
        const apiUrl = `${baseUrl}/api/funds`
        const apiResponse = await fetch(apiUrl, { 
          cache: 'no-store',
          next: { revalidate: 0 }
        })
        if (apiResponse.ok) {
          const apiData = await apiResponse.json()
          if (apiData.funds && apiData.funds.length > 0) {
            console.log("[FundsPage] Funds loaded via API route:", apiData.funds.length)
            result = { funds: apiData.funds }
          }
        }
      } catch (apiError) {
        console.warn("[FundsPage] API route fallback failed:", apiError)
        // Continue with original result
      }
    }
  } catch (error) {
    console.error("[FundsPage] Error fetching funds:", error)
    result = { funds: [], error: `Failed to load funds: ${error instanceof Error ? error.message : "Unknown error"}` }
  }
  
  let funds = result.funds || []
  
  // Если фонды не найдены, но ошибки нет - возможно проблема с RLS или переменными окружения
  if (funds.length === 0 && !("error" in result) || !result.error) {
    console.warn("[FundsPage] No funds found but no error. Possible RLS or env vars issue.")
    result = { ...result, error: "Фонды не найдены. Возможно проблема с настройками базы данных или переменными окружения." }
  }
  
  // Если есть ошибка, но она связана с переменными окружения, попробуем показать более понятное сообщение
  if ("error" in result && result.error && (result.error.includes("Missing Supabase") || result.error.includes("environment variables"))) {
    console.error("[FundsPage] Environment variables issue detected")
    result = { ...result, error: "Ошибка конфигурации: переменные окружения Supabase не установлены. Обратитесь к администратору." }
  }
  
  // Additional debug
  if (funds.length === 0) {
    console.warn("[FundsPage] No funds to display. Result:", {
      fundsCount: funds.length,
      error: result.error,
      hasResult: !!result,
    })
  }

  return (
    <div className="min-h-screen pb-20">
      <AppHeader />
      <FundsClient initialFunds={funds} initialError={"error" in result ? result.error : undefined} />
      <BottomNav />
    </div>
  )
}
