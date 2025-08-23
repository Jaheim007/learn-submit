-- Fix the RLS policy for students table
DROP POLICY IF EXISTS "Students can update their own profile" ON public.students;

CREATE POLICY "Students can update their own profile" 
ON public.students 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() AND 
  (
    public.is_admin() OR 
    (SELECT primary_class_id FROM public.students WHERE user_id = auth.uid()) IS NULL OR 
    primary_class_id = (SELECT primary_class_id FROM public.students WHERE user_id = auth.uid())
  )
);