-- Ensure user_roles table has proper RLS policy for service role inserts
-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "service can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can insert user roles" ON public.user_roles;

-- Create the correct policy for service role to insert user roles
CREATE POLICY "service can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');