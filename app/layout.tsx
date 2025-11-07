import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import { ErrorBoundary } from "@/components/error-boundary"
import { TelegramProvider } from "@/components/telegram-provider"
import "./globals.css"

const _geist = Geist({ subsets: ["latin", "latin-ext"] })
const _geistMono = Geist_Mono({ subsets: ["latin", "latin-ext"] })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mubarakway.app"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MubarakWay - Садака-Пасс",
    template: "%s | MubarakWay",
  },
  description: "Исламская платформа благотворительности - Измените мир своими пожертвованиями. Поддержите проверенные благотворительные фонды и кампании.",
  keywords: ["благотворительность", "садака", "закят", "ислам", "пожертвования", "фонды", "кампании"],
  authors: [{ name: "MubarakWay" }],
  creator: "MubarakWay",
  publisher: "MubarakWay",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: siteUrl,
    siteName: "MubarakWay",
    title: "MubarakWay - Садака-Пасс",
    description: "Исламская платформа благотворительности - Измените мир своими пожертвованиями",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "MubarakWay - Исламская платформа благотворительности",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MubarakWay - Садака-Пасс",
    description: "Исламская платформа благотворительности - Измените мир своими пожертвованиями",
    images: [`${siteUrl}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add verification codes if needed
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
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
          <TelegramProvider>
            {children}
          </TelegramProvider>
        </ErrorBoundary>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
