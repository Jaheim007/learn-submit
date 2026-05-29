CREATE OR REPLACE FUNCTION public.notify_student_submission_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_user_id uuid;
  project_title text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT s.user_id INTO student_user_id FROM public.students s WHERE s.id = NEW.student_id;
    SELECT p.title INTO project_title FROM public.projects p WHERE p.id = NEW.project_id;

    IF student_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, type, metadata)
      VALUES (
        student_user_id,
        'Mise à jour de soumission',
        'Votre soumission pour "' || COALESCE(project_title, 'Projet') || '" a été mise à jour: ' || NEW.status,
        'submission_status_updated',
        jsonb_build_object('submission_id', NEW.id, 'project_id', NEW.project_id, 'new_status', NEW.status)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;