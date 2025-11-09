$token = "90yDvxTtS7pSJxB6QhfYqp5X"
$projectId = "prj_VsqHkoeM952J8v5lmYfzFl4CaBPu"
$baseUrl = "https://api.vercel.com/v10/projects/$projectId/env"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$vars = @{
    "NEXT_PUBLIC_SUPABASE_URL" = "https://fvxkywczuqincnjilgzd.supabase.co"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2eGt5d2N6dXFpbmNuamlsZ3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNDgwNTYsImV4cCI6MjA3NzkyNDA1Nn0.jBvLDl0T2u-slvf4Uu4oZj7yRWMQCKmiln0mXRU0q54"
    "SUPABASE_SERVICE_ROLE_KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2eGt5d2N6dXFpbmNuamlsZ3pkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjM0ODA1NiwiZXhwIjoyMDc3OTI0MDU2fQ.S7NaVDbxey9V-3lxiTKYh2nsMOkQYK3Rc3TqsbYahOA"
    "API_AUTH_TOKEN" = "test_token_123"
    "TELEGRAM_BOT_TOKEN" = "8417046320:AAF6TExdeJiSq3xK0Cy2GhL8KVRrvZf7UWQ"
    "TELEGRAM_SECRET_TOKEN" = "1f2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f7081a9b0c1d2e3f40516"
    "NEXT_PUBLIC_TELEGRAM_BOT_USERNAME" = "MubarakWayBot"
    "BOT_API_BASE_URL" = "https://bot.e-replika.ru"
    "BOT_API_TOKEN" = "test_token_123"
}

foreach ($key in $vars.Keys) {
    $body = @{
        key = $key
        value = $vars[$key]
        type = "encrypted"
        target = @("production", "preview", "development")
    } | ConvertTo-Json -Depth 3
    
    try {
        Invoke-RestMethod -Uri $baseUrl -Method Post -Headers $headers -Body $body | Out-Null
        Write-Host "$key - OK" -ForegroundColor Green
    } catch {
        Write-Host "$key - Error or exists" -ForegroundColor Yellow
    }
}

