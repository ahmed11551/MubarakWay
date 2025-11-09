import { NextRequest, NextResponse } from "next/server"
import { getPlatformStats } from "@/lib/stats"

const TELEGRAM_API_BASE = "https://api.telegram.org"

function verifySecret(req: NextRequest) {
  const incoming = req.headers.get("x-telegram-bot-api-secret-token") || ""
  const expected = process.env.TELEGRAM_SECRET_TOKEN || ""
  return expected && incoming === expected
}

async function sendTelegramMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return
  await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
    cache: "no-store",
  })
}

export async function POST(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const update = await req.json().catch(() => null)
  if (!update) return NextResponse.json({ ok: true })

  try {
    const message = update?.message
    const chatId: number | undefined = message?.chat?.id
    const text: string | undefined = message?.text

    if (chatId && text) {
      if (text.startsWith("/start")) {
        // Обработка deep links: /start campaign_123 или /start donate_456
        const params = text.split(" ")[1] // Получаем параметр после /start
        
        if (params) {
          // Определяем тип deep link
          if (params.startsWith("campaign_")) {
            const campaignId = params.replace("campaign_", "")
            const webAppUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mubarak-way.vercel.app"
            const deepLink = `${webAppUrl}/campaigns/${campaignId}`
            
            await sendTelegramMessage(
              chatId,
              `🎯 Открываю кампанию...\n\nПерейдите по ссылке: ${deepLink}\n\nИли откройте в Telegram Mini App.`
            )
          } else if (params.startsWith("donate_")) {
            const donationId = params.replace("donate_", "")
            const webAppUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mubarak-way.vercel.app"
            const deepLink = `${webAppUrl}/donate?campaignId=${donationId}`
            
            await sendTelegramMessage(
              chatId,
              `💰 Быстрое пожертвование\n\nПерейдите по ссылке: ${deepLink}\n\nИли откройте в Telegram Mini App.`
            )
          } else {
            // Неизвестный параметр
            await sendTelegramMessage(chatId, "Ассаляму алейкум! Я бот MubarakWay. Используйте /stats для статистики.")
          }
        } else {
          // Обычный /start без параметров
          await sendTelegramMessage(chatId, "Ассаляму алейкум! Я бот MubarakWay. Используйте /stats для статистики.")
        }
      } else if (text.startsWith("/stats")) {
        const stats = await getPlatformStats()
        const formatted = [
          `Всего собрано: ${Math.round(stats.totalCollected)}`,
          `Активных доноров: ${stats.activeDonors}`,
          `Активных кампаний: ${stats.activeCampaigns}`,
          `Средний чек: ${Math.round(stats.averageCheck)}`,
        ].join("\n")
        await sendTelegramMessage(chatId, formatted)
      } else {
        await sendTelegramMessage(chatId, "Команда не распознана. Доступно: /stats")
      }
    }
  } catch (e) {
    // swallow
  }

  return NextResponse.json({ ok: true })
}



