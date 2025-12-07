-- Create zakat_calculations table for storing zakat calculations
CREATE TABLE IF NOT EXISTS public.zakat_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  payload_json jsonb NOT NULL,
  zakat_due numeric(10, 2) NOT NULL,
  above_nisab boolean NOT NULL DEFAULT false,
  nisab_value numeric(10, 2),
  nisab_currency text DEFAULT 'RUB',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.zakat_calculations ENABLE ROW LEVEL SECURITY;

-- Users can view their own calculations
CREATE POLICY "zakat_calculations_select_own"
  ON public.zakat_calculations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own calculations
CREATE POLICY "zakat_calculations_insert_own"
  ON public.zakat_calculations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS zakat_calculations_user_id_idx ON public.zakat_calculations(user_id);
CREATE INDEX IF NOT EXISTS zakat_calculations_created_at_idx ON public.zakat_calculations(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER zakat_calculations_updated_at
  BEFORE UPDATE ON public.zakat_calculations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

