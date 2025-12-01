import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import { ErrorBoundary } from "@/components/error-boundary"
import { TelegramProvider } from "@/components/telegram-provider"
import { PWAServiceWorker } from "@/components/pwa-service-worker"
import { PrayerTimesPopup } from "@/components/prayer-times-popup"
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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MubarakWay",
  },
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

export const viewport: Viewport = {
  themeColor: "#16a34a",
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#16a34a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MubarakWay" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512x512.png" />
      </head>
      <body className={`font-sans antialiased`}>
        <ErrorBoundary>
          <TelegramProvider>
            {children}
          </TelegramProvider>
        </ErrorBoundary>
        <Toaster />
        <Analytics />
        <PWAServiceWorker />
        <PrayerTimesPopup />
      </body>
    </html>
  )
}
