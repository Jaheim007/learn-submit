-- Remove the potentially problematic SECURITY DEFINER view
-- The v_students_admin view is not needed since we can query students table directly
-- with proper RLS policies already in place

DROP VIEW IF EXISTS public.v_students_admin;

-- The students table already has proper RLS policies:
-- - students_admin_all: allows admins to do everything
-- - students_self_read: allows students to read their own data
-- - students_self_update: allows students to update their own data
-- - students_self_insert: allows students to insert their own data

-- These policies are sufficient for admin access without needing a separate view