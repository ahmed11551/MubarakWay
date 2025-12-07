-- Create partner_applications table for partnership requests
CREATE TABLE IF NOT EXISTS public.partner_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name text NOT NULL,
  country_code text NOT NULL,
  categories text[] DEFAULT '{}',
  website text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  telegram_username text,
  about text,
  status text DEFAULT 'received' CHECK (status IN ('received', 'in_review', 'approved', 'rejected')),
  reviewer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  comment text,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can create applications
CREATE POLICY "partner_applications_insert_all"
  ON public.partner_applications FOR INSERT
  WITH CHECK (true);

-- Only admins can view applications
CREATE POLICY "partner_applications_select_admin"
  ON public.partner_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Only admins can update applications
CREATE POLICY "partner_applications_update_admin"
  ON public.partner_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS partner_applications_status_idx ON public.partner_applications(status);
CREATE INDEX IF NOT EXISTS partner_applications_country_code_idx ON public.partner_applications(country_code);
CREATE INDEX IF NOT EXISTS partner_applications_created_at_idx ON public.partner_applications(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER partner_applications_updated_at
  BEFORE UPDATE ON public.partner_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

