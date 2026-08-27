-- Shared society fund ledger for the treasurer and core team.
create table if not exists public.finance_entries (
  id uuid default gen_random_uuid() primary key,
  entry_type text not null check (entry_type in ('income', 'expense')),
  title text not null,
  amount numeric(12, 2) not null check (amount > 0),
  event_name text,
  entry_date date not null default current_date,
  description text,
  created_by uuid references public.users(id) on delete restrict not null,
  approval_status text not null default 'pending' check (approval_status in ('pending', 'approved')),
  approved_by uuid references public.users(id) on delete restrict,
  approved_at timestamptz,
  created_at timestamptz default now() not null
);

alter table public.finance_entries enable row level security;

create index if not exists finance_entries_entry_date_idx
  on public.finance_entries (entry_date desc, created_at desc);

create index if not exists finance_entries_event_name_idx
  on public.finance_entries (event_name);
