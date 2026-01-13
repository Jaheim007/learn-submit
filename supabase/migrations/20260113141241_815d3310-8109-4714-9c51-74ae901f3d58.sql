-- Add INSERT policy for admins on classes table
CREATE POLICY "Admins can insert classes"
ON public.classes
FOR INSERT
WITH CHECK (public.is_admin());

-- Add UPDATE policy for admins on classes table
CREATE POLICY "Admins can update classes"
ON public.classes
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Add DELETE policy for admins on classes table
CREATE POLICY "Admins can delete classes"
ON public.classes
FOR DELETE
USING (public.is_admin());