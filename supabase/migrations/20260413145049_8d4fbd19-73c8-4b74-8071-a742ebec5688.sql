
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_entity_type ON public.activity_logs(entity_type);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read activity logs"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'academy', 'super_admin')
    )
  );

CREATE POLICY "Anyone can insert activity logs"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.log_submission_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_student_name TEXT;
  v_project_title TEXT;
  v_class_title TEXT;
BEGIN
  SELECT full_name INTO v_student_name FROM public.students WHERE id = NEW.student_id;
  SELECT title INTO v_project_title FROM public.projects WHERE id = NEW.project_id;
  SELECT title INTO v_class_title FROM public.classes WHERE id = NEW.class_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (user_name, action, entity_type, entity_id, details)
    VALUES (v_student_name, 'submission_created', 'submission', NEW.id::text,
      jsonb_build_object('project', v_project_title, 'class', v_class_title, 'student', v_student_name, 'version', NEW.version));
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.activity_logs (user_name, action, entity_type, entity_id, details)
    VALUES (v_student_name, 'submission_status_changed', 'submission', NEW.id::text,
      jsonb_build_object('project', v_project_title, 'class', v_class_title, 'student', v_student_name, 'old_status', OLD.status, 'new_status', NEW.status, 'grade', NEW.grade));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_submission_activity
  AFTER INSERT OR UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.log_submission_activity();

CREATE OR REPLACE FUNCTION public.log_student_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (user_name, action, entity_type, entity_id, details)
    VALUES (NEW.full_name, 'student_registered', 'student', NEW.id, jsonb_build_object('email', NEW.email));
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.activity_logs (user_name, action, entity_type, entity_id, details)
    VALUES (NEW.full_name, 'student_status_changed', 'student', NEW.id,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_student_activity
  AFTER INSERT OR UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.log_student_activity();

CREATE OR REPLACE FUNCTION public.log_project_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (user_name, action, entity_type, entity_id, details)
    VALUES (NULL, 'project_created', 'project', NEW.id::text,
      jsonb_build_object('title', NEW.title, 'code', NEW.code, 'deadline', NEW.deadline_at));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_project_activity
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.log_project_activity();
