import { updateSession } from "@/lib/supabase/middleware"
import type { NextRequest } from "next/server"

// Simplified middleware - i18n will be handled client-side for now
// Full i18n routing requires app/[locale] structure which we'll implement gradually
export async function middleware(request: NextRequest) {
  // Handle Supabase session
  const supabaseResponse = await updateSession(request)
  return supabaseResponse
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
