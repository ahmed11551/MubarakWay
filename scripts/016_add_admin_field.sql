-- Add is_admin field to profiles table
-- This allows proper admin role management separate from subscription tiers

-- Add is_admin column (defaults to false for all existing users)
alter table public.profiles 
add column if not exists is_admin boolean default false not null;

-- Create index for faster admin checks
create index if not exists profiles_is_admin_idx on public.profiles(is_admin) where is_admin = true;

-- Add comment for documentation
comment on column public.profiles.is_admin is 'Indicates if user has admin privileges. Admins can approve/reject campaigns, view all donations, and manage funds.';

-- Optional: Set specific users as admins (replace with actual user IDs)
-- Example:
-- update public.profiles set is_admin = true where id = 'user-uuid-here';

