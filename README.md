# SadakaPass - Платформа благотворительности

Next.js приложение для управления благотворительными кампаниями с интеграцией Telegram бота.

## Быстрый старт

### Вариант 1: Docker (рекомендуется)

Запуск одной командой:

```bash
# 1. Скопируйте и настройте переменные окружения
cp env.example .env.local
# Отредактируйте .env.local - заполните обязательные переменные

# 2. Запустите приложение
docker-compose up --build
```

Приложение будет доступно по адресу `http://localhost:3000`

Команды управления:
```bash
# Запуск в фоне
docker-compose up -d

# Просмотр логов
docker-compose logs -f app

# Остановка
docker-compose down

# Пересборка после изменений
docker-compose up --build
```

### Вариант 2: Локальная разработка

```bash
# 1. Установка зависимостей
pnpm install

# 2. Настройка окружения
cp env.example .env.local
# Отредактируйте .env.local

# 3. Запуск в режиме разработки
pnpm dev
```

---

## Переменные окружения

Скопируйте `env.example` в `.env.local` и заполните значениями.

### Обязательные переменные

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# API защита
API_AUTH_TOKEN=random_secure_token
```

### Backend API

```env
# Bot API - основной backend для статистики и данных
BOT_API_BASE_URL=https://bot.e-replika.ru
BOT_API_TOKEN=токен_от_backend

# Payment API - для обработки платежей
PAYMENT_API_URL=https://api.payment-service.com
PAYMENT_API_TOKEN=токен_для_платежей
```

### Платежные системы

```env
# YooKassa (для рублей)
YOOKASSA_SHOP_ID=123456
YOOKASSA_SECRET_KEY=secret_key

# CloudPayments (для международных платежей)
NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID=pk_xxx
```

### Опциональные переменные

```env
# Telegram бот
TELEGRAM_BOT_TOKEN=bot_token
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=BotUsername

# Fondinsan API
FONDINSAN_ACCESS_TOKEN=access_token

# Redis / Upstash (для rate limiting и кеширования)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
# Или стандартный Redis
# REDIS_URL=redis://localhost:6379

# Sentry (мониторинг ошибок)
NEXT_PUBLIC_SENTRY_DSN=sentry_dsn
```

Полный список переменных см. в файле `env.example`

### Redis для Rate Limiting и Кеширования

Для production рекомендуется настроить Redis (Upstash или стандартный):
- **Rate Limiting** - защита от злоупотреблений
- **Кеширование** - улучшение производительности

Без Redis приложение использует in-memory fallback (работает только на одном инстансе).

Подробная инструкция: `docs/REDIS_SETUP.md`

---

## Интеграция с Backend API

Frontend интегрируется с несколькими backend-системами:

| Система | Назначение | Документация |
|---------|------------|--------------|
| Bot API | Статистика, кампании, фонды | `docs/BACKEND_API_INTEGRATION.md` |
| Payment API | Обработка платежей CloudPayments | `docs/BACKEND_API_INTEGRATION.md` |
| Fondinsan API | Программы фонда Инсан | `docs/BACKEND_API_INTEGRATION.md` |
| Supabase | Fallback база данных | [Supabase Docs](https://supabase.com/docs) |

### Для Backend разработчика

Требования к API см. в `docs/BACKEND_REQUIREMENTS_FOR_VLADIMIR.md`

Критичные эндпоинты, которые должны быть реализованы:
- `POST /api/payments/initiate` - инициализация платежа
- `GET /api/stats` - статистика платформы
- `GET /api/funds` - список фондов
- `GET /api/campaigns` - список кампаний

### Обработка ошибок

Frontend корректно обрабатывает все типы ошибок:
- Сетевые ошибки (таймауты, отсутствие соединения)
- Ошибки авторизации (401, 403)
- Ошибки валидации (400)
- Серверные ошибки (500+)

При недоступности Bot API автоматически используется Supabase как fallback.

### Настройка базы данных

После настройки переменных окружения необходимо выполнить миграции базы данных. **Важно:** недостаточно запустить только `run-create-insan-fund.js` - сначала нужно выполнить все SQL миграции.

#### 1. Выполнение SQL миграций

Все SQL скрипты миграций находятся в папке `scripts/` и должны быть выполнены в Supabase SQL Editor строго по порядку:

Пошаговая инструкция:

1. Откройте https://supabase.com/dashboard
2. Выберите ваш проект
3. Перейдите в SQL Editor (в боковом меню слева)
4. Откройте файл `scripts/001_create_profiles.sql` в вашем редакторе
5. Скопируйте весь содержимый файла
6. Вставьте в SQL Editor в Supabase
7. Нажмите Run (или `Ctrl+Enter`)
8. Убедитесь, что скрипт выполнен успешно
9. Повторите для следующего скрипта

Список миграций в порядке выполнения:

Обязательные миграции (выполнить все):
- 001_create_profiles.sql
- 002_create_funds.sql
- 003_create_campaigns.sql
- 004_create_donations.sql
- 005_create_campaign_updates.sql
- 006_create_subscriptions.sql
- 007_create_reports.sql
- 009_create_rpc_functions.sql
- 010_create_insan_fund.sql
- 013_create_campaign_social_features.sql
- 014_create_rating_system.sql
- 015_add_campaign_documents.sql
- 016_add_admin_field.sql
- 016_create_campaign_links.sql
- 017_fix_search_path_security.sql

Опциональные миграции (можно пропустить):
- 008_seed_initial_data.sql - начальные тестовые данные
- 011_cleanup_funds.sql - очистка фондов
- 012_create_insan_fund_only.sql - альтернативный вариант создания фонда

Важно: выполнять скрипты строго по порядку, так как они зависят друг от друга. Если скрипт уже был выполнен ранее, некоторые могут выдать ошибку - это нормально (используется `CREATE TABLE IF NOT EXISTS`).

#### 2. Создание фонда Инсан

После выполнения SQL миграций запустите скрипт для создания/обновления фонда Инсан:

```bash
node scripts/run-create-insan-fund.js
```

Этот скрипт:
- Создает или обновляет фонд "Инсан" в базе данных
- Деактивирует другие фонды (если нужно)
- Проверяет результат

Требования: убедитесь, что в `.env.local` заполнены `NEXT_PUBLIC_SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY`.

### Установка Sentry (опционально)

Для включения мониторинга ошибок через Sentry:

```bash
pnpm add @sentry/nextjs
```

Конфигурация Sentry уже настроена в проекте. Просто добавьте `NEXT_PUBLIC_SENTRY_DSN` в `.env.local`.

## Module Federation (Микрофронтенд)

Проект настроен как микрофронтенд с использованием Module Federation для Next.js. Это позволяет использовать компоненты и функциональность проекта в других приложениях.

Полная документация см. в `docs/MODULE_FEDERATION.md`

### Быстрый старт для host-приложения

1. Настройте `next.config.mjs` в вашем host-приложении:
```javascript
const NextFederationPlugin = require('@module-federation/nextjs-mf')

const nextConfig = {
  webpack: (config) => {
    config.plugins.push(
      new NextFederationPlugin({
        name: 'host',
        remotes: {
          mubarakway: `mubarakway@http://localhost:3000/_next/static/chunks/remoteEntry.js`,
        },
      })
    )
    return config
  },
}
```

2. Используйте компоненты:
```typescript
import dynamic from 'next/dynamic'

const PlatformStats = dynamic(
  () => import('mubarakway/PlatformStats'),
  { ssr: false }
)
```

### Доступные модули

- Widgets: `AppHeader`, `BottomNav`, `PlatformStats`, `CampaignsList`
- Features: `CreateCampaignForm`, `DonationForm`, `CampaignsSearch`
- Components: `QuickDonationBlock`, `UltraQuickDonation`, `ZakatCalculatorForm`
- Utilities: `ErrorHandler`, `BotApi`

## Архитектура

Проект использует:
- Next.js 16 с App Router
- TypeScript для типобезопасности
- Supabase для базы данных и аутентификации
- Zod для валидации API запросов
- Feature-Sliced Design (FSD) для организации кода
- Module Federation для микрофронтенд архитектуры
- Централизованная обработка ошибок через `lib/error-handler.ts`
- Типы вынесены в `types/index.ts`
- Трансформеры для данных в `lib/transformers/`

### Feature-Sliced Design (FSD)

Проект организован по методологии FSD в директории `src/`:

```
src/
├── shared/      # Переиспользуемый код (типы, утилиты, API схемы)
├── entities/    # Бизнес-сущности (campaign, donation, fund)
├── features/    # Бизнес-функции (create-campaign, make-donation)
└── widgets/     # Крупные составные блоки UI (header, campaign-list)
```

Использование FSD импортов:
```typescript
// Entities
import { CampaignCard } from '@/entities/campaign/ui/campaign-card'
import { getCampaignById } from '@/entities/campaign/api'

// Features
import { CreateCampaignForm } from '@/features/create-campaign/ui/create-campaign-form'

// Widgets
import { AppHeader } from '@/widgets/header/ui/app-header'

// Shared
import { handleApiError } from '@/shared/lib/error-handler'
```

## Лицензия

MIT
