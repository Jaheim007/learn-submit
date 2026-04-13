
-- Fix: enrollments_student_read references students table, which causes recursion
-- when students policies reference enrollments. Replace with direct user_id check.

DROP POLICY IF EXISTS "enrollments_student_read" ON public.enrollments;

CREATE POLICY "enrollments_student_read" ON public.enrollments
FOR SELECT TO authenticated
USING (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
);

-- Actually this still references students. We need a SECURITY DEFINER function instead.
DROP POLICY IF EXISTS "enrollments_student_read" ON public.enrollments;

CREATE OR REPLACE FUNCTION public.get_student_ids_for_user(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.students WHERE user_id = p_user_id;
$$;

CREATE POLICY "enrollments_student_read" ON public.enrollments
FOR SELECT TO authenticated
USING (
  student_id IN (SELECT public.get_student_ids_for_user(auth.uid()))
);
