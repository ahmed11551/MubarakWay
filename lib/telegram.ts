// Telegram WebApp initialization
export function initTelegramApp() {
  if (typeof window === "undefined") return

  // Check if Telegram WebApp is available
  if (!window.Telegram?.WebApp) {
    console.log("[Telegram] WebApp not available (not running in Telegram)")
    return
  }

  const tg = window.Telegram.WebApp

  // Initialize WebApp
  tg.ready()
  tg.expand()

  // Set theme colors based on Telegram theme
  const themeParams = tg.themeParams
  if (themeParams) {
    // Apply Telegram theme colors to CSS variables
    if (themeParams.bg_color) {
      document.documentElement.style.setProperty("--telegram-bg", themeParams.bg_color)
    }
    if (themeParams.text_color) {
      document.documentElement.style.setProperty("--telegram-text", themeParams.text_color)
    }
    if (themeParams.button_color) {
      document.documentElement.style.setProperty("--telegram-button", themeParams.button_color)
    }
    if (themeParams.button_text_color) {
      document.documentElement.style.setProperty("--telegram-button-text", themeParams.button_text_color)
    }
  }

  // Set viewport height for mobile
  tg.setHeaderColor(themeParams?.bg_color || "#ffffff")
  tg.setBackgroundColor(themeParams?.bg_color || "#ffffff")

  // Enable closing confirmation (prevents accidental closes)
  tg.enableClosingConfirmation()

  // Fix scroll behavior - prevent WebApp from closing on scroll
  setupScrollPrevention(tg)

  console.log("[Telegram] WebApp initialized", {
    version: tg.version,
    platform: tg.platform,
    colorScheme: tg.colorScheme,
    viewportHeight: tg.viewportHeight,
    viewportStableHeight: tg.viewportStableHeight,
    isExpanded: tg.isExpanded,
    initData: tg.initData ? "available" : "not available",
  })
}

/**
 * Setup scroll prevention to avoid WebApp closing on scroll
 * CSS-only approach - no JS blocking for normal scroll
 */
function setupScrollPrevention(tg: any) {
  // Add CSS class to html for Telegram WebApp
  document.documentElement.classList.add("telegram-webapp")

  // Try to use Telegram WebApp API to disable pull-to-close if available
  if (typeof tg.disableVerticalSwipes === "function") {
    try {
      tg.disableVerticalSwipes()
      console.log("[Telegram] Vertical swipes disabled via API")
    } catch (e) {
      console.log("[Telegram] disableVerticalSwipes not available")
    }
  }

  // Rely entirely on CSS overscroll-behavior for scroll prevention
  // No JS blocking - this allows normal scroll to work smoothly
  // CSS will handle pull-to-close prevention via overscroll-behavior: contain

  // Handle viewport changes for proper height
  const updateViewport = () => {
    const stableHeight = tg.viewportStableHeight || tg.viewportHeight
    if (stableHeight) {
      document.documentElement.style.setProperty(
        "--tg-viewport-height",
        `${stableHeight}px`
      )
      // Set min-height to prevent layout shifts
      if (document.body) {
        document.body.style.minHeight = `${stableHeight}px`
      }
    }
  }

  // Listen to viewport changes
  if (typeof tg.onEvent === "function") {
    tg.onEvent("viewportChanged", updateViewport)
  }
  updateViewport()

  // Force expand and prevent collapse
  if (tg.expand) {
    tg.expand()
  }

  // Cleanup function
  return () => {
    document.removeEventListener("touchstart", handleTouchStart, { capture: true } as any)
    document.removeEventListener("touchmove", handleTouchMove, { capture: true } as any)
    document.removeEventListener("touchend", handleTouchEnd, { capture: true } as any)
    if (typeof tg.offEvent === "function") {
      tg.offEvent("viewportChanged", updateViewport)
    }
    const styleEl = document.getElementById("telegram-scroll-fix")
    if (styleEl) {
      styleEl.remove()
    }
    document.documentElement.classList.remove("telegram-webapp")
  }
}

// Get Telegram user data
export function getTelegramUser() {
  if (typeof window === "undefined" || !window.Telegram?.WebApp) {
    return null
  }

  const tg = window.Telegram.WebApp
  const initData = tg.initDataUnsafe

  if (!initData?.user) {
    return null
  }

  return {
    id: initData.user.id,
    firstName: initData.user.first_name,
    lastName: initData.user.last_name,
    username: initData.user.username,
    languageCode: initData.user.language_code,
    photoUrl: initData.user.photo_url,
    isPremium: initData.user.is_premium || false,
  }
}

// Get Telegram theme
export function getTelegramTheme() {
  if (typeof window === "undefined" || !window.Telegram?.WebApp) {
    return "light"
  }

  return window.Telegram.WebApp.colorScheme || "light"
}

// Telegram notification utilities
// To use this, you need to:
// 1. Set TELEGRAM_BOT_TOKEN in environment variables
// 2. Get the token from @BotFather on Telegram

export async function sendTelegramMessage(
  chatId: number | string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    console.warn("[Telegram] TELEGRAM_BOT_TOKEN not configured, skipping message send")
    return { success: false, error: "Telegram bot token not configured" }
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "HTML",
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.ok) {
      console.error("[Telegram] Send error:", data)
      return { success: false, error: data.description || "Failed to send message" }
    }

    console.log("[Telegram] Message sent successfully:", data.result.message_id)
    return { success: true }
  } catch (error) {
    console.error("[Telegram] Unexpected error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Telegram message templates
export function getDonationNotificationMessage(donation: {
  amount: number
  currency: string
  fundName?: string
  campaignName?: string
  donorName?: string
  isAnonymous: boolean
}): string {
  const recipient = donation.fundName || donation.campaignName || "благотворительный фонд"
  const donor = donation.isAnonymous ? "Анонимный донор" : donation.donorName || "Пользователь"
  
  return `
🎉 <b>Новое пожертвование!</b>

💰 <b>Сумма:</b> ${donation.amount} ${donation.currency}
👤 <b>Донор:</b> ${donor}
🎯 <b>Получатель:</b> ${recipient}

Благодарим за вашу поддержку! 🙏
  `.trim()
}

export function getCampaignDonationNotificationMessage(campaign: {
  title: string
  donorName: string
  amount: number
  currency: string
  isAnonymous: boolean
}): string {
  const donorName = campaign.isAnonymous ? "Анонимный донор" : campaign.donorName
  
  return `
🎉 <b>Новое пожертвование в вашу кампанию!</b>

📋 <b>Кампания:</b> ${campaign.title}
👤 <b>Донор:</b> ${donorName}
💰 <b>Сумма:</b> ${campaign.amount} ${campaign.currency}

Продолжайте делиться вашей кампанией! 🚀
  `.trim()
}

export function getCampaignModerationNotificationMessage(campaign: {
  title: string
  approved: boolean
}): string {
  const status = campaign.approved ? "✅ одобрена" : "❌ отклонена"
  const message = campaign.approved
    ? "Ваша кампания была одобрена и теперь доступна для пожертвований!"
    : "К сожалению, ваша кампания не прошла модерацию. Пожалуйста, проверьте требования и попробуйте снова."
  
  return `
📋 <b>Статус модерации кампании</b>

<b>Кампания:</b> ${campaign.title}
<b>Статус:</b> ${status}

${message}
  `.trim()
}
