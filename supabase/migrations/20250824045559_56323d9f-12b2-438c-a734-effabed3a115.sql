-- Find and fix any remaining security definer views
-- Check existing views that might have security definer
SELECT viewname, definition 
FROM pg_views 
WHERE schemaname = 'public';

-- Let's recreate all our views without security definer
DROP VIEW IF EXISTS public.admins_v;
DROP VIEW IF EXISTS public.supervisors_v;
DROP VIEW IF EXISTS public.students_v;

-- Recreate views without security definer
CREATE VIEW public.admins_v AS
SELECT p.id, p.created_at, p.updated_at, p.email, p.full_name, p.phone
FROM public.profiles p
JOIN public.user_roles r ON r.user_id = p.id AND r.role = 'admin';

CREATE VIEW public.supervisors_v AS
SELECT p.id, p.created_at, p.updated_at, p.email, p.full_name, p.phone
FROM public.profiles p
JOIN public.user_roles r ON r.user_id = p.id AND r.role = 'supervisor';

CREATE VIEW public.students_v AS
SELECT p.id, p.created_at, p.updated_at, p.email, p.full_name, p.phone, ce.class_id
FROM public.profiles p
JOIN public.user_roles r ON r.user_id = p.id AND r.role = 'student'
LEFT JOIN public.class_enrollments ce ON ce.user_id = p.id;