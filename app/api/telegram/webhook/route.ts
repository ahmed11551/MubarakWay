import { NextRequest, NextResponse } from "next/server"
import { getPlatformStats } from "@/lib/stats"
import {
  sendTelegramMessage,
  answerCallbackQuery,
  editMessageText,
  createMainMenuKeyboard,
  createSubscriptionPlansKeyboard,
  createSubscriptionPeriodsKeyboard,
  createDonationTypeKeyboard,
  createFundsKeyboard,
  createCampaignsKeyboard,
  createDonationAmountKeyboard,
  createPaymentKeyboard,
  createZakatCalculatorKeyboard,
  createQuickSupportKeyboard,
} from "@/lib/telegram-bot"
import { getFunds } from "@/lib/actions/funds"
import { getCampaigns } from "@/lib/actions/campaigns"
import { handleApiError } from "@/lib/error-handler"

function verifySecret(req: NextRequest) {
  const incoming = req.headers.get("x-telegram-bot-api-secret-token") || ""
  const expected = process.env.TELEGRAM_SECRET_TOKEN || ""
  return expected && incoming === expected
}

// Subscription plans data
const SUBSCRIPTION_PLANS = {
  muslim: {
    name: "Муслим",
    subtitle: "Базовый",
    tier: null,
    free: true,
    description: "Начните свой путь садака-джария",
    features: [
      "Доступ к базовым функциям",
      "История пожертвований",
      "Уведомления о кампаниях",
      "Поддержка сообщества",
    ],
  },
  mutahsin: {
    name: "Мутахсин",
    subtitle: "Pro",
    tier: "mutahsin_pro",
    free: false,
    description: "Для тех, кто стремится к большему",
    features: [
      "Все функции Базового",
      "Приоритетная поддержка",
      "Расширенная аналитика",
      "Эксклюзивный контент",
      "5% в благотворительность",
    ],
    prices: {
      "1month": { price: 260, charity: 13, period: "1 месяц" },
      "3months": { price: 870, charity: 43.5, period: "3 месяца" },
      "6months": { price: 1300, charity: 65, period: "6 месяцев", bonus: "+1 мес в подарок" },
      "12months": { price: 2340, charity: 234, period: "12 месяцев", bonus: "+3 мес в подарок" },
    },
  },
  premium: {
    name: "Сахиб аль-Вакф",
    subtitle: "Premium",
    tier: "sahib_al_waqf_premium",
    free: false,
    description: "Максимальный вклад в умму",
    features: [
      "Все функции Pro",
      "VIP поддержка 24/7",
      "Персональный менеджер",
      "Доступ к закрытым мероприятиям",
      "Именной сертификат",
      "10% в благотворительность",
    ],
    prices: {
      "1month": { price: 550, charity: 55, period: "1 месяц" },
      "3months": { price: 1650, charity: 165, period: "3 месяца" },
      "6months": { price: 2750, charity: 137.5, period: "6 месяцев", bonus: "+1 мес в подарок" },
      "12months": { price: 4950, charity: 495, period: "12 месяцев", bonus: "+3 мес в подарок" },
    },
  },
}

// Telegram types
interface TelegramCallbackQuery {
  id: string
  from: {
    id: number
    first_name?: string
    last_name?: string
    username?: string
  }
  message?: {
    chat: { id: number }
    message_id: number
  }
  data: string
}

interface TelegramMessage {
  message_id: number
  from: {
    id: number
    first_name?: string
    last_name?: string
    username?: string
  }
  chat: { id: number; type: string }
  text?: string
  date: number
}

// Handle callback queries (inline button clicks)
async function handleCallbackQuery(callbackQuery: TelegramCallbackQuery) {
  const chatId = callbackQuery.message?.chat?.id
  const messageId = callbackQuery.message?.message_id
  const callbackData = callbackQuery.data
  const callbackQueryId = callbackQuery.id

  if (!chatId || !callbackData || !callbackQueryId) {
    console.warn("[Telegram Webhook] Invalid callback query:", { chatId, callbackData, callbackQueryId })
    return
  }
  
  // Handle inline queries (without message)
  if (!messageId) {
    await answerCallbackQuery(callbackQueryId, { text: "Эта команда недоступна в inline режиме", show_alert: true })
    return
  }

  const webAppUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mubarak-way.vercel.app"

  // Main menu
  if (callbackData === "menu:main") {
    await answerCallbackQuery(callbackQueryId, { text: "Главное меню" })
    const keyboard = createMainMenuKeyboard()
    const result = await editMessageText(
      chatId,
      messageId,
      "🌙 <b>Ассаляму алейкум!</b>\n\nДобро пожаловать в MubarakWay — платформу для садака-джария.\n\nВыберите действие:",
      { reply_markup: keyboard }
    )
    
    if (!result.success) {
      await sendTelegramMessage(
        chatId,
        "🌙 <b>Ассаляму алейкум!</b>\n\nДобро пожаловать в MubarakWay — платформу для садака-джария.\n\nВыберите действие:",
        { reply_markup: keyboard }
      )
    }
    return
  }

  // Subscription menu
  if (callbackData === "menu:subscription") {
    await answerCallbackQuery(callbackQueryId, { text: "Выбор тарифа" })
    const keyboard = createSubscriptionPlansKeyboard()
    const result = await editMessageText(
      chatId,
      messageId,
      "<b>Садака-подписка</b>\n\nПриобретая подписку, вы делаете садака-джария на развитие глобального проекта.\n\nВыберите тариф:",
      { reply_markup: keyboard }
    )
    
    if (!result.success) {
      await sendTelegramMessage(
        chatId,
        "<b>Садака-подписка</b>\n\nПриобретая подписку, вы делаете садака-джария на развитие глобального проекта.\n\nВыберите тариф:",
        { reply_markup: keyboard }
      )
    }
    return
  }

  // Subscription plan selection
  if (callbackData.startsWith("subscription:plan:")) {
    const planKey = callbackData.replace("subscription:plan:", "")
    const plan = SUBSCRIPTION_PLANS[planKey as keyof typeof SUBSCRIPTION_PLANS]

    if (!plan) {
      await answerCallbackQuery(callbackQueryId, { text: "Тариф не найден", show_alert: true })
      return
    }

    if (plan.free) {
      await answerCallbackQuery(callbackQueryId, { text: "Это ваш текущий бесплатный тариф" })
      return
    }

    await answerCallbackQuery(callbackQueryId, { text: `Выбран тариф: ${plan.name}` })
    const keyboard = createSubscriptionPeriodsKeyboard(planKey)
    
    const featuresText = plan.features.map((f) => `✓ ${f}`).join("\n")
    const message = `<b>${plan.name}</b> — ${plan.subtitle}\n\n${plan.description}\n\n<b>Преимущества:</b>\n${featuresText}\n\nВыберите период подписки:`
    
    const result = await editMessageText(chatId, messageId, message, { reply_markup: keyboard })
    
    if (!result.success) {
      await sendTelegramMessage(chatId, message, { reply_markup: keyboard })
    }
    return
  }

  // Subscription period selection
  if (callbackData.startsWith("subscription:period:")) {
    const parts = callbackData.split(":")
    if (parts.length < 4) {
      await answerCallbackQuery(callbackQueryId, { text: "Неверный формат команды", show_alert: true })
      return
    }
    
    const planKey = parts[2]
    const periodKey = parts[3]
    const plan = SUBSCRIPTION_PLANS[planKey as keyof typeof SUBSCRIPTION_PLANS]

    if (!plan || plan.free || !("prices" in plan) || !plan.prices) {
      await answerCallbackQuery(callbackQueryId, { text: "Ошибка выбора периода", show_alert: true })
      return
    }

    const priceInfo = plan.prices[periodKey as keyof typeof plan.prices]
    if (!priceInfo) {
      await answerCallbackQuery(callbackQueryId, { text: "Период не найден", show_alert: true })
      return
    }

    await answerCallbackQuery(callbackQueryId, { text: "Перенаправление на оплату..." })
    
    // Create payment URL for subscription - opens Mini App with checkout page
    // Full payment integration will be added later
    const paymentUrl = `${webAppUrl}/subscription/checkout?plan=${encodeURIComponent(plan.name)}&period=${encodeURIComponent(priceInfo.period)}`
    
    const keyboard = createPaymentKeyboard(paymentUrl)
    const bonusText = "bonus" in priceInfo && priceInfo.bonus ? `\nПодарок: ${priceInfo.bonus}` : ""
    const message = `<b>${plan.name}</b> — ${priceInfo.period}\n\n<b>Сумма:</b> ${priceInfo.price} ₽\n<b>В благотворительность:</b> ${priceInfo.charity} ₽${bonusText}\n\nНажмите кнопку ниже для оплаты:`
    
    const result = await editMessageText(chatId, messageId, message, { reply_markup: keyboard })
    
    if (!result.success) {
      await sendTelegramMessage(chatId, message, { reply_markup: keyboard })
    }
    return
  }

  // Donation menu
  if (callbackData === "menu:donate") {
    await answerCallbackQuery(callbackQueryId, { text: "Выбор типа пожертвования" })
    const keyboard = createDonationTypeKeyboard()
    const result = await editMessageText(
      chatId,
      messageId,
      "<b>Пожертвование</b>\n\nВыберите, кому вы хотите помочь:",
      { reply_markup: keyboard }
    )
    
    if (!result.success) {
      await sendTelegramMessage(
        chatId,
        "<b>Пожертвование</b>\n\nВыберите, кому вы хотите помочь:",
        { reply_markup: keyboard }
      )
    }
    return
  }

  // Donation type: fund
  if (callbackData === "donate:type:fund") {
    await answerCallbackQuery(callbackQueryId, { text: "Загрузка фондов..." })
    try {
      const fundsResult = await getFunds()
      const funds = fundsResult.funds || []

      if (funds.length === 0) {
        await answerCallbackQuery(callbackQueryId, { text: "Фонды не найдены", show_alert: true })
        return
      }

      const keyboard = createFundsKeyboard(funds, 0)
      const result = await editMessageText(
        chatId,
        messageId,
        "<b>Выберите фонд</b>\n\nВыберите фонд, которому хотите помочь:",
        { reply_markup: keyboard }
      )
      
      if (!result.success) {
        // If edit fails, send new message
        await sendTelegramMessage(
          chatId,
          "<b>Выберите фонд</b>\n\nВыберите фонд, которому хотите помочь:",
          { reply_markup: keyboard }
        )
      }
    } catch (error) {
      console.error("[Telegram Webhook] Error loading funds:", error)
      await answerCallbackQuery(callbackQueryId, { text: "Ошибка загрузки фондов", show_alert: true })
    }
    return
  }

  // Donation type: campaign
  if (callbackData === "donate:type:campaign") {
    await answerCallbackQuery(callbackQueryId, { text: "Загрузка проектов..." })
    try {
      const campaignsResult = await getCampaigns("active")
      const campaigns = (campaignsResult.campaigns || []).slice(0, 20) // Limit to 20

      if (campaigns.length === 0) {
        await answerCallbackQuery(callbackQueryId, { text: "Проекты не найдены", show_alert: true })
        return
      }

      const keyboard = createCampaignsKeyboard(campaigns, 0)
      const result = await editMessageText(
        chatId,
        messageId,
        "<b>Выберите проект</b>\n\nВыберите проект, которому хотите помочь:",
        { reply_markup: keyboard }
      )
      
      if (!result.success) {
        // If edit fails, send new message
        await sendTelegramMessage(
          chatId,
          "<b>Выберите проект</b>\n\nВыберите проект, которому хотите помочь:",
          { reply_markup: keyboard }
        )
      }
    } catch (error) {
      console.error("[Telegram Webhook] Error loading campaigns:", error)
      await answerCallbackQuery(callbackQueryId, { text: "Ошибка загрузки проектов", show_alert: true })
    }
    return
  }

  // Funds pagination
  if (callbackData.startsWith("donate:funds:page:")) {
    const pageStr = callbackData.replace("donate:funds:page:", "")
    const page = parseInt(pageStr, 10)
    if (isNaN(page) || page < 0) {
      await answerCallbackQuery(callbackQueryId, { text: "Неверный номер страницы", show_alert: true })
      return
    }
    try {
      const fundsResult = await getFunds()
      const funds = fundsResult.funds || []

      const keyboard = createFundsKeyboard(funds, page)
      const result = await editMessageText(
        chatId,
        messageId,
        "<b>Выберите фонд</b>\n\nВыберите фонд, которому хотите помочь:",
        { reply_markup: keyboard }
      )
      
      if (!result.success) {
        await sendTelegramMessage(
          chatId,
          "<b>Выберите фонд</b>\n\nВыберите фонд, которому хотите помочь:",
          { reply_markup: keyboard }
        )
      }
    } catch (error) {
      console.error("[Telegram Webhook] Error loading funds page:", error)
      await answerCallbackQuery(callbackQueryId, { text: "Ошибка загрузки", show_alert: true })
    }
    return
  }

  // Campaigns pagination
  if (callbackData.startsWith("donate:campaigns:page:")) {
    const pageStr = callbackData.replace("donate:campaigns:page:", "")
    const page = parseInt(pageStr, 10)
    if (isNaN(page) || page < 0) {
      await answerCallbackQuery(callbackQueryId, { text: "Неверный номер страницы", show_alert: true })
      return
    }
    try {
      const campaignsResult = await getCampaigns("active")
      const campaigns = (campaignsResult.campaigns || []).slice(0, 20)

      const keyboard = createCampaignsKeyboard(campaigns, page)
      const result = await editMessageText(
        chatId,
        messageId,
        "<b>Выберите проект</b>\n\nВыберите проект, которому хотите помочь:",
        { reply_markup: keyboard }
      )
      
      if (!result.success) {
        await sendTelegramMessage(
          chatId,
          "<b>Выберите проект</b>\n\nВыберите проект, которому хотите помочь:",
          { reply_markup: keyboard }
        )
      }
    } catch (error) {
      console.error("[Telegram Webhook] Error loading campaigns page:", error)
      await answerCallbackQuery(callbackQueryId, { text: "Ошибка загрузки", show_alert: true })
    }
    return
  }

  // Fund selection
  if (callbackData.startsWith("donate:fund:")) {
    const fundId = callbackData.replace("donate:fund:", "")
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(fundId)) {
      await answerCallbackQuery(callbackQueryId, { text: "Неверный формат ID фонда", show_alert: true })
      return
    }
    
    await answerCallbackQuery(callbackQueryId, { text: "Выбор суммы" })
    const keyboard = createDonationAmountKeyboard(fundId, "fund")
    const result = await editMessageText(
      chatId,
      messageId,
      "<b>Выберите сумму пожертвования</b>\n\nИли укажите другую сумму:",
      { reply_markup: keyboard }
    )
    
    if (!result.success) {
      await sendTelegramMessage(
        chatId,
        "<b>Выберите сумму пожертвования</b>\n\nИли укажите другую сумму:",
        { reply_markup: keyboard }
      )
    }
    return
  }

  // Campaign selection
  if (callbackData.startsWith("donate:campaign:")) {
    const campaignId = callbackData.replace("donate:campaign:", "")
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(campaignId)) {
      await answerCallbackQuery(callbackQueryId, { text: "Неверный формат ID проекта", show_alert: true })
      return
    }
    
    await answerCallbackQuery(callbackQueryId, { text: "Выбор суммы" })
    const keyboard = createDonationAmountKeyboard(campaignId, "campaign")
    const result = await editMessageText(
      chatId,
      messageId,
      "<b>Выберите сумму пожертвования</b>\n\nИли укажите другую сумму:",
      { reply_markup: keyboard }
    )
    
    if (!result.success) {
      await sendTelegramMessage(
        chatId,
        "<b>Выберите сумму пожертвования</b>\n\nИли укажите другую сумму:",
        { reply_markup: keyboard }
      )
    }
    return
  }

  // Donation amount selection
  if (callbackData.startsWith("donate:amount:")) {
    const parts = callbackData.split(":")
    if (parts.length < 5) {
      await answerCallbackQuery(callbackQueryId, { text: "Неверный формат команды", show_alert: true })
      return
    }
    
    const targetType = parts[2] as "fund" | "campaign"
    const targetId = parts[3]
    const amount = parseInt(parts[4], 10)
    
    // Validate amount
    if (isNaN(amount) || amount <= 0 || amount > 10000000) {
      await answerCallbackQuery(callbackQueryId, { text: "Неверная сумма. Минимум: 1 ₽, максимум: 10 000 000 ₽", show_alert: true })
      return
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(targetId)) {
      await answerCallbackQuery(callbackQueryId, { text: "Неверный формат ID", show_alert: true })
      return
    }

    await answerCallbackQuery(callbackQueryId, { text: "Перенаправление на оплату..." })
    
    // Create payment URL for donation - opens Mini App with donation form
    // Full payment integration will be added later
    const params = new URLSearchParams({
      amount: amount.toString(),
      currency: "RUB",
      category: "sadaqah",
      donationType: "one_time",
      isAnonymous: "false",
    })

    if (targetType === "fund") {
      params.append("fundId", targetId)
    } else {
      params.append("campaignId", targetId)
    }

    const paymentUrl = `${webAppUrl}/donate?${params.toString()}`
    const keyboard = createPaymentKeyboard(paymentUrl)
    
    const result = await editMessageText(
      chatId,
      messageId,
      `<b>Пожертвование</b>\n\n<b>Сумма:</b> ${amount} ₽\n\nНажмите кнопку ниже для оплаты:`,
      { reply_markup: keyboard }
    )
    
    if (!result.success) {
      await sendTelegramMessage(
        chatId,
        `<b>Пожертвование</b>\n\n<b>Сумма:</b> ${amount} ₽\n\nНажмите кнопку ниже для оплаты:`,
        { reply_markup: keyboard }
      )
    }
    return
  }

  // Custom donation amount
  if (callbackData.startsWith("donate:custom:")) {
    const parts = callbackData.split(":")
    if (parts.length < 4) {
      await answerCallbackQuery(callbackQueryId, { text: "Неверный формат команды", show_alert: true })
      return
    }
    
    const targetType = parts[2] as "fund" | "campaign"
    const targetId = parts[3]
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(targetId)) {
      await answerCallbackQuery(callbackQueryId, { text: "Неверный формат ID", show_alert: true })
      return
    }
    
    await answerCallbackQuery(callbackQueryId, { 
      text: "Введите сумму в следующем сообщении (например: 1500)", 
      show_alert: true 
    })
    
    // Store state for next message (in a real implementation, you'd use a database or cache)
    // For now, we'll just send instructions
    await sendTelegramMessage(
      chatId,
      `<b>Введите сумму пожертвования</b>\n\nОтправьте число в следующем сообщении (например: 1500)\n\nМинимум: 1 ₽\nМаксимум: 10 000 000 ₽\n\n<i>Примечание: функция произвольной суммы будет реализована позже. Пока используйте кнопки с фиксированными суммами.</i>`,
      { reply_markup: createMainMenuKeyboard() }
    )
    return
  }

  // Zakat calculator
  if (callbackData === "menu:zakat") {
    await answerCallbackQuery(callbackQueryId, { text: "Калькулятор закята" })
    const keyboard = createZakatCalculatorKeyboard()
    const result = await editMessageText(
      chatId,
      messageId,
      "<b>Калькулятор закята</b>\n\nРассчитайте свою обязанность по закяту на основе исламских принципов.\n\nНажмите кнопку ниже для открытия калькулятора:",
      { reply_markup: keyboard }
    )
    
    if (!result.success) {
      await sendTelegramMessage(
        chatId,
        "<b>Калькулятор закята</b>\n\nРассчитайте свою обязанность по закяту на основе исламских принципов.\n\nНажмите кнопку ниже для открытия калькулятора:",
        { reply_markup: keyboard }
      )
    }
    return
  }

  // Zakat info
  if (callbackData === "zakat:info") {
    await answerCallbackQuery(callbackQueryId, {
      text: "Закят — обязательная милостыня в исламе, составляющая 2.5% от накопленного имущества при достижении нисаба.",
      show_alert: true,
    })
    return
  }

  // Stats
  if (callbackData === "menu:stats") {
    await answerCallbackQuery(callbackQueryId, { text: "Загрузка статистики..." })
    try {
      const stats = await getPlatformStats()
      const formatted = `<b>Статистика платформы</b>\n\nВсего собрано: ${Math.round(stats.totalCollected)} ₽\nАктивных доноров: ${stats.activeDonors}\nАктивных кампаний: ${stats.activeCampaigns}\nСредний чек: ${Math.round(stats.averageCheck)} ₽`
      
      const keyboard = createMainMenuKeyboard()
      const result = await editMessageText(chatId, messageId, formatted, { reply_markup: keyboard })
      
      if (!result.success) {
        await sendTelegramMessage(chatId, formatted, { reply_markup: keyboard })
      }
    } catch (error) {
      console.error("[Telegram Webhook] Error loading stats:", error)
      await answerCallbackQuery(callbackQueryId, { text: "Ошибка загрузки статистики", show_alert: true })
    }
    return
  }

  // Unknown callback - show error and return to main menu
  await answerCallbackQuery(callbackQueryId, { text: "Неизвестная команда", show_alert: false })
  const keyboard = createMainMenuKeyboard()
  const result = await editMessageText(
    chatId,
    messageId,
    "❓ <b>Неизвестная команда</b>\n\nВозвращаемся в главное меню:",
    { reply_markup: keyboard }
  )
  
  if (!result.success) {
    await sendTelegramMessage(
      chatId,
      "❓ <b>Неизвестная команда</b>\n\nВозвращаемся в главное меню:",
      { reply_markup: keyboard }
    )
  }
}

// Handle text messages
async function handleMessage(message: TelegramMessage) {
  const chatId = message?.chat?.id
  const text = message?.text

  if (!chatId || !text) {
    return
  }

  const webAppUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mubarak-way.vercel.app"

  // /start command
  if (text.startsWith("/start")) {
    const params = text.split(" ")[1]

    if (params) {
      if (params.startsWith("campaign_")) {
        const campaignId = params.replace("campaign_", "")
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (uuidRegex.test(campaignId)) {
          const deepLink = `${webAppUrl}/campaigns/${campaignId}`
          await sendTelegramMessage(
            chatId,
            `<b>Открываю кампанию...</b>\n\nПерейдите по ссылке: ${deepLink}\n\nИли откройте в Telegram Mini App.`,
            { reply_markup: { inline_keyboard: [[{ text: "Открыть Mini App", web_app: { url: deepLink } }]] } }
          )
        } else {
          await sendTelegramMessage(chatId, "Неверный формат ID кампании", { reply_markup: createMainMenuKeyboard() })
        }
        return
      } else if (params.startsWith("donate_")) {
        const donationId = params.replace("donate_", "")
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (uuidRegex.test(donationId)) {
          const deepLink = `${webAppUrl}/donate?campaignId=${donationId}`
          await sendTelegramMessage(
            chatId,
            `<b>Быстрое пожертвование</b>\n\nПерейдите по ссылке: ${deepLink}\n\nИли откройте в Telegram Mini App.`,
            { reply_markup: { inline_keyboard: [[{ text: "Открыть Mini App", web_app: { url: deepLink } }]] } }
          )
        } else {
          await sendTelegramMessage(chatId, "Неверный формат ID", { reply_markup: createMainMenuKeyboard() })
        }
        return
      }
    }

    // Default /start - show main menu
    const keyboard = createMainMenuKeyboard()
    await sendTelegramMessage(
      chatId,
      "🌙 <b>Ассаляму алейкум!</b>\n\nДобро пожаловать в MubarakWay — платформу для садака-джария.\n\nВыберите действие:",
      { reply_markup: keyboard }
    )
    return
  }

  // /subscription command
  if (text.startsWith("/subscription") || text.startsWith("/подписка")) {
    const keyboard = createSubscriptionPlansKeyboard()
    await sendTelegramMessage(
      chatId,
      "<b>Садака-подписка</b>\n\nПриобретая подписку, вы делаете садака-джария на развитие глобального проекта.\n\nВыберите тариф:",
      { reply_markup: keyboard }
    )
    return
  }

  // /donate command
  if (text.startsWith("/donate") || text.startsWith("/пожертвовать")) {
    const keyboard = createDonationTypeKeyboard()
    await sendTelegramMessage(
      chatId,
      "<b>Пожертвование</b>\n\nВыберите, кому вы хотите помочь:",
      { reply_markup: keyboard }
    )
    return
  }

  // /sadaqa command - открыть вкладку «Пожертвовать»
  if (text.startsWith("/sadaqa") || text.startsWith("/садака")) {
    const donateUrl = `${webAppUrl}/donate`
    await sendTelegramMessage(
      chatId,
      "💚 <b>Садака</b>\n\nОткройте Mini App для пожертвования:",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Открыть пожертвование", web_app: { url: donateUrl } }],
            [{ text: "Главное меню", callback_data: "menu:main" }],
          ],
        },
      }
    )
    return
  }

  // /support command - быстрые донаты (500 / 1000 / 2500 ₽)
  if (text.startsWith("/support") || text.startsWith("/поддержать")) {
    const keyboard = createQuickSupportKeyboard()
    await sendTelegramMessage(
      chatId,
      "<b>Быстрая садака</b>\n\nВыберите сумму для быстрого пожертвования:",
      { reply_markup: keyboard }
    )
    return
  }

  // /partners command - каталог фондов
  if (text.startsWith("/partners") || text.startsWith("/партнеры") || text.startsWith("/фонды")) {
    const partnersUrl = `${webAppUrl}/funds`
    await sendTelegramMessage(
      chatId,
      "<b>Фонды-партнёры</b>\n\nОткройте каталог фондов:",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Открыть каталог фондов", web_app: { url: partnersUrl } }],
            [{ text: "Главное меню", callback_data: "menu:main" }],
          ],
        },
      }
    )
    return
  }

  // /zakat command
  if (text.startsWith("/zakat") || text.startsWith("/закят")) {
    const keyboard = createZakatCalculatorKeyboard()
    await sendTelegramMessage(
      chatId,
      "<b>Калькулятор закята</b>\n\nРассчитайте свою обязанность по закяту на основе исламских принципов.\n\nНажмите кнопку ниже для открытия калькулятора:",
      { reply_markup: keyboard }
    )
    return
  }

  // /stats command
  if (text.startsWith("/stats") || text.startsWith("/статистика")) {
    try {
      const stats = await getPlatformStats()
      const formatted = `<b>Статистика платформы</b>\n\nВсего собрано: ${Math.round(stats.totalCollected)} ₽\nАктивных доноров: ${stats.activeDonors}\nАктивных кампаний: ${stats.activeCampaigns}\nСредний чек: ${Math.round(stats.averageCheck)} ₽`
      const keyboard = createMainMenuKeyboard()
      await sendTelegramMessage(chatId, formatted, { reply_markup: keyboard })
    } catch (error) {
      console.error("[Telegram Webhook] Error loading stats:", error)
      await sendTelegramMessage(chatId, "Ошибка загрузки статистики. Попробуйте позже.", { reply_markup: createMainMenuKeyboard() })
    }
    return
  }

  // Unknown command - show help
  const keyboard = createMainMenuKeyboard()
  await sendTelegramMessage(
    chatId,
    "❓ <b>Команда не распознана</b>\n\nДоступные команды:\n/start - Главное меню\n/sadaqa - Пожертвование\n/support - Быстрая садака\n/partners - Фонды-партнёры\n/subscription - Подписка\n/donate - Пожертвование\n/zakat - Калькулятор закята\n/stats - Статистика",
    { reply_markup: keyboard }
  )
}

export async function POST(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const update = await req.json().catch(() => null)
  if (!update) return NextResponse.json({ ok: true })

  try {
    // Handle callback queries (inline button clicks)
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query)
      return NextResponse.json({ ok: true })
    }

    // Handle messages
    if (update.message) {
      await handleMessage(update.message)
      return NextResponse.json({ ok: true })
    }
  } catch (error) {
    // Логируем ошибку через handleApiError, но не возвращаем ошибку
    // чтобы Telegram не повторял запрос бесконечно
    handleApiError(error)
    // Don't fail the webhook - Telegram will retry
  }

  return NextResponse.json({ ok: true })
}



