-- Create reports table for donation receipts and reports
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  report_type text not null check (report_type in ('receipt', 'monthly', 'yearly', 'tax')),
  period_start timestamptz,
  period_end timestamptz,
  total_amount numeric(10, 2) not null,
  donation_count integer not null,
  file_url text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.reports enable row level security;

-- Users can view their own reports
create policy "reports_select_own"
  on public.reports for select
  using (auth.uid() = user_id);

-- Users can insert their own reports
create policy "reports_insert_own"
  on public.reports for insert
  with check (auth.uid() = user_id);

create index if not exists reports_user_id_idx on public.reports(user_id);
create index if not exists reports_created_at_idx on public.reports(created_at desc);
