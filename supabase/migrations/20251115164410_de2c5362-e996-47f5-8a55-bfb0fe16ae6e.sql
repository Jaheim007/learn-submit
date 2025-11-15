-- Expand allowed notification types to support new automated events
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
ADD CONSTRAINT notifications_type_check CHECK (
  type = ANY (ARRAY[
    'submission_created'::text,
    'status_changed'::text,
    'grade_assigned'::text,
    'feedback_added'::text,
    -- New event types used by triggers/functions
    'project_created'::text,
    'course_material_added'::text,
    'submission_status_updated'::text
  ])
);

-- Ensure trigger exists to send push notifications on insert (idempotent)
DROP TRIGGER IF EXISTS on_notification_created ON public.notifications;
CREATE TRIGGER on_notification_created
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_push_notification();