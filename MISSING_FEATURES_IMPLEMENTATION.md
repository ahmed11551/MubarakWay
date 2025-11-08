# 🔧 Технические требования для реализации недостающих функций

## 1. 🔴 Курбан / Курбани (КРИТИЧНО)

### 1.1 Функциональные требования

#### Основные функции:
- ✅ Оформление заявки на Курбан
- ✅ Выбор типа Курбана (овца, корова, верблюд)
- ✅ Выбор количества
- ✅ Выбор фонда/программы
- ✅ Упрощенная форма (минимальные поля)
- ✅ История заявок на Курбан
- ✅ Статус заявки (в обработке, выполнено, отменено)
- ✅ Интеграция с платежами

#### Типы Курбана:
- Овца (1 человек)
- Корова (7 человек)
- Верблюд (7 человек)
- Доля в корове/верблюде

### 1.2 Техническая реализация

#### База данных

```sql
-- Создать таблицу для заявок на Курбан
CREATE TABLE IF NOT EXISTS public.qurban_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  fund_id UUID REFERENCES public.funds(id) ON DELETE SET NULL,
  qurban_type TEXT NOT NULL CHECK (qurban_type IN ('sheep', 'cow', 'camel', 'share')),
  quantity INTEGER NOT NULL DEFAULT 1,
  share_count INTEGER, -- Для долей в корове/верблюде
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'RUB' CHECK (currency IN ('RUB', 'USD', 'EUR', 'SAR', 'AED')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'completed', 'cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  donation_id UUID REFERENCES public.donations(id) ON DELETE SET NULL,
  recipient_name TEXT, -- Имя получателя (опционально)
  recipient_phone TEXT, -- Телефон получателя (опционально)
  delivery_address TEXT, -- Адрес доставки (опционально)
  special_instructions TEXT, -- Особые указания
  requested_date DATE, -- Желаемая дата выполнения
  completed_date DATE, -- Дата выполнения
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS qurban_requests_user_id_idx ON public.qurban_requests(user_id);
CREATE INDEX IF NOT EXISTS qurban_requests_fund_id_idx ON public.qurban_requests(fund_id);
CREATE INDEX IF NOT EXISTS qurban_requests_status_idx ON public.qurban_requests(status);
CREATE INDEX IF NOT EXISTS qurban_requests_created_at_idx ON public.qurban_requests(created_at DESC);

-- RLS политики
ALTER TABLE public.qurban_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qurban_requests_select_own"
  ON public.qurban_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "qurban_requests_insert_own"
  ON public.qurban_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "qurban_requests_update_own"
  ON public.qurban_requests FOR UPDATE
  USING (auth.uid() = user_id);
```

#### Структура файлов

```
app/
  qurban/
    page.tsx              # Главная страница Курбана
    new/
      page.tsx            # Форма создания заявки
    [id]/
      page.tsx            # Детали заявки
    history/
      page.tsx            # История заявок

components/
  qurban/
    qurban-form.tsx       # Форма заявки на Курбан
    qurban-type-selector.tsx  # Выбор типа Курбана
    qurban-history.tsx    # История заявок
    qurban-card.tsx       # Карточка заявки

lib/
  actions/
    qurban.ts             # Server actions для Курбана
```

#### API Endpoints

```typescript
// lib/actions/qurban.ts

export async function createQurbanRequest(input: {
  fundId: string
  qurbanType: 'sheep' | 'cow' | 'camel' | 'share'
  quantity: number
  shareCount?: number
  amount: number
  currency: string
  recipientName?: string
  recipientPhone?: string
  deliveryAddress?: string
  specialInstructions?: string
  requestedDate?: string
})

export async function getQurbanRequests()
export async function getQurbanRequestById(id: string)
export async function updateQurbanRequestStatus(id: string, status: string)
```

#### UI Компоненты

**Упрощенная форма (как в "Закят"):**
- Минимум полей: тип, количество, фонд
- Быстрое оформление (3-4 шага)
- Интеграция с платежами
- Подтверждение заявки

### 1.3 Интеграция с платежами

- Создание пожертвования при оформлении заявки
- Связь заявки с пожертвованием через `donation_id`
- Обновление статуса заявки при успешной оплате

---

## 2. 🔴 PWA (Progressive Web App) (КРИТИЧНО)

### 2.1 Функциональные требования

- ✅ Установка на устройство (iOS, Android, Desktop)
- ✅ Иконка на главном экране
- ✅ Запуск в полноэкранном режиме
- ✅ Офлайн-режим (базовый)
- ✅ Кэширование статических ресурсов
- ✅ Push-уведомления (опционально)

### 2.2 Техническая реализация

#### manifest.json

```json
{
  "name": "MubarakWay - Садака-Пасс",
  "short_name": "MubarakWay",
  "description": "Исламская платформа благотворительности",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#16a34a",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/desktop.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    },
    {
      "src": "/screenshots/mobile.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ],
  "categories": ["lifestyle", "finance"],
  "shortcuts": [
    {
      "name": "Быстрое пожертвование",
      "short_name": "Пожертвовать",
      "description": "Сделать быстрое пожертвование",
      "url": "/donate?quick=true",
      "icons": [{ "src": "/icons/donate-96x96.png", "sizes": "96x96" }]
    },
    {
      "name": "История",
      "short_name": "История",
      "description": "История пожертвований",
      "url": "/profile",
      "icons": [{ "src": "/icons/history-96x96.png", "sizes": "96x96" }]
    }
  ]
}
```

#### Service Worker

```typescript
// public/sw.js или app/sw.ts

const CACHE_NAME = 'mubarakway-v1'
const STATIC_ASSETS = [
  '/',
  '/campaigns',
  '/funds',
  '/profile',
  '/donate',
  '/zakat-calculator',
  // ... другие статические страницы
]

// Установка
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Активация
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Fetch
self.addEventListener('fetch', (event) => {
  // Network-first стратегия для API
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
          return response
        })
        .catch(() => {
          return caches.match(event.request)
        })
    )
  } else {
    // Cache-first для статических ресурсов
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request)
      })
    )
  }
})
```

#### Регистрация Service Worker

```typescript
// app/layout.tsx или components/pwa-installer.tsx

'use client'

import { useEffect } from 'react'

export function PWAInstaller() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration)
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }
  }, [])

  return null
}
```

#### Подключение в layout.tsx

```typescript
// app/layout.tsx

export const metadata: Metadata = {
  // ... существующие метаданные
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MubarakWay',
  },
  // ...
}

// В head добавить:
<link rel="manifest" href="/manifest.json" />
<link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
<meta name="theme-color" content="#16a34a" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="MubarakWay" />
```

### 2.3 Иконки

Нужно создать иконки следующих размеров:
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

Все иконки должны быть в формате PNG с прозрачностью.

### 2.4 Установка PWA

Добавить компонент для предложения установки:

```typescript
// components/pwa-install-prompt.tsx

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Установить MubarakWay</DialogTitle>
          <DialogDescription>
            Установите приложение для быстрого доступа и работы в офлайн-режиме
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Button onClick={handleInstall} className="flex-1">
            Установить
          </Button>
          <Button variant="outline" onClick={() => setShowPrompt(false)}>
            Позже
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 3. 🟡 Дополнительные улучшения

### 3.1 Push-уведомления

- Интеграция с Web Push API
- Уведомления о статусе Курбана
- Напоминания о регулярных пожертвованиях
- Уведомления о новых кампаниях

### 3.2 Офлайн-режим

- Кэширование истории пожертвований
- Просмотр кампаний без интернета
- Очередь действий для синхронизации

### 3.3 Улучшенный мобильный UX

- Более нативный вид
- Улучшенная навигация
- Оптимизация для touch-жестов
- Анимации и переходы

---

## 📋 Чеклист реализации

### Курбан
- [ ] Создать таблицу `qurban_requests` в БД
- [ ] Создать страницу `/qurban`
- [ ] Создать форму заявки
- [ ] Интегрировать с платежами
- [ ] Добавить историю заявок
- [ ] Добавить статусы заявок
- [ ] Тестирование

### PWA
- [ ] Создать `manifest.json`
- [ ] Создать service worker
- [ ] Создать иконки всех размеров
- [ ] Зарегистрировать service worker
- [ ] Добавить мета-теги в layout
- [ ] Создать компонент установки
- [ ] Тестирование на iOS/Android

---

## 🎯 Приоритеты

1. **Курбан** - Критично для исламской платформы
2. **PWA** - Важно для пользовательского опыта
3. **Push-уведомления** - Улучшение UX
4. **Офлайн-режим** - Дополнительная функция

