CREATE OR REPLACE FUNCTION public.prevent_checkin_after_attendance_approval()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  current_approval_status text;
BEGIN
  SELECT approval_status
    INTO current_approval_status
    FROM public.attendance_sessions
    WHERE id = NEW.session_id
    FOR UPDATE;

  IF current_approval_status = 'approved' THEN
    RAISE EXCEPTION 'Attendance session is approved; no further check-ins are allowed'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS attendance_records_reject_approved_session_checkin
  ON public.attendance_records;

CREATE TRIGGER attendance_records_reject_approved_session_checkin
  BEFORE INSERT ON public.attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_checkin_after_attendance_approval();
