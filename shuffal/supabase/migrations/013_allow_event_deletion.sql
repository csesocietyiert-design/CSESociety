-- Keep certificates when their event is removed, while allowing the event delete.
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT con.conname
  INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class child_table ON child_table.oid = con.conrelid
  JOIN pg_class parent_table ON parent_table.oid = con.confrelid
  JOIN pg_namespace schema_name ON schema_name.oid = child_table.relnamespace
  WHERE schema_name.nspname = 'public'
    AND child_table.relname = 'certificates'
    AND parent_table.relname = 'events'
    AND con.contype = 'f'
  LIMIT 1;

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.certificates DROP CONSTRAINT %I', constraint_name);
    ALTER TABLE public.certificates
      ADD CONSTRAINT certificates_event_id_fkey
      FOREIGN KEY (event_id)
      REFERENCES public.events(id)
      ON DELETE SET NULL;
  END IF;
END $$;
