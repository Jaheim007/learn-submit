-- Fix the security definer view warning by removing SECURITY DEFINER from view
-- Create a regular view instead of security definer view
DROP VIEW IF EXISTS public.v_students_admin;

CREATE VIEW public.v_students_admin AS
SELECT 
  s.id,
  s.user_id,
  s.full_name,
  s.email,
  s.is_active,
  s.created_at,
  s.phone,
  s.whatsapp,
  s.telegram,
  s.github_profile
FROM public.students s
ORDER BY s.created_at DESC;