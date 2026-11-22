CREATE UNIQUE INDEX IF NOT EXISTS idx_technical_workshop_feedback_event_society_id
  ON public.technical_workshop_feedback (event_key, UPPER(society_id));

NOTIFY pgrst, 'reload schema';
