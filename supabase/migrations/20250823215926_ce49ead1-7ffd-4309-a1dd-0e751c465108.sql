
-- Add is_active column to students table for soft deletion
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_submissions_admin_list 
ON public.submissions(class_id, project_id, status, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_submissions_student_latest 
ON public.submissions(student_id, is_latest, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_students_active_email 
ON public.students(is_active, email);

CREATE INDEX IF NOT EXISTS idx_supervisor_assignments 
ON public.supervisor_class_assignments(supervisor_user_id, class_id);

-- Add RLS policies for admin access to all data
CREATE POLICY "Admins can view all students" 
ON public.students 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can update students" 
ON public.students 
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can view all submissions" 
ON public.submissions 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can update all submissions" 
ON public.submissions 
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can view all enrollments" 
ON public.enrollments 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can manage all projects" 
ON public.projects 
FOR ALL 
USING (is_admin());

CREATE POLICY "Admins can manage all class_projects" 
ON public.class_projects 
FOR ALL 
USING (is_admin());
