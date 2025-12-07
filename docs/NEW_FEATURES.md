# Новые функции

## 1. Партнёрские фонды

### Миграции БД

Выполните следующие миграции:

```sql
-- Добавить поля в таблицу funds
\i scripts/018_add_partner_fields.sql

-- Создать таблицу заявок на партнёрство
\i scripts/019_create_partner_applications.sql
```

### API Endpoints

#### GET /api/partners/countries
Возвращает список стран, где есть партнёрские фонды.

**Ответ:**
```json
{
  "countries": [
    { "code": "RU", "name": "Россия" },
    { "code": "KZ", "name": "Казахстан" }
  ]
}
```

#### GET /api/partners/funds
Возвращает список партнёрских фондов с фильтрами.

**Query параметры:**
- `country` - код страны (например, "RU")
- `categories` - категории через запятую (например, "orphans,education")
- `search` - поиск по названию

**Пример:**
```
GET /api/partners/funds?country=RU&categories=orphans,education&search=фонд
```

**Ответ:**
```json
{
  "funds": [
    {
      "id": "uuid",
      "name": "Название фонда",
      "country_code": "RU",
      "categories": ["orphans"],
      "verified": true,
      "logo_url": "https://...",
      "short_desc": "Описание",
      "website": "https://...",
      "social_links": []
    }
  ]
}
```

#### POST /api/partners/applications
Отправка заявки на партнёрство.

**Тело запроса:**
```json
{
  "org_name": "Название организации",
  "country_code": "RU",
  "categories": ["orphans", "education"],
  "website": "https://example.org",
  "contact_name": "Иван Иванов",
  "email": "info@example.org",
  "phone": "+7 999 123-45-67",
  "telegram_username": "@username",
  "about": "Описание деятельности"
}
```

**Ответ:**
```json
{
  "application_id": "uuid",
  "status": "received"
}
```

---

## 2. API для закята

### Миграции БД

```sql
-- Создать таблицу расчетов закята
\i scripts/020_create_zakat_calculations.sql
```

### API Endpoints

#### POST /api/zakat/calc
Расчет закята.

**Тело запроса:**
```json
{
  "assets": {
    "cash_total": 250000,
    "gold_g": 50,
    "silver_g": 0,
    "business_goods_value": 180000,
    "investments": 120000,
    "receivables_collectible": 20000,
    "property_value": 0,
    "other_assets": 0
  },
  "debts_short_term": 60000,
  "nisab_currency": "RUB",
  "nisab_value": 64000,
  "rate_percent": 2.5
}
```

**Ответ:**
```json
{
  "zakat_due": 12750,
  "above_nisab": true,
  "net_wealth": 510000,
  "total_assets": 570000,
  "nisab_value": 64000,
  "calculation_id": "uuid"
}
```

#### GET /api/zakat/history
История расчетов закята пользователя.

**Ответ:**
```json
{
  "calculations": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "payload_json": {...},
      "zakat_due": 12750,
      "above_nisab": true,
      "nisab_value": 64000,
      "nisab_currency": "RUB",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

## 3. Экспорт истории

### API Endpoint

#### GET /api/export/history
Экспорт истории пожертвований в CSV или PDF.

**Query параметры:**
- `format` - формат экспорта: `csv` или `pdf` (по умолчанию `csv`)
- `type` - тип операции: `donation`, `subscription`, `zakat` (опционально)
- `status` - статус: `completed`, `pending`, `failed` (опционально)
- `from` - дата начала (ISO format, опционально)
- `to` - дата окончания (ISO format, опционально)

**Пример:**
```
GET /api/export/history?format=csv&type=donation&status=completed
```

**Ответ:**
- Для CSV: файл CSV с заголовком `Content-Disposition`
- Для PDF: JSON с данными (требует клиентской генерации)

---

## 4. Автоматическая синхронизация отчётов

### API Endpoint

#### POST /api/reports/sync
Синхронизация отчётов от фондов (для webhook или cron).

**Авторизация:**
- Bearer токен: `Authorization: Bearer {API_AUTH_TOKEN}`
- Или авторизованный админ

**Тело запроса (опционально):**
```json
{
  "fund_id": "uuid",
  "report_url": "https://example.org/report.pdf",
  "period_start": "2025-01-01",
  "period_end": "2025-01-31"
}
```

**Ответ:**
```json
{
  "success": true,
  "fund_id": "uuid",
  "message": "Report sync completed"
}
```

**Использование с cron:**
```bash
# Ежедневная синхронизация в 2:00 AM
0 2 * * * curl -X POST https://your-domain.com/api/reports/sync \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

---

## Обновления в UI

### Форма заявки на партнёрство

Форма `/funds/apply` теперь отправляет данные в API `/api/partners/applications` и сохраняет заявки в БД.

### Экспорт в профиле

Кнопка экспорта в профиле (`/profile`) теперь использует API `/api/export/history` для экспорта данных.

---

## Миграции

Выполните все миграции в порядке:

```bash
# 1. Добавить поля партнёров в funds
psql -d your_database -f scripts/018_add_partner_fields.sql

# 2. Создать таблицу заявок
psql -d your_database -f scripts/019_create_partner_applications.sql

# 3. Создать таблицу расчетов закята
psql -d your_database -f scripts/020_create_zakat_calculations.sql
```

---

## Переменные окружения

Убедитесь, что установлены:

```env
# Для автоматической синхронизации отчётов
API_AUTH_TOKEN=your_secret_token_here
```

