# 🔧 Исправление переменных окружения в Vercel

## Проблема

Ошибка: **"Missing Supabase environment variables"**

Это означает, что переменные окружения не установлены в Vercel или не доступны в production окружении.

## Решение

### Вариант 1: Автоматическая установка (рекомендуется)

Запустите скрипт проверки и установки:

```powershell
powershell -ExecutionPolicy Bypass -File check-vercel-env.ps1
```

Скрипт:
- Проверит текущие переменные
- Установит отсутствующие
- Убедится, что они доступны в production

### Вариант 2: Ручная установка через Vercel Dashboard

1. Перейдите: https://vercel.com/ahmed11551s-projects/mubarak-way/settings/environment-variables
2. Добавьте следующие переменные для **production, preview, development**:

```
NEXT_PUBLIC_SUPABASE_URL=https://fvxkywczuqincnjilgzd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2eGt5d2N6dXFpbmNuamlsZ3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNDgwNTYsImV4cCI6MjA3NzkyNDA1Nn0.jBvLDl0T2u-slvf4Uu4oZj7yRWMQCKmiln0mXRU0q54
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2eGt5d2N6dXFpbmNuamlsZ3pkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjM0ODA1NiwiZXhwIjoyMDc3OTI0MDU2fQ.S7NaVDbxey9V-3lxiTKYh2nsMOkQYK3Rc3TqsbYahOA
```

3. После добавления **обязательно передеплойте проект**:
   - Перейдите в Deployments
   - Нажмите "Redeploy" на последнем деплое

### Вариант 3: Через Vercel CLI

```powershell
# Установите Vercel CLI если еще не установлен
npm i -g vercel

# Войдите в аккаунт
vercel login

# Добавьте переменные
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Введите: https://fvxkywczuqincnjilgzd.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Введите: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2eGt5d2N6dXFpbmNuamlsZ3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNDgwNTYsImV4cCI6MjA3NzkyNDA1Nn0.jBvLDl0T2u-slvf4Uu4oZj7yRWMQCKmiln0mXRU0q54

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Введите: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2eGt5d2N6dXFpbmNuamlsZ3pkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjM0ODA1NiwiZXhwIjoyMDc3OTI0MDU2fQ.S7NaVDbxey9V-3lxiTKYh2nsMOkQYK3Rc3TqsbYahOA
```

## После установки

1. **Передеплойте проект** в Vercel:
   - Перейдите в Deployments
   - Нажмите "Redeploy" на последнем деплое
   - Или сделайте новый push в GitHub

2. **Проверьте логи** после деплоя:
   - Перейдите в последний деплой
   - Откройте "Runtime Logs"
   - Убедитесь, что нет ошибок с переменными окружения

3. **Проверьте работу**:
   - Откройте https://mubarak-way.vercel.app/funds
   - Откройте https://mubarak-way.vercel.app/rating
   - Оба раздела должны работать без ошибок

## Проверка

После установки переменных, проверьте что они доступны:

```powershell
# Через API
$headers = @{
    "Authorization" = "Bearer 90yDvxTtS7pSJxB6QhfYqp5X"
}
$response = Invoke-RestMethod -Uri "https://api.vercel.com/v10/projects/prj_VsqHkoeM952J8v5lmYfzFl4CaBPu/env" -Headers $headers
$response.envs | Where-Object { $_.key -like "*SUPABASE*" } | Format-Table key, target
```

## Важно

- Переменные должны быть установлены для **production, preview, development**
- После изменения переменных **обязательно передеплойте проект**
- `NEXT_PUBLIC_*` переменные доступны на клиенте и сервере
- `SUPABASE_SERVICE_ROLE_KEY` используется только на сервере

