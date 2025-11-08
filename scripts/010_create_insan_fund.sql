-- Create the main fund "Инсан" (Insan)
-- This is the primary fund that all campaigns and programs should be linked to

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
  '00000000-0000-0000-0000-000000000001'::uuid, -- Fixed UUID for Insan fund
  'Фонд Инсан',
  'صندوق إنسان',
  'Благотворительный фонд "Инсан" - основной партнер платформы MubarakWay. Фонд занимается различными направлениями благотворительности: помощь сиротам, образование, здравоохранение, экстренная помощь, водоснабжение и другие важные социальные программы.',
  'صندوق إنسان الخيري - الشريك الرئيسي لمنصة MubarakWay. يعمل الصندوق في مختلف مجالات الخير: مساعدة الأيتام، التعليم، الرعاية الصحية، المساعدة الطارئة، إمدادات المياه وغيرها من البرامج الاجتماعية المهمة.',
  'https://fondinsan.ru/uploads/cache/Programs/Program47/1bc0623de3-2_400x400.png', -- Default logo, can be updated
  'general',
  true, -- Verified
  true, -- Active
  0, -- Initial total raised
  0, -- Initial donor count
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
  is_active = EXCLUDED.is_active,
  website_url = EXCLUDED.website_url,
  contact_email = EXCLUDED.contact_email,
  updated_at = NOW();

-- Add fund_id column to campaigns if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'campaigns' 
    AND column_name = 'fund_id'
  ) THEN
    ALTER TABLE public.campaigns 
    ADD COLUMN fund_id uuid REFERENCES public.funds(id) ON DELETE SET NULL;
    
    -- Create index for performance
    CREATE INDEX IF NOT EXISTS campaigns_fund_id_idx ON public.campaigns(fund_id);
  END IF;
END $$;

-- Set default fund_id for existing campaigns (optional - can be NULL)
-- UPDATE public.campaigns 
-- SET fund_id = '00000000-0000-0000-0000-000000000001'::uuid
-- WHERE fund_id IS NULL;

