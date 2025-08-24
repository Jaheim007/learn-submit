-- Fix security definer views by recreating them without SECURITY DEFINER
DROP VIEW IF EXISTS public.admins_v CASCADE;
DROP VIEW IF EXISTS public.students_v CASCADE;
DROP VIEW IF EXISTS public.supervisors_v CASCADE;
DROP VIEW IF EXISTS public.v_students_admin CASCADE;

-- Recreate views without SECURITY DEFINER
CREATE VIEW public.admins_v AS
SELECT 
  a.user_id as id,
  a.created_at,
  a.updated_at,
  au.email,
  a.full_name,
  a.phone
FROM public.admins a
LEFT JOIN auth.users au ON au.id = a.user_id;

CREATE VIEW public.students_v AS
SELECT 
  s.id,
  s.created_at,
  s.updated_at,
  s.primary_class_id as class_id,
  au.email,
  s.full_name,
  s.phone
FROM public.students s
LEFT JOIN auth.users au ON au.id = s.user_id;

CREATE VIEW public.supervisors_v AS
SELECT 
  s.user_id as id,
  s.created_at,
  s.updated_at,
  au.email,
  s.full_name,
  s.phone
FROM public.supervisors s
LEFT JOIN auth.users au ON au.id = s.user_id;

CREATE VIEW public.v_students_admin AS
SELECT 
  s.is_active,
  s.created_at,
  s.id,
  s.user_id,
  s.full_name,
  s.email,
  s.phone,
  s.whatsapp,
  s.telegram,
  s.github_profile
FROM public.students s;