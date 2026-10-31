ALTER TABLE public.circulars
  ADD COLUMN IF NOT EXISTS circular_date DATE,
  ADD COLUMN IF NOT EXISTS category VARCHAR(80);

UPDATE public.circulars
SET circular_date = COALESCE(circular_date, uploaded_at::date),
    category = COALESCE(category, 'General');

ALTER TABLE public.circulars
  ALTER COLUMN circular_date SET DEFAULT CURRENT_DATE,
  ALTER COLUMN circular_date SET NOT NULL,
  ALTER COLUMN category SET DEFAULT 'General',
  ALTER COLUMN category SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_circulars_date
  ON public.circulars (circular_date DESC);
