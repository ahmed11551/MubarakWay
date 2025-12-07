// Client for bot.e-replika.ru API
// Документация: docs/BACKEND_API_INTEGRATION.md

const BOT_API_BASE = process.env.BOT_API_BASE_URL || "https://bot.e-replika.ru"
const BOT_API_TOKEN = process.env.BOT_API_TOKEN
const BOT_API_TIMEOUT = 10000 // 10 секунд

// Типы для Bot API
export type BotApiStats = {
  totalCollected: number
  activeDonors: number
  activeCampaigns: number
  averageCheck: number
}

export type BotApiError = {
  message: string
  statusCode?: number
  isTimeout: boolean
  isConfigError: boolean
}

// Логирование предупреждения при запуске
if (!BOT_API_TOKEN) {
  console.warn("[Bot API] BOT_API_TOKEN не настроен. Bot API недоступен, будет использоваться Supabase fallback.")
  console.warn("[Bot API] Для настройки добавьте BOT_API_TOKEN в переменные окружения.")
}

/**
 * Проверка доступности Bot API
 */
export function isBotApiConfigured(): boolean {
  return Boolean(BOT_API_TOKEN)
}

/**
 * Получение статистики платформы
 * @returns Статистика или null при ошибке (с fallback на Supabase)
 */
export async function fetchBotApiStats(): Promise<BotApiStats | null> {
  if (!BOT_API_TOKEN) {
    if (process.env.NODE_ENV === "development") {
      console.debug("[Bot API] Пропуск запроса статистики - токен не настроен")
    }
    return null
  }
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), BOT_API_TIMEOUT)
  
  try {
    const response = await fetch(`${BOT_API_BASE}/api/stats`, {
      headers: {
        Authorization: `Bearer ${BOT_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error(`[Bot API] Ошибка запроса статистики: HTTP ${response.status}`, errorText)
      return null
    }

    const data = await response.json()
    
    // Валидация ответа
    if (!data || typeof data !== 'object') {
      console.error("[Bot API] Некорректный формат ответа статистики:", data)
      return null
    }

    return {
      totalCollected: Number(data.total_collected || 0),
      activeDonors: Number(data.active_donors || 0),
      activeCampaigns: Number(data.active_campaigns || 0),
      averageCheck: Number(data.average_check || 0),
    }
  } catch (error: any) {
    clearTimeout(timeoutId)
    
    if (error.name === "AbortError") {
      console.error("[Bot API] Таймаут запроса статистики (превышено", BOT_API_TIMEOUT / 1000, "сек)")
    } else {
      console.error("[Bot API] Ошибка запроса статистики:", error.message || error)
    }
    
    return null
  }
}

/**
 * Базовый метод для запросов к Bot API
 * @throws Error при отсутствии токена или таймауте
 */
export async function fetchBotApi(endpoint: string, options: RequestInit = {}): Promise<Response> {
  if (!BOT_API_TOKEN) {
    const error = new Error("Bot API не настроен: отсутствует BOT_API_TOKEN")
    console.error("[Bot API]", error.message)
    throw error
  }
  
  const url = endpoint.startsWith("http") ? endpoint : `${BOT_API_BASE}${endpoint}`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), BOT_API_TIMEOUT)
  
  try {
    if (process.env.NODE_ENV === "development") {
      console.debug("[Bot API] Запрос:", endpoint)
    }
    
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${BOT_API_TOKEN}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
      cache: "no-store",
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    // Логируем статус для отладки
    if (!response.ok && process.env.NODE_ENV === "development") {
      console.warn(`[Bot API] Запрос ${endpoint} вернул статус ${response.status}`)
    }
    
    return response
  } catch (error: any) {
    clearTimeout(timeoutId)
    
    if (error.name === "AbortError") {
      const timeoutError = new Error(`Таймаут запроса к ${endpoint} (превышено ${BOT_API_TIMEOUT / 1000} сек)`)
      console.error("[Bot API]", timeoutError.message)
      throw timeoutError
    }
    
    console.error("[Bot API] Ошибка запроса:", error.message || error)
    throw error
  }
}

/**
 * Получение списка фондов
 * @returns Массив фондов или null при ошибке
 */
export async function fetchBotApiFunds(category?: string): Promise<any[] | null> {
  if (!isBotApiConfigured()) {
    if (process.env.NODE_ENV === "development") {
      console.debug("[Bot API] Пропуск запроса фондов - токен не настроен")
    }
    return null
  }
  
  try {
    const endpoint = category && category !== "all" 
      ? `/api/funds?category=${encodeURIComponent(category)}` 
      : `/api/funds`
    
    const response = await fetchBotApi(endpoint)
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error(`[Bot API] Ошибка получения фондов: HTTP ${response.status}`, errorText)
      return null
    }

    const data = await response.json()
    
    // Поддержка разных форматов ответа
    const funds = data.funds || data.organizations || (Array.isArray(data) ? data : null)
    
    if (!funds) {
      console.warn("[Bot API] Некорректный формат ответа фондов:", Object.keys(data))
      return null
    }
    
    if (process.env.NODE_ENV === "development") {
      console.debug(`[Bot API] Получено фондов: ${funds.length}`)
    }
    return funds
    
  } catch (error: any) {
    console.error("[Bot API] Ошибка получения фондов:", error.message || error)
    return null
  }
}

/**
 * Получение списка кампаний
 * @returns Массив кампаний или null при ошибке
 */
export async function fetchBotApiCampaigns(status?: string, limit?: number): Promise<any[] | null> {
  if (!isBotApiConfigured()) {
    if (process.env.NODE_ENV === "development") {
      console.debug("[Bot API] Пропуск запроса кампаний - токен не настроен")
    }
    return null
  }
  
  try {
    const params = new URLSearchParams()
    if (status) params.append("status", status)
    if (limit) params.append("limit", String(limit))
    
    const endpoint = `/api/campaigns${params.toString() ? `?${params.toString()}` : ""}`
    const response = await fetchBotApi(endpoint)
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error(`[Bot API] Ошибка получения кампаний: HTTP ${response.status}`, errorText)
      return null
    }

    const data = await response.json()
    
    // Поддержка разных форматов ответа
    const campaigns = data.campaigns || (Array.isArray(data) ? data : null)
    
    if (!campaigns) {
      console.warn("[Bot API] Некорректный формат ответа кампаний:", Object.keys(data))
      return null
    }
    
    if (process.env.NODE_ENV === "development") {
      console.debug(`[Bot API] Получено кампаний: ${campaigns.length}`)
    }
    return campaigns
    
  } catch (error: any) {
    console.error("[Bot API] Ошибка получения кампаний:", error.message || error)
    return null
  }
}

