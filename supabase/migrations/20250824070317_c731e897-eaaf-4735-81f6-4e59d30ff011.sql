-- Remove views that expose auth.users data to fix security issues
DROP VIEW IF EXISTS public.admins_v CASCADE;
DROP VIEW IF EXISTS public.students_v CASCADE; 
DROP VIEW IF EXISTS public.supervisors_v CASCADE;

-- Note: We'll keep v_students_admin as it doesn't join with auth.users
-- The other tables already have proper email columns so views aren't needed