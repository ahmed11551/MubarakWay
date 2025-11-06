# 🔌 Интеграция новых API эндпоинтов

## 📋 Статус интеграции

- ✅ **Эндпоинты для программ** - подготовлены (ожидаем документацию)
- ⏳ **Эндпоинты по оплате** - ожидаем вечером

---

## 📡 Структура для интеграции

### Текущая архитектура API

Все API эндпоинты интегрируются через:
- **Файл**: `lib/bot-api.ts` - клиент для работы с внешним API
- **Файл**: `app/api/*/route.ts` - Next.js API routes (прокси + fallback на Supabase)

### Паттерн интеграции

1. **Добавить функцию в `lib/bot-api.ts`**:
```typescript
export async function fetchBotApiPrograms() {
  try {
    const response = await fetchBotApi("/api/programs")
    if (!response.ok) {
      throw new Error(`Bot API returned ${response.status}`)
    }
    const data = await response.json()
    return data.programs || data || []
  } catch (error) {
    console.error("[Bot API] Error fetching programs:", error)
    return null
  }
}
```

2. **Создать API route в `app/api/programs/route.ts`**:
```typescript
import { NextRequest, NextResponse } from "next/server"
import { fetchBotApiPrograms } from "@/lib/bot-api"
// Fallback на Supabase если нужно

export async function GET(req: NextRequest) {
  try {
    const botApiPrograms = await fetchBotApiPrograms()
    if (botApiPrograms && Array.isArray(botApiPrograms) && botApiPrograms.length > 0) {
      return NextResponse.json({ programs: botApiPrograms })
    }
    // Fallback logic here
    return NextResponse.json({ programs: [] })
  } catch (err) {
    console.error("/api/programs error", err)
    return NextResponse.json({ error: "Failed to fetch programs" }, { status: 500 })
  }
}
```

---

## 📝 Эндпоинты для программ (ожидаем документацию)

### Планируемая структура:

**GET `/api/programs`**
- Получение списка доступных программ подписки
- Параметры: `?tier=mutahsin_pro` (опционально)

**GET `/api/programs/:id`**
- Получение детальной информации о программе

**POST `/api/subscriptions`**
- Создание подписки
- Body: `{ tier, billing_frequency, amount, currency }`

**GET `/api/subscriptions`**
- Получение подписок пользователя

**PATCH `/api/subscriptions/:id`**
- Обновление подписки (отмена, пауза)

---

## 💳 Эндпоинты по оплате (ожидаем вечером)

### Планируемая структура:

**POST `/api/payments/initiate`**
- Инициализация платежа
- Body: `{ amount, currency, type, metadata }`

**POST `/api/payments/confirm`**
- Подтверждение платежа
- Body: `{ payment_id, transaction_id }`

**GET `/api/payments/:id`**
- Получение статуса платежа

**POST `/api/payments/webhook`**
- Webhook для обработки уведомлений от платёжной системы

---

## 🔧 Настройка

### Переменные окружения

Добавить в `.env.local`:
```env
BOT_API_BASE_URL=https://bot.e-replika.ru
BOT_API_TOKEN=your_token_here
```

### Типы данных

Создать файл `lib/types/api.ts` для типизации ответов API:
```typescript
export interface Program {
  id: string
  name: string
  tier: 'mutahsin_pro' | 'sahib_al_waqf_premium'
  description: string
  price: number
  currency: string
  features: string[]
}

export interface Subscription {
  id: string
  user_id: string
  program_id: string
  status: 'active' | 'cancelled' | 'expired' | 'paused'
  started_at: string
  next_billing_date: string
}
```

---

## 📚 Связанные файлы

- `lib/bot-api.ts` - клиент для внешнего API
- `app/api/*/route.ts` - Next.js API routes
- `lib/actions/subscriptions.ts` - server actions для подписок (если нужно)
- `components/subscription-*.tsx` - компоненты для работы с подписками

---

## ✅ Чеклист интеграции

Когда получим эндпоинты:

- [ ] Добавить функции в `lib/bot-api.ts`
- [ ] Создать API routes в `app/api/`
- [ ] Добавить типы в `lib/types/api.ts`
- [ ] Обновить компоненты подписок
- [ ] Добавить обработку ошибок
- [ ] Добавить fallback на Supabase (если нужно)
- [ ] Обновить документацию
- [ ] Протестировать интеграцию

---

**Последнее обновление**: Ожидаем документацию по эндпоинтам

