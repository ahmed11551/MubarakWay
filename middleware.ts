import createMiddleware from "next-intl/middleware"
import { updateSession } from "@/lib/supabase/middleware"
import { locales, defaultLocale } from "./i18n"

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "as-needed", // Don't prefix default locale (ru)
})

export async function middleware(request: any) {
  // First, handle Supabase session
  const supabaseResponse = await updateSession(request)
  
  // Then, handle i18n routing
  const intlResponse = intlMiddleware(request)
  
  // Return the appropriate response
  // If Supabase middleware returned a redirect, use it; otherwise use intl response
  return supabaseResponse || intlResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
