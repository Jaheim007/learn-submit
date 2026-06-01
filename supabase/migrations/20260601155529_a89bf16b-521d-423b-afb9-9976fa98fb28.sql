
CREATE OR REPLACE FUNCTION public.mark_previous_submissions_not_latest()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_version int;
BEGIN
  -- Flip previous latest rows for this student+project
  UPDATE public.submissions
     SET is_latest = false
   WHERE student_id = NEW.student_id
     AND project_id = NEW.project_id
     AND is_latest = true;

  -- Auto-increment version
  SELECT COALESCE(MAX(version), 0) INTO max_version
    FROM public.submissions
   WHERE student_id = NEW.student_id
     AND project_id = NEW.project_id;

  NEW.version := max_version + 1;
  NEW.is_latest := true;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mark_previous_submissions_not_latest ON public.submissions;
CREATE TRIGGER trg_mark_previous_submissions_not_latest
BEFORE INSERT ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.mark_previous_submissions_not_latest();
