# Интеграция с bot.e-replika.ru API

## Текущее состояние интеграции

### ✅ Реализовано

1. **Статистика** (`/api/stats`)
   - Эндпоинт: `GET https://bot.e-replika.ru/api/stats`
   - Авторизация: `Bearer test_token_123`
   - Возвращает:
     - `total_collected` - всего собрано
     - `active_donors` - активных доноров
     - `active_campaigns` - активных кампаний
     - `average_check` - средний чек
   - Используется в: `/api/stats`, Telegram бот `/stats`, админ-панель

2. **Фонды/Организации** (`/api/funds`)
   - Эндпоинт: `GET https://bot.e-replika.ru/api/funds?category=<category>`
   - Авторизация: `Bearer test_token_123`
   - Параметры:
     - `category` (опционально) - фильтр по категории
   - Fallback: Supabase таблица `funds`
   - Используется в: `/funds`, выбор фонда при пожертвовании

3. **Кампании** (`/api/campaigns`)
   - Эндпоинт: `GET https://bot.e-replika.ru/api/campaigns?status=<status>&limit=<limit>`
   - Авторизация: `Bearer test_token_123`
   - Параметры:
     - `status` (опционально) - статус кампании (active, completed, etc)
     - `limit` (опционально) - ограничение количества
   - Fallback: Supabase таблица `campaigns`
   - Используется в: главная страница (активные кампании), `/campaigns`

## Архитектура интеграции

### Приоритет данных:
1. **Первичный источник**: `bot.e-replika.ru` API
2. **Fallback**: Локальная база данных Supabase

### Файлы интеграции:

- `lib/bot-api.ts` - клиент для работы с API
  - `fetchBotApiStats()` - получение статистики
  - `fetchBotApiFunds()` - получение фондов
  - `fetchBotApiCampaigns()` - получение кампаний
  - `fetchBotApi()` - универсальный метод для любых эндпоинтов

- `lib/stats.ts` - использует `fetchBotApiStats()` с fallback на Supabase
- `lib/actions/funds.ts` - использует `fetchBotApiFunds()` с fallback на Supabase
- `app/api/campaigns/route.ts` - использует `fetchBotApiCampaigns()` с fallback на Supabase

## Переменные окружения

```env
BOT_API_BASE_URL=https://bot.e-replika.ru
BOT_API_TOKEN=test_token_123
```

## Формат данных API

### Статистика
```json
{
  "total_collected": 2450000,
  "active_donors": 1234,
  "active_campaigns": 45,
  "average_check": 1985
}
```

### Фонды
```json
{
  "funds": [
    {
      "id": "uuid",
      "name": "Название фонда",
      "name_ar": "اسم الصندوق",
      "description": "Описание",
      "category": "education|healthcare|water|orphans|emergency|general",
      "logo_url": "https://...",
      "is_verified": true,
      "is_active": true,
      "total_raised": 1250000,
      "donor_count": 5420,
      "website_url": "https://...",
      "contact_email": "email@example.com"
    }
  ]
}
```

### Кампании
```json
{
  "campaigns": [
    {
      "id": "uuid",
      "title": "Название кампании",
      "description": "Описание",
      "goal_amount": 800000,
      "current_amount": 450000,
      "currency": "RUB",
      "category": "healthcare",
      "status": "active",
      "donor_count": 156,
      "days_left": 3,
      "image_url": "https://...",
      "creator_id": "uuid"
    }
  ]
}
```

## Обработка ошибок

- Если API недоступен → используется Supabase
- Если API вернул ошибку → логируется в консоль, используется Supabase
- Если оба источника недоступны → возвращается пустой массив или значения по умолчанию

## Расширение интеграции

Для добавления новых эндпоинтов:

1. Добавьте функцию в `lib/bot-api.ts`:
```typescript
export async function fetchBotApiNewEndpoint(params: any) {
  try {
    const response = await fetchBotApi(`/api/new-endpoint`, {
      method: "POST", // или GET
      body: JSON.stringify(params)
    })
    // обработка ответа
  } catch (error) {
    // fallback логика
  }
}
```

2. Используйте в серверных actions или API routes с fallback на Supabase

