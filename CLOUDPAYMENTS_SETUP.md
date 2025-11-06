# 💳 Почему CloudPayments не подключен и как это исправить

## ❌ Текущая ситуация

### Проблема: Реальный платёжный виджет не подключен

**Причина**: Код находится в **демо-режиме** для тестирования UI без реальных платежей.

---

## 🔍 Что происходит сейчас:

### 1. **Демо-режим активирован** (`lib/cloudpayments.ts`, строки 48-56):
```typescript
// Временно используем демо-режим без реального publicId
console.log("[v0] CloudPayments демо-режим:", config)

// Имитация успешной оплаты для демонстрации
setTimeout(() => {
  console.log("[v0] CloudPayments демо: платёж успешен")
  callbacks.onSuccess?.({ transactionId: `DEMO-${Date.now()}` })
  callbacks.onComplete?.({ success: true }, config)
}, 1500)
```

### 2. **Реальный код закомментирован** (`lib/cloudpayments.ts`, строки 59-96):
```typescript
// Раскомментируйте код ниже, когда получите publicId от CloudPayments
/*
await loadCloudPaymentsWidget()
// ... реальный код виджета
*/
```

### 3. **Используется демо-значение** (`components/cloudpayments-button.tsx`, строка 37):
```typescript
publicId: "demo", // Временное значение для демонстрации
```

### 4. **Нет переменных окружения**:
- `NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID` - пустой
- `CLOUDPAYMENTS_API_SECRET` - пустой

---

## ✅ Что нужно сделать для подключения:

### Шаг 1: Получить доступ к CloudPayments

1. Зарегистрируйтесь на https://cloudpayments.ru/
2. Создайте аккаунт (личный кабинет)
3. Получите `publicId` (публичный ключ) из личного кабинета
4. Получите `API_SECRET` (секретный ключ) из настроек API

**Где найти:**
- Личный кабинет → Настройки → API ключи
- `publicId` обычно начинается с `pk_` (например, `pk_test_...` для тестового)
- `API_SECRET` - секретный ключ для webhook'ов

---

### Шаг 2: Добавить переменные окружения

#### В `.env.local` (для локальной разработки):
```env
NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID=pk_xxxxxxxxxxxxxxxxxxxxxxxx
CLOUDPAYMENTS_API_SECRET=your_secret_key_here
```

#### В Vercel (для продакшена):
1. Перейдите в настройки проекта: https://vercel.com/your-project/settings/environment-variables
2. Добавьте переменные:
   - `NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID` = ваш publicId
   - `CLOUDPAYMENTS_API_SECRET` = ваш API_SECRET

---

### Шаг 3: Раскомментировать реальный код

В файле `lib/cloudpayments.ts`:

1. **Удалить** демо-режим (строки 48-56)
2. **Раскомментировать** реальный код (строки 59-96)
3. **Использовать** переменную окружения для `publicId`:

```typescript
export async function initiateCloudPayment(config: CloudPaymentsConfig, callbacks: CloudPaymentsCallbacks = {}) {
  try {
    await loadCloudPaymentsWidget()

    if (!window.cp) {
      throw new Error("Виджет CloudPayments не загружен")
    }

    const widget = new window.cp.CloudPayments()

    widget.pay(
      "charge",
      {
        publicId: process.env.NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID || config.publicId,
        description: config.description,
        amount: config.amount,
        currency: config.currency,
        invoiceId: config.invoiceId,
        accountId: config.accountId,
        email: config.email,
        skin: config.skin || "modern",
        data: config.data || {},
      },
      {
        onSuccess: (options: any) => {
          console.log("[v0] CloudPayments успех:", options)
          callbacks.onSuccess?.(options)
        },
        onFail: (reason: string, options: any) => {
          console.error("[v0] CloudPayments ошибка:", reason, options)
          callbacks.onFail?.(reason, options)
        },
        onComplete: (paymentResult: any, options: any) => {
          console.log("[v0] CloudPayments завершено:", paymentResult, options)
          callbacks.onComplete?.(paymentResult, options)
        },
      },
    )
  } catch (error) {
    console.error("[v0] Ошибка CloudPayments:", error)
    throw error
  }
}
```

---

### Шаг 4: Обновить компонент кнопки

В файле `components/cloudpayments-button.tsx`:

Заменить:
```typescript
publicId: "demo", // Временное значение для демонстрации
```

На:
```typescript
publicId: process.env.NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID || "",
```

---

### Шаг 5: Настроить Webhook (опционально, но рекомендуется)

CloudPayments будет отправлять уведомления о платежах. Нужно создать endpoint:

**Создать файл**: `app/api/cloudpayments/webhook/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Проверка подписи (важно для безопасности)
    // CloudPayments отправляет Content-HMAC заголовок
    
    // Обновление статуса пожертвования в БД
    const supabase = await createClient()
    
    // Логика обновления статуса платежа
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 })
  }
}
```

**Настроить webhook URL в CloudPayments:**
- URL: `https://your-domain.com/api/cloudpayments/webhook`
- Указать в настройках CloudPayments личного кабинета

---

## 📋 Чеклист подключения:

- [ ] Зарегистрироваться на CloudPayments
- [ ] Получить `publicId` и `API_SECRET`
- [ ] Добавить переменные в `.env.local`
- [ ] Добавить переменные в Vercel
- [ ] Раскомментировать реальный код в `lib/cloudpayments.ts`
- [ ] Обновить `publicId` в `components/cloudpayments-button.tsx`
- [ ] Удалить демо-режим
- [ ] Создать webhook endpoint (опционально)
- [ ] Протестировать на тестовом режиме CloudPayments

---

## ⚠️ Важно:

1. **Тестовый режим**: CloudPayments предоставляет тестовые ключи (`pk_test_...`) для проверки без реальных платежей
2. **Безопасность**: Никогда не коммитьте `API_SECRET` в Git
3. **Валидация**: Проверяйте подпись webhook'ов от CloudPayments
4. **Обработка ошибок**: Добавьте обработку всех возможных ошибок

---

## 🎯 Почему сейчас в демо-режиме?

1. **Разработка**: Можно тестировать UI без настройки реального аккаунта
2. **Безопасность**: Не нужно хранить реальные ключи во время разработки
3. **Гибкость**: Легко переключиться на реальный режим, когда готово

---

**Последнее обновление**: 2025-01-15

