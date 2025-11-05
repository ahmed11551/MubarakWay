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
        await sendTelegramMessage(chatId, "Ассаляму алейкум! Я бот MubarakWay. Используйте /stats для статистики.")
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



