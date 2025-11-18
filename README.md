# SadakaPass - Платформа благотворительности

Next.js приложение для управления благотворительными кампаниями с интеграцией Telegram бота.

## 🚀 Быстрый старт

### Вариант 1: Docker (рекомендуется)

Запуск одной командой:

```bash
docker-compose up
```

Приложение будет доступно по адресу `http://localhost:3000`

Для остановки:
```bash
docker-compose down
```

### Вариант 2: Локальная разработка

#### Установка

```bash
pnpm install
pnpm dev
```

### Переменные окружения

Создайте `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# API
API_AUTH_TOKEN=your_api_token

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_SECRET_TOKEN=your_telegram_secret_token
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=YourBotUsername

# App
NEXT_PUBLIC_BASE_URL=https://your-domain.com

# Sentry (опционально, для мониторинга ошибок)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

Для Docker также можно использовать `.env.local` - переменные будут автоматически подхвачены из файла.

### Установка Sentry (опционально)

Для включения мониторинга ошибок через Sentry:

```bash
pnpm add @sentry/nextjs
```

Конфигурация Sentry уже настроена в проекте. Просто добавьте `NEXT_PUBLIC_SENTRY_DSN` в `.env.local`.

## 🏗️ Архитектура

Проект использует:
- **Next.js 16** с App Router
- **TypeScript** для типобезопасности
- **Supabase** для базы данных и аутентификации
- **Zod** для валидации API запросов
- **Feature-Sliced Design (FSD)** для организации кода
- **Централизованная обработка ошибок** через `lib/error-handler.ts`
- **Типы** вынесены в `types/index.ts`
- **Трансформеры** для данных в `lib/transformers/`

### Feature-Sliced Design (FSD)

Проект организован по методологии FSD в директории `src/`:

```
src/
├── shared/      # Переиспользуемый код (типы, утилиты, API схемы)
├── entities/    # Бизнес-сущности (campaign, donation, fund)
├── features/    # Бизнес-функции (create-campaign, make-donation)
└── widgets/     # Крупные составные блоки UI (header, campaign-list)
```

**Использование FSD импортов:**
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

Подробнее см. [ARCHITECTURE.md](ARCHITECTURE.md)

## 📝 Лицензия

MIT
