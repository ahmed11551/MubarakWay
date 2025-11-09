# Автоматическая настройка переменных окружения в Vercel

$token = "90yDvxTtS7pSJxB6QhfYqp5X"
$projectId = "prj_VsqHkoeM952J8v5lmYfzFl4CaBPu"
$baseUrl = "https://api.vercel.com/v10/projects/$projectId/env"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$environments = @("production", "preview", "development")

Write-Host "Настройка переменных окружения в Vercel..." -ForegroundColor Cyan
Write-Host ""

# Supabase значения
$supabaseUrl = "https://fvxkywczuqincnjilgzd.supabase.co"
$supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2eGt5d2N6dXFpbmNuamlsZ3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNDgwNTYsImV4cCI6MjA3NzkyNDA1Nn0.jBvLDl0T2u-slvf4Uu4oZj7yRWMQCKmiln0mXRU0q54"
$supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2eGt5d2N6dXFpbmNuamlsZ3pkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjM0ODA1NiwiZXhwIjoyMDc3OTI0MDU2fQ.S7NaVDbxey9V-3lxiTKYh2nsMOkQYK3Rc3TqsbYahOA"

# Список переменных
$envVars = @(
    @{ key = "NEXT_PUBLIC_SUPABASE_URL"; value = $supabaseUrl },
    @{ key = "NEXT_PUBLIC_SUPABASE_ANON_KEY"; value = $supabaseAnonKey },
    @{ key = "SUPABASE_SERVICE_ROLE_KEY"; value = $supabaseServiceKey },
    @{ key = "API_AUTH_TOKEN"; value = "test_token_123" },
    @{ key = "TELEGRAM_BOT_TOKEN"; value = "8417046320:AAF6TExdeJiSq3xK0Cy2GhL8KVRrvZf7UWQ" },
    @{ key = "TELEGRAM_SECRET_TOKEN"; value = "1f2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f7081a9b0c1d2e3f40516" },
    @{ key = "NEXT_PUBLIC_TELEGRAM_BOT_USERNAME"; value = "MubarakWayBot" },
    @{ key = "BOT_API_BASE_URL"; value = "https://bot.e-replika.ru" },
    @{ key = "BOT_API_TOKEN"; value = "test_token_123" }
)

foreach ($envVar in $envVars) {
    Write-Host "Добавление $($envVar.key)..." -ForegroundColor Yellow
    
    $body = @{
        key = $envVar.key
        value = $envVar.value
        type = "encrypted"
        target = $environments
    } | ConvertTo-Json -Depth 3
    
    try {
        $result = Invoke-RestMethod -Uri $baseUrl -Method Post -Headers $headers -Body $body
        Write-Host "  OK $($envVar.key) добавлен" -ForegroundColor Green
    } catch {
        if ($_.Exception.Response.StatusCode -eq 409) {
            Write-Host "  WARN $($envVar.key) уже существует" -ForegroundColor Yellow
        } else {
            Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "Готово! Переменные окружения настроены." -ForegroundColor Green
