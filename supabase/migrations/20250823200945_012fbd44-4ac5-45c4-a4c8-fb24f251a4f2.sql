-- Add supervisor role support and create supervisor class assignments table

-- Check if supervisor role exists in user_role enum, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'supervisor', 'user');
    ELSE
        -- Add supervisor to existing enum if not present
        BEGIN
            ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'supervisor';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- Create supervisor_class_assignments table
CREATE TABLE IF NOT EXISTS public.supervisor_class_assignments (
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

-- Create function to check if user is admin or supervisor for a class
CREATE OR REPLACE FUNCTION public.can_view_class_data(target_class_id BIGINT)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Allow if admin
  IF public.is_admin() THEN
    RETURN true;
  END IF;
  
  -- Allow if supervisor assigned to this class
  IF public.is_supervisor() THEN
    RETURN EXISTS (
      SELECT 1 
      FROM public.supervisor_class_assignments 
      WHERE supervisor_user_id = auth.uid() 
      AND class_id = target_class_id
    );
  END IF;
  
  RETURN false;
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

-- Update RLS policies for submissions to allow supervisor access
DROP POLICY IF EXISTS "Admins can view all submissions" ON public.submissions;
CREATE POLICY "Admins and supervisors can view relevant submissions" 
ON public.submissions 
FOR SELECT 
USING (
  -- Keep existing student access
  (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()))
  OR
  -- Admin access
  public.is_admin()
  OR
  -- Supervisor access to assigned classes
  (public.is_supervisor() AND class_id IN (
    SELECT class_id 
    FROM public.supervisor_class_assignments 
    WHERE supervisor_user_id = auth.uid()
  ))
);

-- Update RLS policies for students to allow supervisor access
DROP POLICY IF EXISTS "Admins can view all students" ON public.students;
CREATE POLICY "Admins and supervisors can view relevant students" 
ON public.students 
FOR SELECT 
USING (
  -- Keep existing student self-access
  (user_id = auth.uid())
  OR
  -- Admin access
  public.is_admin()
  OR
  -- Supervisor access to students in assigned classes
  (public.is_supervisor() AND id IN (
    SELECT e.student_id
    FROM public.enrollments e
    INNER JOIN public.supervisor_class_assignments sca ON e.class_id = sca.class_id
    WHERE sca.supervisor_user_id = auth.uid()
  ))
);

-- Update RLS policies for enrollments to allow supervisor access
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.enrollments;
CREATE POLICY "Admins and supervisors can view relevant enrollments" 
ON public.enrollments 
FOR SELECT 
USING (
  -- Keep existing student access
  (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()))
  OR
  -- Admin access
  public.is_admin()
  OR
  -- Supervisor access to assigned classes
  (public.is_supervisor() AND class_id IN (
    SELECT class_id 
    FROM public.supervisor_class_assignments 
    WHERE supervisor_user_id = auth.uid()
  ))
);

-- Ensure only admins can update submission status/grade/feedback
DROP POLICY IF EXISTS "Admins can update submissions" ON public.submissions;
CREATE POLICY "Only admins can update submissions" 
ON public.submissions 
FOR UPDATE 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_supervisor_class_assignments_supervisor_user_id 
ON public.supervisor_class_assignments(supervisor_user_id);

CREATE INDEX IF NOT EXISTS idx_supervisor_class_assignments_class_id 
ON public.supervisor_class_assignments(class_id);

CREATE INDEX IF NOT EXISTS idx_submissions_class_id_status_created_at 
ON public.submissions(class_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_students_user_id 
ON public.students(user_id);

-- Bootstrap admin users from environment
-- This will be handled in an edge function for security

-- Create function to promote user to admin (emergency use)
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  target_user_id UUID;
BEGIN
  -- Only existing admins can promote others
  IF NOT public.is_admin() THEN
    RETURN 'Access denied: Admin role required';
  END IF;
  
  -- Find user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RETURN 'User not found';
  END IF;
  
  -- Insert admin role if not exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN 'User promoted to admin successfully';
END;
$function$;