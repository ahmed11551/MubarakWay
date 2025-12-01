-- Create/Update the Insan fund ONLY
-- Use this if Step 1 from cleanup script didn't work

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
  'صندوق إنسان الخيري - الشريك الرئيسي لمنصة MubarakWay. يعمل الصندوق في مختلف مجالات الخير: مساعدة الأيتام، التعليم، الرعاية الصحية، المساعدة الطارئة، إمدادات المياه وغيرها من البرامج الاجتماعية المهمе.',
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
  is_active = true, -- Force active
  website_url = EXCLUDED.website_url,
  contact_email = EXCLUDED.contact_email,
  updated_at = NOW();

-- Verify it was created
SELECT id, name, is_active, category 
FROM public.funds 
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

