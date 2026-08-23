-- Keep existing event rows while repairing a manually-created creator constraint.
ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS fk_events_creator;

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_created_by_fkey;

UPDATE public.events AS events
SET created_by = NULL
WHERE created_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.users AS users
    WHERE users.id = events.created_by
  );

ALTER TABLE public.events
  ADD CONSTRAINT fk_events_creator
  FOREIGN KEY (created_by)
  REFERENCES public.users(id)
  ON DELETE SET NULL;
