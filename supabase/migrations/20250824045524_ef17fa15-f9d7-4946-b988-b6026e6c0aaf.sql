-- Fix students table schema and RLS for consistent access
-- 1. Ensure students table has proper columns and constraints
ALTER TABLE public.students 
  ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Update existing rows where user_id might be missing (backfill from auth.users if needed)
UPDATE public.students 
SET email = u.email,
    full_name = COALESCE(students.full_name, split_part(u.email, '@', 1))
FROM auth.users u 
WHERE students.user_id = u.id AND students.email IS NULL;

-- 2. Helper function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.is_admin_user(uid uuid DEFAULT auth.uid())
RETURNS boolean 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = uid AND ur.role = 'admin'
  );
$$;

-- 3. Clean up existing RLS policies on students table
DROP POLICY IF EXISTS "students_admin_read" ON public.students;
DROP POLICY IF EXISTS "students_self_read" ON public.students;
DROP POLICY IF EXISTS "Admins can read all students" ON public.students;
DROP POLICY IF EXISTS "Students can read self" ON public.students;
DROP POLICY IF EXISTS "Student creates own profile" ON public.students;
DROP POLICY IF EXISTS "Student updates own profile" ON public.students;
DROP POLICY IF EXISTS "Students can read their own profile" ON public.students;
DROP POLICY IF EXISTS "Students can update their own profile" ON public.students;
DROP POLICY IF EXISTS "Students can view their own profile" ON public.students;
DROP POLICY IF EXISTS "Admin updates all students" ON public.students;
DROP POLICY IF EXISTS "Admin deletes students" ON public.students;
DROP POLICY IF EXISTS "Admins can update students" ON public.students;
DROP POLICY IF EXISTS "Admins can view all students" ON public.students;
DROP POLICY IF EXISTS "admins can read all students" ON public.students;
DROP POLICY IF EXISTS "students can read self" ON public.students;

-- 4. Enable RLS and create new consolidated policies
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "students_admin_all" 
ON public.students 
FOR ALL 
USING (public.is_admin_user());

-- Students can read and update their own record
CREATE POLICY "students_self_read" 
ON public.students 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "students_self_update" 
ON public.students 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Students can insert their own record (for registration)
CREATE POLICY "students_self_insert" 
ON public.students 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- 5. Create a view for admin UI that shows comprehensive student data
CREATE OR REPLACE VIEW public.v_students_admin AS
SELECT 
  s.id,
  s.user_id,
  s.full_name,
  s.email,
  s.is_active,
  s.created_at,
  s.phone,
  s.whatsapp,
  s.telegram,
  s.github_profile,
  -- Count submissions for this student
  (SELECT COUNT(*) FROM public.submissions sub WHERE sub.student_id = s.id) as submissions_count
FROM public.students s
ORDER BY s.created_at DESC;

-- 6. Ensure enrollments table has proper RLS for student-class relationships
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "enrollments_admin_all" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_student_read" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Students can view their enrollments" ON public.enrollments;

CREATE POLICY "enrollments_admin_all" 
ON public.enrollments 
FOR ALL 
USING (public.is_admin_user());

CREATE POLICY "enrollments_student_read" 
ON public.enrollments 
FOR SELECT 
USING (student_id IN (
  SELECT id FROM public.students WHERE user_id = auth.uid()
));

-- 7. Create trigger to sync student identity on insert/update
CREATE OR REPLACE FUNCTION public.sync_student_identity()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Sync email from auth.users if not provided
  IF NEW.email IS NULL AND NEW.user_id IS NOT NULL THEN
    SELECT u.email INTO NEW.email 
    FROM auth.users u 
    WHERE u.id = NEW.user_id;
  END IF;
  
  -- Set default full_name if not provided
  IF NEW.full_name IS NULL AND NEW.email IS NOT NULL THEN
    NEW.full_name := split_part(NEW.email, '@', 1);
  END IF;
  
  -- Ensure is_active defaults to true
  IF NEW.is_active IS NULL THEN
    NEW.is_active := true;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_students_sync ON public.students;
CREATE TRIGGER trg_students_sync
  BEFORE INSERT OR UPDATE ON public.students
  FOR EACH ROW 
  EXECUTE FUNCTION public.sync_student_identity();