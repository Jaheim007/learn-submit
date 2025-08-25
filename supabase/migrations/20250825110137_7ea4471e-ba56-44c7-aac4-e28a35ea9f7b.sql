-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Instructors are publicly viewable" ON public.instructors;

-- Create more secure policies
-- Allow public access to basic instructor info (name and ID only)
CREATE POLICY "Public can view instructor basic info" 
ON public.instructors 
FOR SELECT 
USING (true);

-- However, we need to handle email access differently
-- For now, let's restrict all access to authenticated users only
DROP POLICY IF EXISTS "Public can view instructor basic info" ON public.instructors;

-- Create policy for authenticated users only
CREATE POLICY "Authenticated users can view instructors" 
ON public.instructors 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Allow admins to manage instructor records
CREATE POLICY "Admins can manage instructors" 
ON public.instructors 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());