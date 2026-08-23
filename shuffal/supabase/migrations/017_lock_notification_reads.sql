-- Notification reads and writes are served by the authenticated server API.
REVOKE ALL ON public.notifications FROM anon, authenticated;
DROP POLICY IF EXISTS notifications_read_for_dashboard ON public.notifications;
