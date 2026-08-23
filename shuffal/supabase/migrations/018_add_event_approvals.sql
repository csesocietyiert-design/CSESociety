ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

UPDATE public.events
SET approval_status = 'approved'
WHERE approval_status IS NULL;

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_approval_status_check;

ALTER TABLE public.events
  ADD CONSTRAINT events_approval_status_check
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_events_approval_status ON public.events(approval_status);
