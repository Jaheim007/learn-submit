-- Drop any existing RLS policies on students table that might conflict
DROP POLICY IF EXISTS "Students can read self" ON public.students;
DROP POLICY IF EXISTS "Admins can read all students" ON public.students;
DROP POLICY IF EXISTS "Student creates own profile" ON public.students;
DROP POLICY IF EXISTS "Student updates own profile" ON public.students;
DROP POLICY IF EXISTS "Admin updates all students" ON public.students;
DROP POLICY IF EXISTS "Admin deletes students" ON public.students;
DROP POLICY IF EXISTS "Students self-insert only (non-admin/supervisor)" ON public.students;

-- Ensure is_admin function exists and is correct
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
  OR EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid()
  );
$$;

-- SELECT policies: students can read themselves; admins can read all
CREATE POLICY "Students can read self"
ON public.students FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all students"
ON public.students FOR SELECT
USING (is_admin());

-- INSERT policy: only the logged-in user can create their own row
CREATE POLICY "Student creates own profile"
ON public.students FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE policies: student can edit their own; admin can edit all
CREATE POLICY "Student updates own profile"
ON public.students FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin updates all students"
ON public.students FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

-- DELETE policy: admin only
CREATE POLICY "Admin deletes students"
ON public.students FOR DELETE
USING (is_admin());

-- Check if there are any triggers that auto-create student records and drop them if they exist
DO $$
BEGIN
    -- Drop trigger if it exists
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        DROP TRIGGER on_auth_user_created ON auth.users;
    END IF;
    
    -- Drop function if it exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
        DROP FUNCTION public.handle_new_user();
    END IF;
END $$;