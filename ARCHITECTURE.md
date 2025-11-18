# Архитектура проекта (FSD)

Проект использует **Feature-Sliced Design (FSD)** архитектуру для лучшей масштабируемости и поддерживаемости.

## Структура проекта

Проект использует гибридный подход: Next.js App Router (`app/`) для маршрутизации и FSD структура (`src/`) для организации кода.

```
├── app/              # Next.js App Router (маршрутизация)
│   ├── layout.tsx
│   ├── page.tsx
│   ├── campaigns/
│   ├── funds/
│   ├── profile/
│   └── api/          # API routes
│
├── src/              # FSD структура
│   ├── widgets/      # Крупные составные блоки UI
│   │   ├── header/
│   │   │   └── ui/app-header.tsx
│   │   ├── navigation/
│   │   │   └── ui/bottom-nav.tsx
│   │   ├── campaign-list/
│   │   │   └── ui/campaigns-list.tsx
│   │   └── stats/
│   │       └── ui/platform-stats.tsx
│   │
│   ├── features/     # Бизнес-функции
│   │   ├── create-campaign/
│   │   │   └── ui/create-campaign-form.tsx
│   │   ├── make-donation/
│   │   │   └── ui/donation-form.tsx
│   │   └── search-campaigns/
│   │       └── ui/campaigns-search.tsx
│   │
│   ├── entities/     # Бизнес-сущности
│   │   ├── campaign/
│   │   │   ├── model/types.ts
│   │   │   ├── api/index.ts
│   │   │   ├── lib/transformers.ts
│   │   │   └── ui/campaign-card.tsx
│   │   ├── donation/
│   │   │   ├── model/types.ts
│   │   │   └── api/index.ts
│   │   └── fund/
│   │       ├── model/types.ts
│   │       └── api/index.ts
│   │
│   └── shared/       # Переиспользуемый код
│       ├── lib/      # Утилиты (реэкспорты из lib/)
│       ├── api/      # API схемы
│       └── types/    # Общие типы
│
├── components/       # UI компоненты (shadcn/ui и другие)
│   └── ui/          # Shadcn UI компоненты
│
└── lib/             # Утилиты и хелперы
    ├── actions/     # Server actions
    ├── transformers/
    └── ...
```

## Правила импортов

1. **Слои могут импортировать только из нижележащих слоев:**
   - `app/` (pages) → `widgets`, `features`, `entities`, `shared`
   - `widgets` → `features`, `entities`, `shared`
   - `features` → `entities`, `shared`
   - `entities` → `shared`
   - `shared` → только внешние зависимости

2. **Запрещены горизонтальные импорты** (между срезами одного слоя)

3. **Запрещены импорты из вышележащих слоев**

4. **TypeScript path aliases:**
   - `@/shared/*` → `src/shared/*`
   - `@/entities/*` → `src/entities/*`
   - `@/features/*` → `src/features/*`
   - `@/widgets/*` → `src/widgets/*`

## Слои FSD

### `shared/`
Переиспользуемый код, не зависящий от бизнес-логики:
- UI компоненты (кнопки, карточки, формы)
- Утилиты (форматирование, валидация)
- API клиенты
- Типы
- Конфигурация

### `entities/`
Бизнес-сущности приложения:
- `campaign/` — кампании
- `donation/` — пожертвования
- `fund/` — фонды
- `user/` — пользователи

Каждая сущность содержит:
- `model/` — типы и интерфейсы
- `api/` — API методы для работы с сущностью
- `ui/` — компоненты для отображения сущности

### `features/`
Бизнес-функции (действия пользователя):
- `create-campaign/` — создание кампании
- `make-donation/` — совершение пожертвования
- `search-campaigns/` — поиск кампаний
- `filter-campaigns/` — фильтрация кампаний

Каждая фича содержит:
- `ui/` — UI компоненты фичи
- `api/` — API методы фичи (если нужны)
- `model/` — типы и логика фичи

### `widgets/`
Крупные составные блоки UI:
- `header/` — шапка сайта
- `campaign-list/` — список кампаний
- `donation-form/` — форма пожертвования
- `stats/` — статистика платформы

### `pages/`
Страницы приложения (Next.js pages)

### `app/`
Инициализация приложения (Next.js App Router)

## Примеры

### Импорт из shared
```typescript
import { cn } from '@/shared/lib/utils'
import type { ApiError } from '@/shared/types'
```

### Импорт из entities
```typescript
import { CampaignCard } from '@/entities/campaign/ui/campaign-card'
import { getCampaignById, getCampaigns } from '@/entities/campaign/api'
import { transformCampaign, filterUrgentCampaigns } from '@/entities/campaign/lib/transformers'
import type { Campaign, TransformedCampaign } from '@/entities/campaign/model/types'
```

### Импорт из features
```typescript
import { CampaignCreationForm } from '@/features/create-campaign/ui/create-campaign-form'
import { DonationForm } from '@/features/make-donation/ui/donation-form'
import { CampaignsSearch } from '@/features/search-campaigns/ui/campaigns-search'
```

### Импорт из widgets
```typescript
import { AppHeader } from '@/widgets/header/ui/app-header'
import { BottomNav } from '@/widgets/navigation/ui/bottom-nav'
import { CampaignsList } from '@/widgets/campaign-list/ui/campaigns-list'
import { PlatformStats } from '@/widgets/stats/ui/platform-stats'
```

### Пример использования в странице (app/)
```typescript
// app/page.tsx
// FSD widgets
import { AppHeader } from "@/widgets/header/ui/app-header"
import { BottomNav } from "@/widgets/navigation/ui/bottom-nav"
import { PlatformStats } from "@/widgets/stats/ui/platform-stats"
// FSD entities
import { getCampaigns } from "@/entities/campaign/api"
import { transformCampaign, filterUrgentCampaigns } from "@/entities/campaign/lib/transformers"
import type { Campaign } from "@/entities/campaign/model/types"
```

## Миграция

Проект был реорганизован из стандартной Next.js структуры в FSD. Все импорты обновлены для соответствия новой структуре.

### Статус миграции

✅ **Завершено:**
- Создана FSD структура в `src/`
- Настроены TypeScript path aliases
- Перенесены основные entities (campaign, donation, fund)
- Перенесены ключевые features (create-campaign, make-donation, search-campaigns)
- Перенесены основные widgets (header, navigation, campaign-list, stats)
- Обновлены импорты во всех страницах `app/`
- Все файлы проверены на ошибки

### Обратная совместимость

Для плавной миграции созданы реэкспорты в FSD слоях, которые ссылаются на старые пути. Это позволяет постепенно мигрировать код без поломки существующей функциональности.

### Следующие шаги (опционально)

1. Перенести остальные компоненты из `components/` в соответствующие FSD слои
2. Удалить старые реэкспорты после полной миграции
3. Добавить больше features и widgets по мере необходимости

