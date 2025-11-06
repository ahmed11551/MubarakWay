import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import { ErrorBoundary } from "@/components/error-boundary"
import "./globals.css"

const _geist = Geist({ subsets: ["latin", "latin-ext"] })
const _geistMono = Geist_Mono({ subsets: ["latin", "latin-ext"] })

export const metadata: Metadata = {
  title: "MubarakWay - Садака-Пасс",
  description: "Исламская платформа благотворительности - Измените мир своими пожертвованиями",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" async></script>
      </head>
      <body className={`font-sans antialiased`}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
