# Настройка локализации (i18n)

## Установка

```bash
npm install next-intl
```

## Структура

- `i18n.ts` - конфигурация next-intl
- `messages/` - файлы переводов:
  - `ru.json` - русский (по умолчанию)
  - `en.json` - английский
  - `ar.json` - арабский (RTL)
- `lib/i18n-client.ts` - клиентские утилиты
- `components/language-switcher.tsx` - переключатель языков
- `components/rtl-wrapper.tsx` - обертка для RTL

## Использование

### В компонентах

```tsx
"use client"
import { useTranslations } from "next-intl"

export function MyComponent() {
  const t = useTranslations("donation")
  
  return <h1>{t("title")}</h1>
}
```

### Переключение языка

Компонент `LanguageSwitcher` автоматически обрабатывает переключение языков.

### RTL поддержка

RTL автоматически применяется для арабского языка через `RTLWrapper` компонент.

## Добавление новых переводов

1. Добавьте ключ в `messages/ru.json`
2. Добавьте перевод в `messages/en.json` и `messages/ar.json`
3. Используйте через `useTranslations()`

## Примечания

- Для полной интеграции потребуется реструктуризация `app/` в `app/[locale]/`
- Текущая реализация работает без изменения структуры роутинга
- RTL стили автоматически применяются через CSS

