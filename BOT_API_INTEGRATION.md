# 🔌 Интеграция с Bot.e-replika.ru API

## ✅ Как это работает:

### Приоритет данных:
1. **Первичный источник**: `https://bot.e-replika.ru` API
2. **Fallback**: Локальная база данных Supabase

### Авторизация:
- **Токен**: `test_token_123`
- **Заголовок**: `Authorization: Bearer test_token_123`
- **Base URL**: `https://bot.e-replika.ru`

## 📡 Доступные эндпоинты:

### 1. **Статистика** (`/api/stats`)
```
GET https://bot.e-replika.ru/api/stats
Authorization: Bearer test_token_123
```

**Возвращает:**
```json
{
  "total_collected": 1234567,
  "active_donors": 123,
  "active_campaigns": 45,
  "average_check": 5000
}
```

**Используется в:**
- `/api/stats` (ваш API эндпоинт)
- Telegram бот (команда `/stats`)
- Админ-панель

### 2. **Фонды** (`/api/funds`)
```
GET https://bot.e-replika.ru/api/funds?category=education
Authorization: Bearer test_token_123
```

**Параметры:**
- `category` (опционально) - фильтр по категории

**Используется в:**
- Страница `/funds`
- Выбор фонда при пожертвовании

### 3. **Кампании** (`/api/campaigns`)
```
GET https://bot.e-replika.ru/api/campaigns?status=active&limit=10
Authorization: Bearer test_token_123
```

**Параметры:**
- `status` (опционально) - статус кампании (active, completed, etc)
- `limit` (опционально) - ограничение количества

**Используется в:**
- Главная страница (активные кампании)
- Страница `/campaigns`
- Ваш API эндпоинт `/api/campaigns`

## 🔄 Логика работы:

### Пример для кампаний:

```typescript
// 1. Сначала пытаемся получить с bot.e-replika.ru
const botApiCampaigns = await fetchBotApiCampaigns(status, limit)

// 2. Если получили данные → возвращаем их
if (botApiCampaigns && botApiCampaigns.length > 0) {
  return botApiCampaigns
}

// 3. Если не получили → используем Supabase
const result = await getCampaigns(status)
return result.campaigns || []
```

### Пример для фондов:

```typescript
// 1. Сначала пытаемся получить с bot.e-replika.ru
const botApiFunds = await fetchBotApiFunds(category)

// 2. Если получили данные → возвращаем их
if (botApiFunds && botApiFunds.length > 0) {
  return botApiFunds
}

// 3. Если не получили → используем Supabase
const supabaseFunds = await getFundsFromSupabase(category)
return supabaseFunds || []
```

## 🧪 Как проверить:

### 1. Проверка напрямую Bot API:

```powershell
$headers = @{ Authorization = "Bearer test_token_123" }

# Статистика
Invoke-RestMethod -Uri "https://bot.e-replika.ru/api/stats" -Headers $headers

# Фонды
Invoke-RestMethod -Uri "https://bot.e-replika.ru/api/funds" -Headers $headers

# Кампании
Invoke-RestMethod -Uri "https://bot.e-replika.ru/api/campaigns?status=active&limit=3" -Headers $headers
```

### 2. Проверка через ваш API:

```powershell
# Ваш API (который использует Bot API с fallback)
Invoke-RestMethod -Uri "http://localhost:3000/api/campaigns?status=active&limit=3"

# Статистика (требует авторизацию)
$headers = @{ Authorization = "Bearer test_token_123" }
Invoke-RestMethod -Uri "http://localhost:3000/api/stats" -Headers $headers
```

## 📋 Настройка переменных окружения:

В `.env.local` должны быть:
```env
BOT_API_BASE_URL=https://bot.e-replika.ru
BOT_API_TOKEN=test_token_123
```

Если не указаны, используются значения по умолчанию.

## ✅ Что уже работает:

1. ✅ **API клиент** (`lib/bot-api.ts`) - настроен и готов
2. ✅ **Fallback на Supabase** - работает автоматически
3. ✅ **Интеграция в API эндпоинты** - `/api/campaigns`, `/api/stats`
4. ✅ **Интеграция в страницы** - `/funds`, `/campaigns`

## 🔍 Где используется:

- `lib/bot-api.ts` - клиент для работы с API
- `app/api/campaigns/route.ts` - использует `fetchBotApiCampaigns()`
- `lib/actions/funds.ts` - использует `fetchBotApiFunds()`
- `lib/stats.ts` - использует `fetchBotApiStats()`

## 📝 Важно:

- Если Bot API недоступен → автоматически используется Supabase
- Если Bot API вернул пустой массив → используется Supabase
- Если Bot API вернул ошибку → логируется в консоль, используется Supabase

---

**Все настроено и готово к работе!** 🎉

