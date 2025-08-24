-- Ensure columns exist on projects table
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS deadline_at timestamptz,
  ADD COLUMN IF NOT EXISTS allow_resubmit boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_resubmits int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Unique M2M constraint for class_projects
CREATE UNIQUE INDEX IF NOT EXISTS idx_class_projects_unique
ON public.class_projects(class_id, project_id);

-- Enable RLS on projects and class_projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_projects ENABLE ROW LEVEL SECURITY;

-- Admins can do everything on projects
DROP POLICY IF EXISTS "admins all on projects" ON public.projects;
CREATE POLICY "admins all on projects"
ON public.projects FOR ALL
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admins can do everything on class_projects
DROP POLICY IF EXISTS "admins all on class_projects" ON public.class_projects;
CREATE POLICY "admins all on class_projects"
ON public.class_projects FOR ALL
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Students can read projects assigned to their classes
DROP POLICY IF EXISTS "students read assigned projects" ON public.projects;
CREATE POLICY "students read assigned projects"
ON public.projects FOR SELECT
USING (
  public.is_admin()
  OR id IN (
    SELECT cp.project_id
    FROM public.class_projects cp
    JOIN public.enrollments e ON e.class_id = cp.class_id
    JOIN public.students s ON s.id = e.student_id
    WHERE s.user_id = auth.uid()
  )
);