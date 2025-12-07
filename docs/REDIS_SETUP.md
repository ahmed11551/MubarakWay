# Настройка Redis для Rate Limiting и Кеширования

## Обзор

Проект использует Redis для:
- **Rate Limiting** - защита от злоупотреблений API
- **Кеширование** - улучшение производительности

Поддерживаются два варианта:
1. **Upstash Redis** (рекомендуется) - serverless Redis, работает на Vercel/Edge
2. **Стандартный Redis** - собственный сервер Redis

## Вариант 1: Upstash Redis (Рекомендуется)

### Преимущества
- Serverless - не нужно управлять сервером
- Работает на Vercel Edge Functions
- Бесплатный tier доступен
- Автоматическое масштабирование

### Настройка

1. **Создайте аккаунт на Upstash:**
   - Перейдите на https://console.upstash.com
   - Зарегистрируйтесь или войдите

2. **Создайте Redis базу данных:**
   - Нажмите "Create Database"
   - Выберите регион (ближайший к вашему приложению)
   - Выберите тип: "Regional" (для production) или "Global" (для edge)
   - Нажмите "Create"

3. **Получите credentials:**
   - После создания базы данных откройте её
   - Скопируйте `UPSTASH_REDIS_REST_URL`
   - Скопируйте `UPSTASH_REDIS_REST_TOKEN`

4. **Добавьте в `.env.local`:**
   ```env
   UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=xxx
   ```

### Бесплатный tier
- 10,000 команд в день
- Достаточно для большинства приложений
- Можно обновить при необходимости

---

## Вариант 2: Стандартный Redis

### Установка (локально)

**Docker:**
```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

**Или через Homebrew (macOS):**
```bash
brew install redis
brew services start redis
```

### Настройка

1. **Добавьте в `.env.local`:**
   ```env
   REDIS_URL=redis://localhost:6379
   ```

2. **Для production:**
   - Используйте управляемый Redis (AWS ElastiCache, Google Cloud Memorystore, etc.)
   - Или собственный сервер Redis

### Ограничения
- Не работает на Vercel Edge Functions
- Требует управления сервером
- Для кластера нужна дополнительная настройка

---

## Fallback (Без Redis)

Если Redis не настроен, приложение автоматически использует:
- **Rate Limiting:** In-memory хранилище (работает только на одном инстансе)
- **Кеширование:** Next.js встроенное кеширование

**Важно:** Для production с несколькими инстансами обязательно используйте Redis!

---

## Проверка работы

### Проверка Rate Limiting

1. Запустите приложение
2. Сделайте несколько запросов к API:
   ```bash
   curl http://localhost:3000/api/campaigns
   ```

3. Проверьте заголовки ответа:
   ```
   X-RateLimit-Limit: 100
   X-RateLimit-Remaining: 99
   X-RateLimit-Reset: 1234567890
   ```

4. При превышении лимита получите 429:
   ```json
   {
     "error": "Too many requests",
     "message": "Rate limit exceeded. Maximum 100 requests per minute.",
     "retryAfter": 45
   }
   ```

### Проверка Кеширования

1. Сделайте запрос к `/api/campaigns`
2. Проверьте логи (в development режиме):
   ```
   [Cache] Cache Operation {"operation":"set","key":"cache:campaigns:all"}
   ```

3. Повторный запрос должен быть быстрее (из кеша)

---

## Мониторинг

### Upstash Dashboard
- Перейдите в Upstash Console
- Откройте вашу базу данных
- Просмотрите метрики:
  - Количество команд
  - Использование памяти
  - Latency

### Логи приложения
В development режиме логируются все операции:
- Rate limit checks
- Cache hits/misses
- Redis errors

---

## Troubleshooting

### Redis не подключается

1. **Проверьте переменные окружения:**
   ```bash
   echo $UPSTASH_REDIS_REST_URL
   echo $UPSTASH_REDIS_REST_TOKEN
   ```

2. **Проверьте логи:**
   - В development режиме будут предупреждения
   - Приложение автоматически переключится на fallback

3. **Проверьте сеть:**
   - Upstash доступен из интернета
   - Проверьте firewall настройки

### Rate limiting не работает

1. Убедитесь, что Redis настроен
2. Проверьте логи на наличие ошибок
3. Проверьте, что используется `rateLimitRequest` из `rate-limit-redis.ts`

### Кеширование не работает

1. Проверьте, что Redis доступен
2. Проверьте TTL (время жизни кеша)
3. Проверьте логи на cache operations

---

## Production рекомендации

1. **Используйте Upstash** для простоты и надежности
2. **Настройте мониторинг** через Upstash Dashboard
3. **Установите алерты** при превышении лимитов
4. **Регулярно проверяйте** использование Redis
5. **Настройте backup** (если используете стандартный Redis)

---

## Стоимость

### Upstash
- **Free tier:** 10,000 команд/день (достаточно для начала)
- **Pay as you go:** $0.20 за 100,000 команд
- Очень экономично для большинства приложений

### Стандартный Redis
- Зависит от провайдера
- Обычно $10-50/месяц за managed Redis
- Или бесплатно, если свой сервер

---

## Дополнительная информация

- [Upstash Documentation](https://docs.upstash.com/redis)
- [@upstash/ratelimit Documentation](https://github.com/upstash/ratelimit)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)

