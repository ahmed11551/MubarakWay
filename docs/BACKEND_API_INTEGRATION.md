# Документация по интеграции Frontend с Backend API

## Обзор

Frontend SadakaPass интегрируется с несколькими backend-системами:

1. **Bot API (bot.e-replika.ru)** — основной backend Владимира для статистики, кампаний и фондов
2. **Fondinsan API (fondinsan.ru)** — API для программ благотворительности фонда Инсан
3. **Payment API** — внешний сервис обработки платежей
4. **Supabase** — fallback база данных (используется при недоступности Bot API)

---

## 1. Bot API (Backend Владимира)

### Базовый URL
```
BOT_API_BASE_URL=https://bot.e-replika.ru
```

### Авторизация
Все запросы требуют Bearer токен в заголовке:
```
Authorization: Bearer {BOT_API_TOKEN}
```

---

### 1.1 Получение статистики платформы

**Endpoint:** `GET /api/stats`

**Запрос:**
```http
GET /api/stats
Authorization: Bearer {BOT_API_TOKEN}
Content-Type: application/json
```

**Параметры запроса:** нет

**Ожидаемый ответ (200 OK):**
```json
{
  "total_collected": 1500000.00,
  "active_donors": 234,
  "active_campaigns": 12,
  "average_check": 1500.50
}
```

**Поля ответа:**
| Поле | Тип | Описание |
|------|-----|----------|
| `total_collected` | number | Общая сумма собранных средств (в рублях) |
| `active_donors` | number | Количество активных доноров |
| `active_campaigns` | number | Количество активных кампаний |
| `average_check` | number | Средний чек пожертвования |

**Используется в:** 
- `lib/stats.ts` → `getPlatformStats()`
- Отображается в виджете статистики на главной странице

---

### 1.2 Получение списка фондов

**Endpoint:** `GET /api/funds`

**Запрос:**
```http
GET /api/funds?category={category}
Authorization: Bearer {BOT_API_TOKEN}
Content-Type: application/json
```

**Параметры запроса:**
| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `category` | string | Нет | Фильтр по категории: `zakat`, `orphans`, `water`, `mosque`, `education`, `healthcare`, `emergency`, `general` |

**Ожидаемый ответ (200 OK):**
```json
{
  "funds": [
    {
      "id": "uuid-string",
      "name": "Фонд Инсан",
      "name_ru": "Фонд Инсан",
      "description": "Благотворительный фонд помощи",
      "description_ru": "Благотворительный фонд помощи нуждающимся",
      "category": "general",
      "logo_url": "https://example.com/logo.png",
      "image_url": "https://example.com/image.jpg",
      "website_url": "https://fondinsan.ru",
      "is_active": true,
      "is_verified": true,
      "total_raised": 500000.00,
      "donor_count": 150,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Альтернативные форматы ответа (поддерживаются):**
```json
{
  "organizations": [...]
}
```
или просто массив:
```json
[...]
```

**Используется в:**
- `lib/bot-api.ts` → `fetchBotApiFunds()`
- Страница `/funds`

---

### 1.3 Получение списка кампаний

**Endpoint:** `GET /api/campaigns`

**Запрос:**
```http
GET /api/campaigns?status={status}&limit={limit}
Authorization: Bearer {BOT_API_TOKEN}
Content-Type: application/json
```

**Параметры запроса:**
| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `status` | string | Нет | Фильтр по статусу: `pending`, `active`, `completed`, `rejected` |
| `limit` | number | Нет | Максимальное количество кампаний (по умолчанию 50) |

**Ожидаемый ответ (200 OK):**
```json
{
  "campaigns": [
    {
      "id": "uuid-string",
      "title": "Помощь детям",
      "description": "Краткое описание кампании",
      "story": "Полная история кампании...",
      "goal_amount": 100000.00,
      "current_amount": 45000.00,
      "currency": "RUB",
      "category": "medical",
      "image_url": "https://example.com/campaign.jpg",
      "status": "active",
      "deadline": "2024-12-31T23:59:59Z",
      "creator_id": "uuid-string",
      "fund_id": "uuid-string",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-02-01T15:30:00Z",
      "profiles": {
        "display_name": "Иван Иванов",
        "avatar_url": "https://example.com/avatar.jpg"
      }
    }
  ]
}
```

**Категории кампаний:**
- `medical` — медицинская помощь
- `education` — образование
- `emergency` — экстренная помощь
- `family` — помощь семьям
- `community` — общественные проекты
- `other` — другое

**Используется в:**
- `lib/bot-api.ts` → `fetchBotApiCampaigns()`
- `app/api/campaigns/route.ts`
- Страница `/campaigns`

---

## 2. Payment API (Сервис платежей)

### Базовый URL
```
PAYMENT_API_URL=https://api.yourpaymentservice.com
```

### Авторизация
```
Authorization: Bearer {PAYMENT_API_TOKEN}
```

---

### 2.1 Инициализация платежа

**Endpoint:** `POST /api/payments/initiate`

**Запрос:**
```http
POST /api/payments/initiate
Authorization: Bearer {PAYMENT_API_TOKEN}
Content-Type: application/json

{
  "donation_id": "uuid-string",
  "amount": 1000.00,
  "currency": "RUB",
  "donation_type": "one_time",
  "frequency": null,
  "category": "sadaqah",
  "fund_id": "uuid-string",
  "campaign_id": "uuid-string",
  "message": "В память о родителях",
  "is_anonymous": false,
  "invoice_id": "{\"donationId\":\"uuid-string\"}",
  "return_url": "https://app.example.com/payment/success?donation_id=uuid",
  "cancel_url": "https://app.example.com/payment/cancel"
}
```

**Параметры запроса:**
| Поле | Тип | Обязательный | Описание |
|------|-----|--------------|----------|
| `donation_id` | string (UUID) | Да | ID пожертвования в системе |
| `amount` | number | Да | Сумма платежа |
| `currency` | string | Да | Валюта: `RUB`, `USD`, `EUR` |
| `donation_type` | string | Да | `one_time` или `recurring` |
| `frequency` | string | Нет | Для recurring: `daily`, `weekly`, `monthly`, `yearly` |
| `category` | string | Да | `sadaqah`, `zakat`, `general` |
| `fund_id` | string (UUID) | Нет | ID фонда |
| `campaign_id` | string (UUID) | Нет | ID кампании |
| `message` | string | Нет | Сообщение донора (max 500 символов) |
| `is_anonymous` | boolean | Да | Анонимное пожертвование |
| `invoice_id` | string | Да | JSON с metadata |
| `return_url` | string (URL) | Да | URL возврата после успешного платежа |
| `cancel_url` | string (URL) | Да | URL при отмене платежа |

**Ожидаемый ответ (200 OK):**
```json
{
  "payment_url": "https://payment.provider.com/pay/abc123",
  "transaction_id": "TXN123456789"
}
```

**Альтернативные поля ответа (поддерживаются):**
- `url` вместо `payment_url`
- `link` вместо `payment_url`

**Используется в:**
- `lib/actions/payments.ts` → `initiatePayment()`

---

## 3. Fondinsan API

### Базовый URL
```
FONDINSAN_API_BASE_URL=https://fondinsan.ru/api/v1
```

### Авторизация
Токен передаётся как query parameter:
```
?access-token={FONDINSAN_ACCESS_TOKEN}
```

---

### 3.1 Получение списка программ

**Endpoint:** `GET /programs`

**Запрос:**
```http
GET /programs?access-token={token}
Content-Type: application/json
```

**Ожидаемый ответ (200 OK):**
```json
{
  "success": true,
  "status": 200,
  "data": [
    {
      "id": 123,
      "title": "Помощь сиротам",
      "url": "https://fondinsan.ru/program/123",
      "short": "Краткое описание программы",
      "description": "<p>Полное HTML описание...</p>",
      "created": "2024-01-01T00:00:00Z",
      "image": "https://fondinsan.ru/uploads/program123.jpg",
      "default_amount": 500
    }
  ]
}
```

**Используется в:**
- `lib/fondinsan-api.ts` → `fetchFondinsanPrograms()`

---

### 3.2 Получение программы по ID

**Endpoint:** `GET /program/by-id/{id}`

**Запрос:**
```http
GET /program/by-id/123?access-token={token}
Content-Type: application/json
```

**Ожидаемый ответ (200 OK):**
```json
{
  "success": true,
  "status": 200,
  "data": [
    {
      "id": 123,
      "title": "Помощь сиротам",
      "url": "https://fondinsan.ru/program/123",
      "short": "Краткое описание",
      "description": "<p>Полное описание...</p>",
      "created": "2024-01-01T00:00:00Z",
      "image": "https://fondinsan.ru/uploads/program123.jpg",
      "default_amount": 500
    }
  ]
}
```

**Используется в:**
- `lib/fondinsan-api.ts` → `fetchFondinsanProgramById()`

---

## 4. Webhook Endpoints (от Backend к Frontend)

### 4.1 CloudPayments Webhook

**Endpoint (на нашей стороне):** `POST /api/cloudpayments/webhook`

**Ожидаемое тело запроса:**
```json
{
  "TransactionId": 123456789,
  "Amount": 1000.00,
  "Currency": "RUB",
  "Status": "Completed",
  "InvoiceId": "{\"donationId\":\"uuid-string\"}",
  "Email": "donor@example.com",
  "DateTime": "2024-01-15T12:00:00Z"
}
```

---

### 4.2 YooKassa Webhook

**Endpoint (на нашей стороне):** `POST /api/payments/webhook/yookassa`

**Ожидаемое тело запроса:**
```json
{
  "type": "notification",
  "event": "payment.succeeded",
  "object": {
    "id": "payment-id",
    "status": "succeeded",
    "amount": {
      "value": "1000.00",
      "currency": "RUB"
    },
    "metadata": {
      "donationId": "uuid-string",
      "donation_type": "one_time",
      "category": "sadaqah"
    }
  }
}
```

---

## 5. Требования к Backend Владимира

### 5.1 Обязательные эндпоинты (КРИТИЧНО)

| Эндпоинт | Статус | Описание |
|----------|--------|----------|
| `GET /api/stats` | ❓ Проверить | Статистика платформы |
| `GET /api/funds` | ❓ Проверить | Список фондов |
| `GET /api/campaigns` | ❓ Проверить | Список кампаний |
| `POST /api/payments/initiate` | ❓ Нужен | Инициализация платежа CloudPayments |

### 5.2 Необходимые доработки

#### A) Эндпоинт `/api/payments/initiate`
**Требуется реализовать** для интеграции с CloudPayments без демо-режима.

**Функционал:**
1. Создание платёжной сессии в CloudPayments
2. Возврат URL для редиректа пользователя
3. Сохранение связи transaction_id ↔ donation_id

#### B) Webhook обработчик
Нужен endpoint на стороне Payment API для приёма webhook от CloudPayments.

---

## 6. Переменные окружения

### Обязательные для работы с Backend Владимира:
```env
# Bot API (Backend Владимира)
BOT_API_BASE_URL=https://bot.e-replika.ru
BOT_API_TOKEN=ваш_токен_от_владимира

# Payment API
PAYMENT_API_URL=https://api.payment.service
PAYMENT_API_TOKEN=токен_платежного_сервиса
```

### Для CloudPayments:
```env
NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID=pk_ваш_публичный_ключ
CLOUDPAYMENTS_API_PASSWORD=ваш_api_password
```

### Для YooKassa:
```env
YOOKASSA_SHOP_ID=ваш_shop_id
YOOKASSA_SECRET_KEY=ваш_secret_key
```

### Для Fondinsan API:
```env
FONDINSAN_API_BASE_URL=https://fondinsan.ru/api/v1
FONDINSAN_ACCESS_TOKEN=ваш_access_token
```

---

## 7. Обработка ошибок

### Ожидаемые коды ошибок от Backend:

| Код | Описание | Действие Frontend |
|-----|----------|-------------------|
| 200 | Успех | Обработать данные |
| 400 | Некорректный запрос | Показать ошибку валидации |
| 401 | Не авторизован | Проверить токен |
| 403 | Доступ запрещён | Показать ошибку доступа |
| 404 | Не найдено | Fallback на Supabase |
| 500 | Ошибка сервера | Fallback на Supabase + логирование |
| Timeout | Нет ответа 10 сек | Fallback на Supabase |

### Формат ошибок (желательный):
```json
{
  "error": "Описание ошибки",
  "code": "ERROR_CODE",
  "details": {}
}
```

---

## 8. Тестирование интеграции

### Проверка доступности API:
```bash
# Проверка Bot API
curl -H "Authorization: Bearer $BOT_API_TOKEN" \
     https://bot.e-replika.ru/api/stats

# Проверка Fondinsan API
curl "https://fondinsan.ru/api/v1/programs?access-token=$FONDINSAN_ACCESS_TOKEN"
```

### Health check:
Frontend предоставляет эндпоинт `GET /api/health` для проверки работоспособности.

---

## Контакты

**Frontend:** [Ваша команда]
**Backend (Владимир):** [Контакты Владимира]

Дата документа: $(date +%Y-%m-%d)

