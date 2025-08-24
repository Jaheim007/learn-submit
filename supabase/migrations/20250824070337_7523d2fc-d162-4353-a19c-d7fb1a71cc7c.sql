-- Fix the remaining security definer view
DROP VIEW IF EXISTS public.v_students_admin CASCADE;

-- Recreate v_students_admin without security definer if it was using it
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