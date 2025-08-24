-- Fix admin RLS policy for submission updates
DROP POLICY IF EXISTS "Admins can update all submissions" ON public.submissions;
DROP POLICY IF EXISTS "Students can update their own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Only admins can update submissions" ON public.submissions;

-- Admin-only UPDATE policy
CREATE POLICY "Only admins can update submissions"
ON public.submissions
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Add locked_at column for submission locking
ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS locked_at timestamptz;

-- Function to lock submissions on insert
CREATE OR REPLACE FUNCTION public.lock_submission_on_insert()
RETURNS trigger AS $$
BEGIN
  IF NEW.locked_at IS NULL THEN
    NEW.locked_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically lock submissions on creation
DROP TRIGGER IF EXISTS trg_lock_submission_on_insert ON public.submissions;
CREATE TRIGGER trg_lock_submission_on_insert
BEFORE INSERT ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION public.lock_submission_on_insert();

-- Ensure only one latest submission per (student, project)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_latest_submission
ON public.submissions(student_id, project_id)
WHERE is_latest = true;

-- Check if constraint exists and add if not
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'submissions_grade_check'
    ) THEN
        ALTER TABLE public.submissions 
        ADD CONSTRAINT submissions_grade_check 
        CHECK (grade IS NULL OR (grade >= 0 AND grade <= 20));
    END IF;
END $$;