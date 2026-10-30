ALTER TABLE public.registration_forms
  ADD COLUMN IF NOT EXISTS document_url TEXT;

NOTIFY pgrst, 'reload schema';
