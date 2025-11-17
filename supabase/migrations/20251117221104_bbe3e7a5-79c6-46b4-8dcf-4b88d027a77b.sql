-- Grant Academy users the same access as Admin users for key tables

-- Helper function to check if user has academy role
CREATE OR REPLACE FUNCTION public.is_academy()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'academy'
  );
$$;

-- Students table: Academy can view and manage all students
DROP POLICY IF EXISTS "Academy can view all students" ON public.students;
CREATE POLICY "Academy can view all students"
ON public.students
FOR SELECT
TO authenticated
USING (is_academy());

DROP POLICY IF EXISTS "Academy can update students" ON public.students;
CREATE POLICY "Academy can update students"
ON public.students
FOR UPDATE
TO authenticated
USING (is_academy())
WITH CHECK (is_academy());

-- Enrollments table: Academy can view and manage all enrollments
DROP POLICY IF EXISTS "Academy can view all enrollments" ON public.enrollments;
CREATE POLICY "Academy can view all enrollments"
ON public.enrollments
FOR SELECT
TO authenticated
USING (is_academy());

DROP POLICY IF EXISTS "Academy can manage enrollments" ON public.enrollments;
CREATE POLICY "Academy can manage enrollments"
ON public.enrollments
FOR ALL
TO authenticated
USING (is_academy())
WITH CHECK (is_academy());

-- Submissions table: Academy can view all submissions
DROP POLICY IF EXISTS "Academy can view all submissions" ON public.submissions;
CREATE POLICY "Academy can view all submissions"
ON public.submissions
FOR SELECT
TO authenticated
USING (is_academy());

DROP POLICY IF EXISTS "Academy can update submissions" ON public.submissions;
CREATE POLICY "Academy can update submissions"
ON public.submissions
FOR UPDATE
TO authenticated
USING (is_academy())
WITH CHECK (is_academy());

-- Course materials table: Academy can manage all course materials
DROP POLICY IF EXISTS "Academy can manage all course materials" ON public.course_materials;
CREATE POLICY "Academy can manage all course materials"
ON public.course_materials
FOR ALL
TO authenticated
USING (is_academy())
WITH CHECK (is_academy());

-- Class enrollments table: Academy can manage class enrollments
DROP POLICY IF EXISTS "Academy can manage class enrollments" ON public.class_enrollments;
CREATE POLICY "Academy can manage class enrollments"
ON public.class_enrollments
FOR ALL
TO authenticated
USING (is_academy())
WITH CHECK (is_academy());

-- Notifications: Academy can create and manage notifications
DROP POLICY IF EXISTS "Academy can create notifications" ON public.notifications;
CREATE POLICY "Academy can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (is_academy());

DROP POLICY IF EXISTS "Academy can view all notifications" ON public.notifications;
CREATE POLICY "Academy can view all notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (is_academy());