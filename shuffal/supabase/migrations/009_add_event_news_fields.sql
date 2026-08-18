ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS caption TEXT,
  ADD COLUMN IF NOT EXISTS authority_letter_url TEXT;