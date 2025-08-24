-- Fix security definer views by recreating them as normal views
DROP VIEW IF EXISTS public.admins_v CASCADE;
DROP VIEW IF EXISTS public.supervisors_v CASCADE;
DROP VIEW IF EXISTS public.students_v CASCADE;

-- Recreate views without SECURITY DEFINER (they are normal views by default)
CREATE VIEW public.admins_v AS
SELECT p.*
FROM public.profiles p
JOIN public.user_roles r ON r.user_id = p.id AND r.role = 'admin';

CREATE VIEW public.supervisors_v AS
SELECT p.*
FROM public.profiles p
JOIN public.user_roles r ON r.user_id = p.id AND r.role = 'supervisor';

CREATE VIEW public.students_v AS
SELECT p.*, ce.class_id
FROM public.profiles p
JOIN public.user_roles r ON r.user_id = p.id AND r.role = 'student'
LEFT JOIN public.class_enrollments ce ON ce.user_id = p.id;

-- Fix function search path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now(); 
  RETURN NEW;
END $$;