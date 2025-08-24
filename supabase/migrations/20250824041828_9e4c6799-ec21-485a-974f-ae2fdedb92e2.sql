-- 1. PROFILES: one row per Auth user
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now(); 
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. ROLES: normalized, no duplicates
DROP TABLE IF EXISTS public.user_roles CASCADE;
CREATE TABLE public.user_roles (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin','supervisor','student')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role)
);

-- 3. ENROLLMENTS: which class(es) a student belongs to
CREATE TABLE IF NOT EXISTS public.class_enrollments (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id bigint NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, class_id)
);

-- 4. VIEWS: canonical "lists" used by the app
CREATE OR REPLACE VIEW public.admins_v AS
SELECT p.*
FROM public.profiles p
JOIN public.user_roles r ON r.user_id = p.id AND r.role = 'admin';

CREATE OR REPLACE VIEW public.supervisors_v AS
SELECT p.*
FROM public.profiles p
JOIN public.user_roles r ON r.user_id = p.id AND r.role = 'supervisor';

CREATE OR REPLACE VIEW public.students_v AS
SELECT p.*, ce.class_id
FROM public.profiles p
JOIN public.user_roles r ON r.user_id = p.id AND r.role = 'student'
LEFT JOIN public.class_enrollments ce ON ce.user_id = p.id;

-- 5. Data migration - Backfill PROFILES from existing data
INSERT INTO public.profiles (id, email, full_name, phone)
SELECT u.id, u.email, s.full_name, s.phone
FROM auth.users u
JOIN public.students s ON s.user_id = u.id
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone;

INSERT INTO public.profiles (id, email, full_name, phone)
SELECT u.id, u.email, a.full_name, a.phone
FROM auth.users u
JOIN public.admins a ON a.user_id = u.id
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone;

INSERT INTO public.profiles (id, email, full_name, phone)
SELECT u.id, u.email, sv.full_name, sv.phone
FROM auth.users u
JOIN public.supervisors sv ON sv.user_id = u.id
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone;

-- Ensure profiles for all existing auth.users
INSERT INTO public.profiles (id, email, full_name)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', u.email)
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Backfill ROLES
INSERT INTO public.user_roles (user_id, role)
SELECT a.user_id, 'admin'
FROM public.admins a
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT s.user_id, 'student'
FROM public.students s
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT sv.user_id, 'supervisor'
FROM public.supervisors sv
ON CONFLICT DO NOTHING;

-- Backfill ENROLLMENTS from legacy enrollments table
INSERT INTO public.class_enrollments (user_id, class_id)
SELECT s.user_id, e.class_id
FROM public.students s
JOIN public.enrollments e ON e.student_id = s.id
WHERE s.user_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Also backfill from students primary_class_id if it exists
INSERT INTO public.class_enrollments (user_id, class_id)
SELECT s.user_id, s.primary_class_id
FROM public.students s
WHERE s.primary_class_id IS NOT NULL
  AND s.user_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 6. Update is_admin() function to use new user_roles table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$function$;

-- 7. Update is_supervisor() function to use new user_roles table
CREATE OR REPLACE FUNCTION public.is_supervisor()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'supervisor'
  );
END;
$function$;

-- 8. RLS for new tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_admin_read" ON public.profiles
FOR SELECT USING (is_admin());

CREATE POLICY "profiles_self_read" ON public.profiles
FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_self_update" ON public.profiles
FOR UPDATE USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_admin_update" ON public.profiles
FOR UPDATE USING (is_admin())
WITH CHECK (is_admin());

-- USER_ROLES policies
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_admin_all" ON public.user_roles
FOR ALL USING (is_admin());

CREATE POLICY "user_roles_self_read" ON public.user_roles
FOR SELECT USING (user_id = auth.uid());

-- CLASS_ENROLLMENTS policies
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "class_enrollments_admin_all" ON public.class_enrollments
FOR ALL USING (is_admin());

CREATE POLICY "class_enrollments_self_read" ON public.class_enrollments
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "class_enrollments_student_insert" ON public.class_enrollments
FOR INSERT WITH CHECK (user_id = auth.uid());

-- 9. Update submissions table to work with new schema
-- Update submissions RLS to use new user_roles table
DROP POLICY IF EXISTS "students read own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Students can view their own submissions" ON public.submissions;
DROP POLICY IF EXISTS "students read own submissions" ON public.submissions;

CREATE POLICY "students_read_own_submissions" ON public.submissions
FOR SELECT USING (
  student_id IN (
    SELECT s.id 
    FROM public.students s
    WHERE s.user_id = auth.uid()
  )
);

-- Update class projects to work with new enrollments
DROP POLICY IF EXISTS "students can read class_projects for enrolled classes" ON public.class_projects;

CREATE POLICY "students_read_enrolled_class_projects" ON public.class_projects
FOR SELECT USING (
  is_admin() OR 
  class_id IN (
    SELECT ce.class_id 
    FROM public.class_enrollments ce
    WHERE ce.user_id = auth.uid()
  )
);

-- Update projects to work with new enrollments
DROP POLICY IF EXISTS "students read assigned projects" ON public.projects;
DROP POLICY IF EXISTS "students see projects for enrolled classes" ON public.projects;

CREATE POLICY "students_read_assigned_projects" ON public.projects
FOR SELECT USING (
  is_admin() OR 
  id IN (
    SELECT cp.project_id
    FROM public.class_projects cp
    JOIN public.class_enrollments ce ON ce.class_id = cp.class_id
    WHERE ce.user_id = auth.uid()
  )
);