-- Create donations table for all donation records
create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid references public.profiles(id) on delete set null,
  fund_id uuid references public.funds(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  amount numeric(10, 2) not null,
  currency text default 'USD' check (currency in ('USD', 'EUR', 'SAR', 'AED')),
  donation_type text not null check (donation_type in ('one_time', 'recurring', 'zakat', 'sadaqah')),
  recurring_frequency text check (recurring_frequency in ('daily', 'weekly', 'monthly', 'yearly')),
  is_anonymous boolean default false,
  message text,
  status text default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
  payment_method text,
  transaction_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.donations enable row level security;

-- Users can view their own donations
create policy "donations_select_own"
  on public.donations for select
  using (auth.uid() = donor_id);

-- Campaign creators can view donations to their campaigns
create policy "donations_select_campaign_creator"
  on public.donations for select
  using (
    exists (
      select 1 from public.campaigns
      where campaigns.id = donations.campaign_id
      and campaigns.creator_id = auth.uid()
    )
  );

-- Users can insert their own donations
create policy "donations_insert_own"
  on public.donations for insert
  with check (auth.uid() = donor_id);

-- Create indexes for performance
create index if not exists donations_donor_id_idx on public.donations(donor_id);
create index if not exists donations_fund_id_idx on public.donations(fund_id);
create index if not exists donations_campaign_id_idx on public.donations(campaign_id);
create index if not exists donations_created_at_idx on public.donations(created_at desc);

create trigger donations_updated_at
  before update on public.donations
  for each row
  execute function public.handle_updated_at();
