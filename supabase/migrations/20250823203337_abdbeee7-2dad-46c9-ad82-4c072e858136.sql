-- Add RLS policies for admin bootstrap
CREATE POLICY "Service role can insert user roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can view all user roles" 
ON public.user_roles 
FOR SELECT 
USING (is_admin());