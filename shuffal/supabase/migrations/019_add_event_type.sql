ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS event_type VARCHAR(20) NOT NULL DEFAULT 'general';

UPDATE public.events
SET event_type = 'general'
WHERE event_type IS NULL;

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_event_type_check;

ALTER TABLE public.events
  ADD CONSTRAINT events_event_type_check
  CHECK (event_type IN ('general', 'cultural', 'technical'));

CREATE INDEX IF NOT EXISTS idx_events_event_type ON public.events(event_type);
