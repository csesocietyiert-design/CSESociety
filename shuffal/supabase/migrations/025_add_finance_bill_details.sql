-- Add supporting details and Google Drive bill links to society fund cards.
alter table public.finance_entries
  add column if not exists details text,
  add column if not exists bill_link text;
