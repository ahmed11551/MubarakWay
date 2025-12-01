-- Create funds table for partner organizations
create table if not exists public.funds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_ar text,
  description text,
  description_ar text,
  logo_url text,
  category text not null check (category in ('education', 'healthcare', 'poverty', 'orphans', 'water', 'emergency', 'general')),
  is_verified boolean default false,
  is_active boolean default true,
  total_raised numeric(10, 2) default 0,
  donor_count integer default 0,
  website_url text,
  contact_email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS - funds are public for reading
alter table public.funds enable row level security;

-- Anyone can view active funds
create policy "funds_select_all"
  on public.funds for select
  using (is_active = true);

-- Only admins can insert/update/delete (we'll add admin role later)
create policy "funds_admin_all"
  on public.funds for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.subscription_tier = 'sahib_al_waqf_premium'
    )
  );

create trigger funds_updated_at
  before update on public.funds
  for each row
  execute function public.handle_updated_at();
