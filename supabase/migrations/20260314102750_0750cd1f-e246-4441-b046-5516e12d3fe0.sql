
-- Fix SECURITY DEFINER functions missing search_path protection
-- This prevents SQL injection via schema manipulation

CREATE OR REPLACE FUNCTION public.sync_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.user_roles
    WHERE user_id = OLD.user_id AND role = 'admin';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_supervisor_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.supervisor_user_id, 'supervisor')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.user_roles
    WHERE user_id = OLD.supervisor_user_id AND role = 'supervisor';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_push_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := jsonb_build_object(
      'user_id', NEW.user_id,
      'title', NEW.title,
      'body', NEW.body,
      'type', NEW.type,
      'metadata', NEW.metadata
    )
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_student_submission_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  student_user_id uuid;
  project_title text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT s.user_id INTO student_user_id
    FROM public.students s
    WHERE s.id = NEW.student_id;

    SELECT p.title INTO project_title
    FROM public.projects p
    WHERE p.id = NEW.project_id;

    IF student_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, type, metadata)
      VALUES (
        student_user_id,
        'Mise à jour de soumission',
        'Votre soumission pour "' || COALESCE(project_title, 'Projet') || '" a été mise à jour: ' || NEW.status,
        'submission_update',
        jsonb_build_object('submission_id', NEW.id, 'project_id', NEW.project_id, 'new_status', NEW.status)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
