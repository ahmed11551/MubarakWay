# Требования к Backend API для Владимира

## Краткое описание

Frontend SadakaPass требует следующие API эндпоинты для полноценной работы без заглушек.

---

## Существующие эндпоинты (требуется проверка работоспособности)

### 1. GET /api/stats
**Назначение:** Статистика платформы для главной страницы

**Ответ:**
```json
{
  "total_collected": 1500000.00,
  "active_donors": 234,
  "active_campaigns": 12,
  "average_check": 1500.50
}
```

### 2. GET /api/funds
**Назначение:** Список благотворительных фондов

**Query параметры:**
- `category` (опционально): `zakat`, `orphans`, `water`, `mosque`, `education`, `healthcare`, `emergency`, `general`

**Ответ:**
```json
{
  "funds": [
    {
      "id": "uuid",
      "name": "Название фонда",
      "description": "Описание",
      "category": "general",
      "logo_url": "https://...",
      "is_active": true,
      "total_raised": 500000.00,
      "donor_count": 150
    }
  ]
}
```

### 3. GET /api/campaigns
**Назначение:** Список кампаний по сбору средств

**Query параметры:**
- `status` (опционально): `pending`, `active`, `completed`, `rejected`
- `limit` (опционально): число, по умолчанию 50

**Ответ:**
```json
{
  "campaigns": [
    {
      "id": "uuid",
      "title": "Название",
      "description": "Описание",
      "goal_amount": 100000.00,
      "current_amount": 45000.00,
      "currency": "RUB",
      "category": "medical",
      "status": "active",
      "image_url": "https://..."
    }
  ]
}
```

---

## Отсутствующие эндпоинты (требуется реализация)

### 4. POST /api/payments/initiate (КРИТИЧНО)

**Назначение:** Инициализация платежа через CloudPayments

**Запрос:**
```json
{
  "donation_id": "uuid",
  "amount": 1000.00,
  "currency": "RUB",
  "donation_type": "one_time",
  "frequency": null,
  "category": "sadaqah",
  "fund_id": "uuid",
  "campaign_id": "uuid",
  "message": "Сообщение",
  "is_anonymous": false,
  "invoice_id": "{\"donationId\":\"uuid\"}",
  "return_url": "https://app/payment/success",
  "cancel_url": "https://app/payment/cancel"
}
```

**Ожидаемый ответ:**
```json
{
  "payment_url": "https://cloudpayments.ru/pay/...",
  "transaction_id": "TXN123"
}
```

**Что должен делать backend:**
1. Создать платёжную сессию в CloudPayments API
2. Вернуть URL для редиректа пользователя
3. Сохранить связь transaction_id ↔ donation_id

---

### 5. POST /api/cloudpayments/webhook (опционально)

**Назначение:** Обработка уведомлений от CloudPayments о статусе платежа

Можно использовать наш endpoint `/api/cloudpayments/webhook` или реализовать свой.

---

## Авторизация

Все запросы от frontend к Bot API используют Bearer токен:

```
Authorization: Bearer {BOT_API_TOKEN}
```

Токен настраивается через переменную окружения `BOT_API_TOKEN`.

---

## Обработка ошибок

**Желательный формат ошибок:**
```json
{
  "error": "Описание ошибки для пользователя",
  "code": "ERROR_CODE",
  "details": {}
}
```

**HTTP коды:**
- `200` - успех
- `400` - некорректный запрос
- `401` - не авторизован
- `404` - не найдено
- `500` - ошибка сервера

---

## Переменные окружения для Frontend

```env
# Bot API (ваш backend)
BOT_API_BASE_URL=https://bot.e-replika.ru
BOT_API_TOKEN=секретный_токен

# Payment API (если отдельный сервис)
PAYMENT_API_URL=https://ваш-payment-сервис.ru
PAYMENT_API_TOKEN=токен_для_платежей
```

---

## Приоритеты

| Приоритет | Эндпоинт | Статус |
|-----------|----------|--------|
| Высокий | POST /api/payments/initiate | Требуется реализация |
| Средний | GET /api/stats | Требуется проверка |
| Средний | GET /api/funds | Требуется проверка |
| Средний | GET /api/campaigns | Требуется проверка |

---

## Тестирование

После реализации, пожалуйста, предоставьте:

1. **BOT_API_TOKEN** для авторизации
2. **URL базового API** (если отличается от bot.e-replika.ru)
3. Тестовые credentials для CloudPayments (если нужны)

---

## Контакт для вопросов

При возникновении вопросов по формату данных или интеграции — обращайтесь.

