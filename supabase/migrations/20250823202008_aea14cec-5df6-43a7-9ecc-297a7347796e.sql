-- Add supervisor role and create supervisor class assignments table

-- Add supervisor to user_role enum
ALTER TYPE user_role ADD VALUE 'supervisor';

-- Create supervisor_class_assignments table
CREATE TABLE public.supervisor_class_assignments (
    id BIGSERIAL PRIMARY KEY,
    supervisor_user_id UUID NOT NULL,
    class_id BIGINT NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    UNIQUE(supervisor_user_id, class_id)
);

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

-- RLS Policies
CREATE POLICY "Admins can manage supervisor assignments" 
ON public.supervisor_class_assignments 
FOR ALL 
USING (public.is_admin());

CREATE POLICY "Supervisors can view their assignments" 
ON public.supervisor_class_assignments 
FOR SELECT 
USING (supervisor_user_id = auth.uid());