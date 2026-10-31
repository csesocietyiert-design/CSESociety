CREATE TABLE IF NOT EXISTS public.circulars (
  id VARCHAR(32) PRIMARY KEY CHECK (id ~ '^[A-Fa-f0-9]{32}$'),
  title VARCHAR(150) NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL UNIQUE,
  uploaded_by UUID NOT NULL REFERENCES public.users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_circulars_uploaded_at
  ON public.circulars (uploaded_at DESC);

ALTER TABLE public.circulars ENABLE ROW LEVEL SECURITY;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'society-circulars',
  'society-circulars',
  FALSE,
  4194304,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET public = FALSE,
    file_size_limit = 4194304,
    allowed_mime_types = ARRAY['application/pdf'];
