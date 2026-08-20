-- Automatically record announcement changes in the admin Recent Activities feed.

CREATE OR REPLACE FUNCTION public.log_announcement_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.activity_logs (user_id, action, description, entity_type, entity_id)
  VALUES (
    COALESCE(NEW.created_by, OLD.created_by),
    CASE TG_OP
      WHEN 'INSERT' THEN 'Announcement Created'
      WHEN 'UPDATE' THEN 'Announcement Updated'
      ELSE 'Announcement Removed'
    END,
    CASE TG_OP
      WHEN 'INSERT' THEN COALESCE('Announcement created: ' || NEW.title, 'A new announcement was created')
      WHEN 'UPDATE' THEN COALESCE('Announcement updated: ' || NEW.title, 'An announcement was updated')
      ELSE COALESCE('Announcement removed: ' || OLD.title, 'An announcement was removed')
    END,
    'announcement',
    COALESCE(NEW.id, OLD.id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS announcements_activity_log_trigger ON public.announcements;
CREATE TRIGGER announcements_activity_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.log_announcement_activity();
