# Миграция на полную поддержку i18n

## Текущий статус

i18n настроен частично:
- ✅ Файлы переводов созданы (`messages/ru.json`, `messages/en.json`, `messages/ar.json`)
- ✅ Компоненты для переключения языков готовы
- ✅ RTL-поддержка добавлена
- ⚠️ Middleware упрощен для стабильного деплоя

## Почему упрощено?

Next.js 16 App Router с next-intl требует структуру `app/[locale]/` для полной поддержки роутинга. Это большая реструктуризация, которая может сломать деплой.

## Что работает сейчас

- Компоненты готовы к использованию переводов
- Файлы переводов созданы
- RTL-стили добавлены
- Можно использовать `useTranslations()` в компонентах (с fallback)

## Полная миграция (когда будете готовы)

1. **Реструктуризация app/**:
   ```
   app/
     [locale]/
       page.tsx
       layout.tsx
       ...
   ```

2. **Обновление middleware.ts**:
   ```typescript
   import createMiddleware from "next-intl/middleware"
   export default createMiddleware({...})
   ```

3. **Обновление next.config.mjs**:
   ```javascript
   export default withNextIntl(nextConfig)
   ```

## Временное решение

Пока используйте клиентские компоненты с `useTranslations()` из `lib/i18n-client.ts`. Это работает без реструктуризации.

