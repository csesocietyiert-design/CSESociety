ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS created_by UUID
  REFERENCES public.users(id)
  ON DELETE CASCADE;

NOTIFY pgrst, 'reload schema';
