#!/bin/bash

# Быстрая настройка переменных окружения для Vercel
# Использование: ./scripts/setup-vercel-env-quick.sh

echo "🚀 Настройка переменных окружения для Vercel"
echo ""

# Проверка авторизации
if ! vercel whoami &>/dev/null; then
    echo "❌ Не авторизован в Vercel. Запустите: vercel login"
    exit 1
fi

echo "✅ Авторизован в Vercel"
echo ""
echo "📝 Введите значения переменных окружения:"
echo ""

# Запрашиваем обязательные переменные
read -p "NEXT_PUBLIC_SUPABASE_URL: " SUPABASE_URL
read -p "NEXT_PUBLIC_SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
read -p "SUPABASE_SERVICE_ROLE_KEY: " SUPABASE_SERVICE_ROLE_KEY

read -p "NEXT_PUBLIC_SITE_URL [https://mubarak-way.vercel.app]: " SITE_URL
SITE_URL=${SITE_URL:-https://mubarak-way.vercel.app}

read -p "NEXT_PUBLIC_BASE_URL [https://mubarak-way.vercel.app]: " BASE_URL
BASE_URL=${BASE_URL:-https://mubarak-way.vercel.app}

echo ""
echo "🔧 Добавление переменных..."

# Функция для добавления переменной
add_env_var() {
    local key=$1
    local value=$2
    local env=$3
    
    echo "$value" | vercel env add "$key" "$env" 2>/dev/null || {
        vercel env rm "$key" "$env" --yes 2>/dev/null
        echo "$value" | vercel env add "$key" "$env"
    }
}

# Добавляем переменные для всех окружений
for env in production preview development; do
    echo "  Настройка для $env..."
    add_env_var "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL" "$env"
    add_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY" "$env"
    add_env_var "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY" "$env"
    add_env_var "NEXT_PUBLIC_SITE_URL" "$SITE_URL" "$env"
    add_env_var "NEXT_PUBLIC_BASE_URL" "$BASE_URL" "$env"
done

echo ""
echo "✨ Готово! Переменные окружения настроены."
echo "🔄 Vercel автоматически пересоберет проект."

