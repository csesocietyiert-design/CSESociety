alter table public.conversations
  add column if not exists member_deleted_at timestamptz,
  add column if not exists admin_deleted_at timestamptz;

notify pgrst, 'reload schema';
