# Скрипт для настройки переменных окружения в Vercel (PowerShell)
# Использование: .\scripts\setup-vercel-env.ps1

Write-Host "🚀 Настройка переменных окружения для Vercel" -ForegroundColor Green
Write-Host ""

# Проверка установки Vercel CLI
$vercelPath = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelPath) {
    Write-Host "❌ Vercel CLI не найден. Установите: npm install -g vercel" -ForegroundColor Red
    exit 1
}

# Проверка авторизации
try {
    $whoami = vercel whoami 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Not authenticated"
    }
    Write-Host "✅ Авторизован как: $whoami" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Не авторизован в Vercel. Запустите: vercel login" -ForegroundColor Red
    exit 1
}

Write-Host "📝 Введите значения переменных окружения:" -ForegroundColor Yellow
Write-Host ""

# Запрашиваем обязательные переменные
$supabaseUrl = Read-Host "NEXT_PUBLIC_SUPABASE_URL (Supabase Project URL)"
$supabaseAnonKey = Read-Host "NEXT_PUBLIC_SUPABASE_ANON_KEY (Supabase anon public key)"
$supabaseServiceKey = Read-Host "SUPABASE_SERVICE_ROLE_KEY (Supabase service_role key)"

$siteUrl = Read-Host "NEXT_PUBLIC_SITE_URL [https://mubarak-way.vercel.app]"
if ([string]::IsNullOrWhiteSpace($siteUrl)) {
    $siteUrl = "https://mubarak-way.vercel.app"
}

$baseUrl = Read-Host "NEXT_PUBLIC_BASE_URL [https://mubarak-way.vercel.app]"
if ([string]::IsNullOrWhiteSpace($baseUrl)) {
    $baseUrl = "https://mubarak-way.vercel.app"
}

Write-Host ""
Write-Host "🔧 Добавление переменных в Vercel..." -ForegroundColor Yellow
Write-Host ""

$environments = @("production", "preview", "development")
$vars = @{
    "NEXT_PUBLIC_SUPABASE_URL" = $supabaseUrl
    "NEXT_PUBLIC_SUPABASE_ANON_KEY" = $supabaseAnonKey
    "SUPABASE_SERVICE_ROLE_KEY" = $supabaseServiceKey
    "NEXT_PUBLIC_SITE_URL" = $siteUrl
    "NEXT_PUBLIC_BASE_URL" = $baseUrl
}

foreach ($env in $environments) {
    Write-Host "  Настройка для $env..." -ForegroundColor Cyan
    foreach ($key in $vars.Keys) {
        $value = $vars[$key]
        try {
            # Пытаемся удалить существующую переменную (если есть)
            vercel env rm $key $env --yes 2>$null | Out-Null
            # Добавляем новую переменную
            $value | vercel env add $key $env 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "    ✅ $key" -ForegroundColor Green
            } else {
                Write-Host "    ❌ Ошибка при добавлении $key" -ForegroundColor Red
            }
        } catch {
            Write-Host "    ❌ Ошибка: $_" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "✨ Готово! Переменные окружения настроены." -ForegroundColor Green
Write-Host "🔄 Vercel автоматически пересоберет проект." -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Совет: Проверьте настройки в Vercel Dashboard:" -ForegroundColor Cyan
Write-Host "   https://vercel.com/dashboard" -ForegroundColor Cyan

