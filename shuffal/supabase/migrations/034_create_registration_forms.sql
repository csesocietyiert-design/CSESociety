CREATE TABLE IF NOT EXISTS public.registration_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(150) NOT NULL,
  end_date DATE NOT NULL,
  resource_url TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registration_forms_created_at
  ON public.registration_forms (created_at DESC);

NOTIFY pgrst, 'reload schema';
