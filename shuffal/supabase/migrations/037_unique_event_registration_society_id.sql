CREATE UNIQUE INDEX IF NOT EXISTS idx_esports_event_registrations_society_event
  ON public.esports_event_registrations (event_key, UPPER(society_id))
  WHERE society_id IS NOT NULL;
