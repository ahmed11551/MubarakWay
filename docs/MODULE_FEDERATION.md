# Module Federation - Документация по использованию

## Обзор

Проект MubarakWay настроен как микрофронтенд с использованием Module Federation для Next.js. Это позволяет использовать компоненты и функциональность проекта в других приложениях.

## Конфигурация

### Имя модуля
```
mubarakway
```

### Remote Entry
```
http://your-domain.com/_next/static/chunks/remoteEntry.js
```

## Доступные модули

### Widgets (Виджеты)

#### AppHeader
Шапка приложения с навигацией и профилем пользователя.

```typescript
import { AppHeader } from 'mubarakway/AppHeader'

<AppHeader />
```

#### BottomNav
Нижняя навигация для мобильных устройств.

```typescript
import { BottomNav } from 'mubarakway/BottomNav'

<BottomNav />
```

#### PlatformStats
Виджет статистики платформы (собранные средства, доноры, кампании).

```typescript
import { PlatformStats } from 'mubarakway/PlatformStats'

<PlatformStats />
```

#### CampaignsList
Список кампаний с фильтрацией.

```typescript
import { CampaignsList } from 'mubarakway/CampaignsList'

<CampaignsList 
  activeCampaigns={activeCampaigns}
  endingCampaigns={endingCampaigns}
  completedCampaigns={completedCampaigns}
/>
```

### Features (Функциональность)

#### CreateCampaignForm
Форма создания новой кампании.

```typescript
import { CampaignCreationForm } from 'mubarakway/CreateCampaignForm'

<CampaignCreationForm />
```

#### DonationForm
Форма пожертвования.

```typescript
import { DonationForm } from 'mubarakway/DonationForm'

<DonationForm />
```

#### CampaignsSearch
Поиск кампаний.

```typescript
import { CampaignsSearch } from 'mubarakway/CampaignsSearch'

<CampaignsSearch />
```

### Entities (Сущности)

#### CampaignCard
Карточка кампании для отображения в списках.

```typescript
import { CampaignCard } from 'mubarakway/CampaignCard'

<CampaignCard campaign={campaign} />
```

### Components (Компоненты)

#### QuickDonationBlock
Блок быстрого пожертвования.

```typescript
import { QuickDonationBlock } from 'mubarakway/QuickDonationBlock'

<QuickDonationBlock />
```

#### UltraQuickDonation
Ультра-быстрое пожертвование (3 клика).

```typescript
import { UltraQuickDonation } from 'mubarakway/UltraQuickDonation'

<UltraQuickDonation />
```

#### ZakatCalculatorForm
Калькулятор закята.

```typescript
import { ZakatCalculatorForm } from 'mubarakway/ZakatCalculatorForm'

<ZakatCalculatorForm />
```

### Utilities (Утилиты)

#### ErrorHandler
Обработка ошибок API.

```typescript
import { handleApiError, AppError } from 'mubarakway/ErrorHandler'

try {
  // ...
} catch (error) {
  const apiError = handleApiError(error)
  // ...
}
```

#### BotApi
Клиент для работы с Bot API.

```typescript
import { 
  fetchBotApiStats, 
  fetchBotApiFunds, 
  fetchBotApiCampaigns 
} from 'mubarakway/BotApi'

const stats = await fetchBotApiStats()
const funds = await fetchBotApiFunds()
const campaigns = await fetchBotApiCampaigns()
```

## Использование в Host-приложении

### 1. Настройка Next.js конфигурации

В `next.config.mjs` вашего host-приложения:

```javascript
const NextFederationPlugin = require('@module-federation/nextjs-mf')

const nextConfig = {
  webpack: (config, options) => {
    const { isServer } = options
    
    config.plugins.push(
      new NextFederationPlugin({
        name: 'host',
        remotes: {
          mubarakway: `mubarakway@http://localhost:3000/_next/static/chunks/remoteEntry.js`,
        },
        shared: {
          react: {
            singleton: true,
            requiredVersion: false,
          },
          'react-dom': {
            singleton: true,
            requiredVersion: false,
          },
        },
      })
    )
    
    return config
  },
}

module.exports = nextConfig
```

### 2. Использование компонентов

```typescript
// app/page.tsx или любой другой компонент
import dynamic from 'next/dynamic'

// Динамический импорт для клиентских компонентов
const PlatformStats = dynamic(
  () => import('mubarakway/PlatformStats'),
  { ssr: false }
)

const QuickDonationBlock = dynamic(
  () => import('mubarakway/QuickDonationBlock'),
  { ssr: false }
)

export default function HomePage() {
  return (
    <div>
      <PlatformStats />
      <QuickDonationBlock />
    </div>
  )
}
```

### 3. Переменные окружения

Убедитесь, что в host-приложении настроены необходимые переменные окружения для работы модулей:

```env
# Bot API
BOT_API_BASE_URL=https://bot.e-replika.ru
BOT_API_TOKEN=your_token

# Supabase (если используется fallback)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Payment API
PAYMENT_API_URL=your_payment_api_url
PAYMENT_API_TOKEN=your_payment_token
```

## Развертывание

### Development

```bash
npm run dev
# или
pnpm dev
```

Модуль будет доступен по адресу: `http://localhost:3000/_next/static/chunks/remoteEntry.js`

### Production

```bash
npm run build
npm start
```

Или через Docker:

```bash
docker-compose up --build
```

### Настройка CORS

Убедитесь, что в production настроены правильные CORS заголовки для доступа к remoteEntry.js:

```javascript
// middleware.ts или next.config.mjs
headers: [
  {
    key: 'Access-Control-Allow-Origin',
    value: '*', // или конкретный домен host-приложения
  },
  {
    key: 'Access-Control-Allow-Methods',
    value: 'GET, POST, PUT, DELETE, OPTIONS',
  },
  {
    key: 'Access-Control-Allow-Headers',
    value: 'Content-Type, Authorization',
  },
]
```

## Требования

- Next.js 16+
- React 19+
- @module-federation/nextjs-mf ^8.9.0

## Устранение неполадок

При возникновении проблем проверьте:

1. Правильность URL remoteEntry.js
2. Настройки CORS
3. Совместимость версий React и Next.js между host и remote
4. Переменные окружения

## Дополнительная документация

- `docs/BACKEND_API_INTEGRATION.md` - интеграция с backend
- `docs/BACKEND_REQUIREMENTS_FOR_VLADIMIR.md` - требования к API

