# ⚡ Быстрое исправление: Создание фонда Инсан

## Проблема

После выполнения скрипта очистки проверочный запрос показывает "No rows returned" - нет активных фондов.

## Решение

### Вариант 1: Выполнить весь скрипт целиком

В Supabase SQL Editor выполните **весь** скрипт `scripts/011_cleanup_funds.sql` (не только проверочный SELECT).

Скрипт делает 3 вещи:
1. **INSERT** - создает/обновляет фонд "Инсан" (делает его активным)
2. **UPDATE** - деактивирует все остальные фонды
3. **SELECT** - проверяет результат

### Вариант 2: Только создать фонд Инсан

Если нужно только создать фонд (без очистки), выполните:

```sql
-- Create/Update the Insan fund
INSERT INTO public.funds (
  id,
  name,
  name_ar,
  description,
  description_ar,
  logo_url,
  category,
  is_verified,
  is_active,
  total_raised,
  donor_count,
  website_url,
  contact_email,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Фонд Инсан',
  'صندوق إنسان',
  'Благотворительный фонд "Инсан" - основной партнер платформы MubarakWay. Фонд занимается различными направлениями благотворительности: помощь сиротам, образование, здравоохранение, экстренная помощь, водоснабжение и другие важные социальные программы.',
  'صندوق إنسان الخيري - الشريك الرئيسي لمنصة MubarakWay. يعمل الصندوق في مختلف مجالات الخير: مساعدة الأيتام، التعليم، الرعاية الصحية، المساعدة الطارئة، إمدادات المياه وغيرها من البرامج الاجتماعية المهمة.',
  'https://fondinsan.ru/uploads/cache/Programs/Program47/1bc0623de3-2_400x400.png',
  'general',
  true,
  true,
  0,
  0,
  'https://fondinsan.ru',
  'info@fondinsan.ru',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_ar = EXCLUDED.name_ar,
  description = EXCLUDED.description,
  description_ar = EXCLUDED.description_ar,
  logo_url = EXCLUDED.logo_url,
  category = EXCLUDED.category,
  is_verified = EXCLUDED.is_verified,
  is_active = true,
  website_url = EXCLUDED.website_url,
  contact_email = EXCLUDED.contact_email,
  updated_at = NOW();
```

### Проверка

После выполнения проверьте:

```sql
SELECT id, name, is_active, category 
FROM public.funds 
WHERE is_active = true;
```

**Ожидаемый результат:** Должна вернуться одна строка с фондом "Фонд Инсан" и `is_active = true`.

## Что дальше?

1. ✅ Фонд "Инсан" создан и активен
2. ✅ Все остальные фонды деактивированы
3. ✅ На странице `/funds` будет отображаться только фонд "Инсан"
4. ✅ Можно создавать кампании и привязывать их к фонду Инсан

## Если все еще не работает

Проверьте:
1. **RLS политики** - убедитесь, что политика `funds_select_all` позволяет читать активные фонды
2. **Права доступа** - убедитесь, что у пользователя есть права на чтение таблицы `funds`
3. **Логи ошибок** - проверьте, нет ли ошибок в консоли Supabase

