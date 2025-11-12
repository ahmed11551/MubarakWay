// Telegram Bot API utilities
const TELEGRAM_API_BASE = "https://api.telegram.org"

export interface TelegramInlineKeyboardButton {
  text: string
  url?: string
  callback_data?: string
  web_app?: { url: string }
}

export interface TelegramInlineKeyboard {
  inline_keyboard: TelegramInlineKeyboardButton[][]
}

export interface TelegramReplyKeyboard {
  keyboard: TelegramInlineKeyboardButton[][]
  resize_keyboard?: boolean
  one_time_keyboard?: boolean
}

/**
 * Send message to Telegram chat
 */
export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  options?: {
    parse_mode?: "HTML" | "Markdown" | "MarkdownV2"
    reply_markup?: TelegramInlineKeyboard | TelegramReplyKeyboard
    disable_web_page_preview?: boolean
  }
): Promise<{ success: boolean; error?: string; message_id?: number }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    console.warn("[Telegram Bot] TELEGRAM_BOT_TOKEN not configured")
    return { success: false, error: "Telegram bot token not configured" }
  }

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options?.parse_mode || "HTML",
        reply_markup: options?.reply_markup,
        disable_web_page_preview: options?.disable_web_page_preview,
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.ok) {
      console.error("[Telegram Bot] Send error:", data)
      return { success: false, error: data.description || "Failed to send message" }
    }

    return { success: true, message_id: data.result.message_id }
  } catch (error) {
    console.error("[Telegram Bot] Unexpected error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Answer callback query (for inline buttons)
 */
export async function answerCallbackQuery(
  callbackQueryId: string,
  options?: {
    text?: string
    show_alert?: boolean
    url?: string
  }
): Promise<{ success: boolean; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    return { success: false, error: "Telegram bot token not configured" }
  }

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/bot${botToken}/answerCallbackQuery`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: options?.text,
        show_alert: options?.show_alert || false,
        url: options?.url,
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.ok) {
      console.error("[Telegram Bot] Answer callback error:", data)
      return { success: false, error: data.description || "Failed to answer callback" }
    }

    return { success: true }
  } catch (error) {
    console.error("[Telegram Bot] Answer callback error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Edit message text (for updating inline keyboards)
 */
export async function editMessageText(
  chatId: number | string,
  messageId: number,
  text: string,
  options?: {
    parse_mode?: "HTML" | "Markdown" | "MarkdownV2"
    reply_markup?: TelegramInlineKeyboard
  }
): Promise<{ success: boolean; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    return { success: false, error: "Telegram bot token not configured" }
  }

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/bot${botToken}/editMessageText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: options?.parse_mode || "HTML",
        reply_markup: options?.reply_markup,
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.ok) {
      console.error("[Telegram Bot] Edit message error:", data)
      return { success: false, error: data.description || "Failed to edit message" }
    }

    return { success: true }
  } catch (error) {
    console.error("[Telegram Bot] Edit message error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Delete message
 */
export async function deleteMessage(chatId: number | string, messageId: number): Promise<{ success: boolean; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    return { success: false, error: "Telegram bot token not configured" }
  }

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/bot${botToken}/deleteMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.ok) {
      console.error("[Telegram Bot] Delete message error:", data)
      return { success: false, error: data.description || "Failed to delete message" }
    }

    return { success: true }
  } catch (error) {
    console.error("[Telegram Bot] Delete message error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Create inline keyboard for main menu
 */
export function createMainMenuKeyboard(): TelegramInlineKeyboard {
  const webAppUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mubarak-way.vercel.app"
  
  return {
    inline_keyboard: [
      [
        { text: "💎 Подписка", callback_data: "menu:subscription" },
        { text: "💰 Пожертвовать", callback_data: "menu:donate" },
      ],
      [
        { text: "🧮 Калькулятор закята", callback_data: "menu:zakat" },
      ],
      [
        { text: "📊 Статистика", callback_data: "menu:stats" },
        { text: "🌐 Открыть Mini App", web_app: { url: webAppUrl } },
      ],
    ],
  }
}

/**
 * Create inline keyboard for subscription plans
 */
export function createSubscriptionPlansKeyboard(): TelegramInlineKeyboard {
  const webAppUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mubarak-way.vercel.app"
  
  return {
    inline_keyboard: [
      [
        { text: "⭐ Муслим (Бесплатно)", callback_data: "subscription:plan:muslim" },
      ],
      [
        { text: "✨ Мутахсин (Pro)", callback_data: "subscription:plan:mutahsin" },
      ],
      [
        { text: "👑 Сахиб аль-Вакф (Premium)", callback_data: "subscription:plan:premium" },
      ],
      [
        { text: "◀️ Назад", callback_data: "menu:main" },
      ],
    ],
  }
}

/**
 * Create inline keyboard for subscription periods
 */
export function createSubscriptionPeriodsKeyboard(plan: string): TelegramInlineKeyboard {
  const webAppUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mubarak-way.vercel.app"
  
  const periods = [
    { text: "1 месяц", callback_data: `subscription:period:${plan}:1month` },
    { text: "3 месяца", callback_data: `subscription:period:${plan}:3months` },
    { text: "6 месяцев", callback_data: `subscription:period:${plan}:6months` },
    { text: "12 месяцев", callback_data: `subscription:period:${plan}:12months` },
  ]
  
  return {
    inline_keyboard: [
      [
        { text: "1 месяц", callback_data: `subscription:period:${plan}:1month` },
        { text: "3 месяца", callback_data: `subscription:period:${plan}:3months` },
      ],
      [
        { text: "6 месяцев", callback_data: `subscription:period:${plan}:6months` },
        { text: "12 месяцев", callback_data: `subscription:period:${plan}:12months` },
      ],
      [
        { text: "◀️ Назад к тарифам", callback_data: "menu:subscription" },
      ],
    ],
  }
}

/**
 * Create inline keyboard for donation type selection
 */
export function createDonationTypeKeyboard(): TelegramInlineKeyboard {
  return {
    inline_keyboard: [
      [
        { text: "🏛️ Фонд", callback_data: "donate:type:fund" },
        { text: "🎯 Проект", callback_data: "donate:type:campaign" },
      ],
      [
        { text: "◀️ Назад", callback_data: "menu:main" },
      ],
    ],
  }
}

/**
 * Create inline keyboard for quick support donations (500 / 1000 / 2500 ₽)
 */
export function createQuickSupportKeyboard(): TelegramInlineKeyboard {
  const webAppUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mubarak-way.vercel.app"
  
  return {
    inline_keyboard: [
      [
        { text: "500 ₽", web_app: { url: `${webAppUrl}/donate?amount=500&type=project` } },
        { text: "1000 ₽", web_app: { url: `${webAppUrl}/donate?amount=1000&type=project` } },
      ],
      [
        { text: "2500 ₽", web_app: { url: `${webAppUrl}/donate?amount=2500&type=project` } },
      ],
      [
        { text: "◀️ Главное меню", callback_data: "menu:main" },
      ],
    ],
  }
}

/**
 * Create inline keyboard for funds list
 */
export function createFundsKeyboard(funds: Array<{ id: string; name: string }>, page: number = 0, pageSize: number = 5): TelegramInlineKeyboard {
  const start = page * pageSize
  const end = start + pageSize
  const pageFunds = funds.slice(start, end)
  
  const buttons: TelegramInlineKeyboardButton[][] = pageFunds.map(fund => [
    { text: fund.name, callback_data: `donate:fund:${fund.id}` },
  ])
  
  // Pagination buttons
  const navButtons: TelegramInlineKeyboardButton[] = []
  if (page > 0) {
    navButtons.push({ text: "◀️ Предыдущие", callback_data: `donate:funds:page:${page - 1}` })
  }
  if (end < funds.length) {
    navButtons.push({ text: "Следующие ▶️", callback_data: `donate:funds:page:${page + 1}` })
  }
  
  if (navButtons.length > 0) {
    buttons.push(navButtons)
  }
  
  buttons.push([
    { text: "◀️ Назад", callback_data: "menu:donate" },
  ])
  
  return {
    inline_keyboard: buttons,
  }
}

/**
 * Create inline keyboard for campaigns list
 */
export function createCampaignsKeyboard(campaigns: Array<{ id: string; title: string }>, page: number = 0, pageSize: number = 5): TelegramInlineKeyboard {
  const start = page * pageSize
  const end = start + pageSize
  const pageCampaigns = campaigns.slice(start, end)
  
  const buttons: TelegramInlineKeyboardButton[][] = pageCampaigns.map(campaign => [
    { text: campaign.title.length > 30 ? campaign.title.substring(0, 30) + "..." : campaign.title, callback_data: `donate:campaign:${campaign.id}` },
  ])
  
  // Pagination buttons
  const navButtons: TelegramInlineKeyboardButton[] = []
  if (page > 0) {
    navButtons.push({ text: "◀️ Предыдущие", callback_data: `donate:campaigns:page:${page - 1}` })
  }
  if (end < campaigns.length) {
    navButtons.push({ text: "Следующие ▶️", callback_data: `donate:campaigns:page:${page + 1}` })
  }
  
  if (navButtons.length > 0) {
    buttons.push(navButtons)
  }
  
  buttons.push([
    { text: "◀️ Назад", callback_data: "menu:donate" },
  ])
  
  return {
    inline_keyboard: buttons,
  }
}

/**
 * Create inline keyboard for donation amount selection
 */
export function createDonationAmountKeyboard(targetId: string, targetType: "fund" | "campaign"): TelegramInlineKeyboard {
  const amounts = [500, 1000, 2500, 5000, 10000]
  
  return {
    inline_keyboard: [
      amounts.map(amount => [
        { text: `${amount} ₽`, callback_data: `donate:amount:${targetType}:${targetId}:${amount}` },
      ]).flat(),
      [
        { text: "💵 Другая сумма", callback_data: `donate:custom:${targetType}:${targetId}` },
      ],
      [
        { text: "◀️ Назад", callback_data: targetType === "fund" ? "donate:type:fund" : "donate:type:campaign" },
      ],
    ],
  }
}

/**
 * Create inline keyboard for payment (opens Mini App)
 */
export function createPaymentKeyboard(paymentUrl: string): TelegramInlineKeyboard {
  return {
    inline_keyboard: [
      [
        { text: "💳 Оплатить", web_app: { url: paymentUrl } },
      ],
      [
        { text: "◀️ Отмена", callback_data: "menu:main" },
      ],
    ],
  }
}

/**
 * Create inline keyboard for zakat calculator
 */
export function createZakatCalculatorKeyboard(): TelegramInlineKeyboard {
  const webAppUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mubarak-way.vercel.app"
  
  return {
    inline_keyboard: [
      [
        { text: "🧮 Рассчитать закят", web_app: { url: `${webAppUrl}/zakat-calculator` } },
      ],
      [
        { text: "ℹ️ О закяте", callback_data: "zakat:info" },
      ],
      [
        { text: "◀️ Назад", callback_data: "menu:main" },
      ],
    ],
  }
}

