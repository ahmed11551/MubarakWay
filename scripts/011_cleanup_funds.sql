-- Cleanup funds: Deactivate all funds except "Инсан"
-- This script ensures only the main "Инсан" fund is active

-- First, ensure the Insan fund exists
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
  is_active = true, -- Ensure Insan fund is active
  website_url = EXCLUDED.website_url,
  contact_email = EXCLUDED.contact_email,
  updated_at = NOW();

-- Deactivate all other funds (soft delete - set is_active = false)
-- This preserves data but hides them from the UI
UPDATE public.funds
SET is_active = false,
    updated_at = NOW()
WHERE id != '00000000-0000-0000-0000-000000000001'::uuid
  AND is_active = true;

-- Optional: If you want to completely delete other funds (uncomment if needed)
-- WARNING: This will permanently delete all funds except Insan
-- Make sure to update any donations/campaigns that reference these funds first!
-- DELETE FROM public.funds
-- WHERE id != '00000000-0000-0000-0000-000000000001'::uuid;

-- Verify: Should return only 1 fund (Insan)
-- SELECT id, name, is_active FROM public.funds WHERE is_active = true;

