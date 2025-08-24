-- Fix RLS policies for students and projects visibility

-- Ensure is_admin function exists
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
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

-- Fix students table RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "admins can read students" ON public.students;
DROP POLICY IF EXISTS "student can read self" ON public.students;

-- Create new comprehensive policies for students
CREATE POLICY "admins can read all students"
ON public.students FOR SELECT
USING (public.is_admin());

CREATE POLICY "students can read self"
ON public.students FOR SELECT
USING (user_id = auth.uid());

-- Fix projects table RLS for better visibility
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "students see projects for their class" ON public.projects;

-- Create new policy for students to see projects assigned to their enrolled classes
CREATE POLICY "students see projects for enrolled classes"
ON public.projects FOR SELECT
USING (
  public.is_admin() OR 
  EXISTS (
    SELECT 1
    FROM public.class_projects cp
    JOIN public.enrollments e ON e.class_id = cp.class_id
    JOIN public.students s ON s.id = e.student_id
    WHERE cp.project_id = projects.id
      AND s.user_id = auth.uid()
  )
);

-- Fix class_projects table RLS
ALTER TABLE public.class_projects ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "students can read project_classes for their class" ON public.class_projects;

-- Create policy for students to see class_projects for their enrolled classes
CREATE POLICY "students can read class_projects for enrolled classes"
ON public.class_projects FOR SELECT
USING (
  public.is_admin() OR
  EXISTS (
    SELECT 1 
    FROM public.enrollments e
    JOIN public.students s ON s.id = e.student_id
    WHERE e.class_id = class_projects.class_id
      AND s.user_id = auth.uid()
  )
);