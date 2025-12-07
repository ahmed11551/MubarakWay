-- Add partner_enabled field to funds table
ALTER TABLE public.funds 
ADD COLUMN IF NOT EXISTS partner_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS country_code text,
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '[]'::jsonb;

-- Create index for partner_enabled
CREATE INDEX IF NOT EXISTS funds_partner_enabled_idx ON public.funds(partner_enabled) WHERE partner_enabled = true;

-- Create index for country_code
CREATE INDEX IF NOT EXISTS funds_country_code_idx ON public.funds(country_code);

-- Update existing funds to have partner_enabled = false by default
UPDATE public.funds SET partner_enabled = false WHERE partner_enabled IS NULL;

