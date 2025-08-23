-- Add supervisor role and create supervisor class assignments table

-- Add supervisor to user_role enum
ALTER TYPE user_role ADD VALUE 'supervisor';

-- Create supervisor_class_assignments table
CREATE TABLE public.supervisor_class_assignments (
    id BIGSERIAL PRIMARY KEY,
    supervisor_user_id UUID NOT NULL,
    class_id BIGINT NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(supervisor_user_id, class_id)
);

-- Enable RLS
ALTER TABLE public.supervisor_class_assignments ENABLE ROW LEVEL SECURITY;

-- Create is_supervisor function
CREATE OR REPLACE FUNCTION public.is_supervisor()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'supervisor'
  );
END;
$function$;

-- RLS Policies for supervisor_class_assignments
CREATE POLICY "Admins can manage supervisor assignments" 
ON public.supervisor_class_assignments 
FOR ALL 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

CREATE POLICY "Supervisors can view their assignments" 
ON public.supervisor_class_assignments 
FOR SELECT 
USING (supervisor_user_id = auth.uid());

-- Update submissions RLS for supervisor access
DROP POLICY IF EXISTS "Admins and supervisors can view relevant submissions" ON public.submissions;
CREATE POLICY "Admins and supervisors can view relevant submissions" 
ON public.submissions 
FOR SELECT 
USING (
  (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()))
  OR public.is_admin()
  OR (public.is_supervisor() AND class_id IN (
    SELECT class_id FROM public.supervisor_class_assignments 
    WHERE supervisor_user_id = auth.uid()
  ))
);

-- Update students RLS for supervisor access
DROP POLICY IF EXISTS "Admins and supervisors can view relevant students" ON public.students;
CREATE POLICY "Admins and supervisors can view relevant students" 
ON public.students 
FOR SELECT 
USING (
  (user_id = auth.uid())
  OR public.is_admin()
  OR (public.is_supervisor() AND id IN (
    SELECT e.student_id
    FROM public.enrollments e
    INNER JOIN public.supervisor_class_assignments sca ON e.class_id = sca.class_id
    WHERE sca.supervisor_user_id = auth.uid()
  ))
);

-- Update enrollments RLS for supervisor access
DROP POLICY IF EXISTS "Admins and supervisors can view relevant enrollments" ON public.enrollments;
CREATE POLICY "Admins and supervisors can view relevant enrollments" 
ON public.enrollments 
FOR SELECT 
USING (
  (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()))
  OR public.is_admin()
  OR (public.is_supervisor() AND class_id IN (
    SELECT class_id FROM public.supervisor_class_assignments 
    WHERE supervisor_user_id = auth.uid()
  ))
);

-- Only admins can update submissions
DROP POLICY IF EXISTS "Only admins can update submissions" ON public.submissions;
CREATE POLICY "Only admins can update submissions" 
ON public.submissions 
FOR UPDATE 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- Create indexes
CREATE INDEX idx_supervisor_class_assignments_supervisor_user_id 
ON public.supervisor_class_assignments(supervisor_user_id);

CREATE INDEX idx_supervisor_class_assignments_class_id 
ON public.supervisor_class_assignments(class_id);

CREATE INDEX idx_submissions_class_id_status_created_at 
ON public.submissions(class_id, status, created_at DESC);

CREATE INDEX idx_students_user_id 
ON public.students(user_id);