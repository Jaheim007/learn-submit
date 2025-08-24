-- Update is_admin() function to check both admins table and user_roles fallback
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  );
END;
$$;

-- Update is_supervisor() function to check both tables
CREATE OR REPLACE FUNCTION public.is_supervisor()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'supervisor'
  )
  OR EXISTS (
    SELECT 1 FROM public.supervisor_class_assignments s
    WHERE s.supervisor_user_id = auth.uid()
  );
END;
$$;

-- Fix submissions RLS policies
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Clear conflicting old policies
DROP POLICY IF EXISTS "Admins and supervisors can view relevant submissions" ON public.submissions;
DROP POLICY IF EXISTS "students read own submissions" ON public.submissions;
DROP POLICY IF EXISTS "supervisors read class submissions" ON public.submissions;
DROP POLICY IF EXISTS "admins select all submissions" ON public.submissions;

-- Admin: full SELECT access
CREATE POLICY "admins select all submissions"
ON public.submissions
FOR SELECT
USING (public.is_admin());

-- Students: own submissions only
CREATE POLICY "students read own submissions"
ON public.submissions
FOR SELECT
USING (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);

-- Supervisors: assigned classes only
CREATE POLICY "supervisors read class submissions"
ON public.submissions
FOR SELECT
USING (
  public.is_supervisor() AND class_id IN (
    SELECT class_id
    FROM public.supervisor_class_assignments
    WHERE supervisor_user_id = auth.uid()
  )
);

-- Ensure proper INSERT/UPDATE policies remain
-- Keep existing UPDATE policy for admins
-- Keep existing INSERT policy for students