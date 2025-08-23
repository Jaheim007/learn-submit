-- Seed the 5 required classes (G1-G5) if they don't exist
INSERT INTO public.classes (code, title, description, is_active) 
VALUES 
  ('G1', 'Formation 1000Sites 1ere Session (G1)', 'Groupe de classe G1 pour la formation 1000Sites', true),
  ('G2', 'Formation 1000Sites 1ere Session (G2)', 'Groupe de classe G2 pour la formation 1000Sites', true),
  ('G3', 'Formation 1000Sites 1ere Session (G3)', 'Groupe de classe G3 pour la formation 1000Sites', true),
  ('G4', 'Formation 1000Sites 1ere Session (G4)', 'Groupe de classe G4 pour la formation 1000Sites', true),
  ('G5', 'Formation 1000Sites 1ere Session (G5)', 'Groupe de classe G5 pour la formation 1000Sites', true)
ON CONFLICT (code) DO NOTHING;

-- Add primary_class_id column to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS primary_class_id bigint 
REFERENCES public.classes(id) 
DEFERRABLE INITIALLY DEFERRED;

-- Create unique partial index to prevent duplicate enrollments
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_student_class_unique 
ON public.enrollments (student_id, class_id);

-- Create function to prevent primary_class_id changes for non-admin users
CREATE OR REPLACE FUNCTION public.prevent_primary_class_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow changes if user is admin
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;
  
  -- Prevent changing primary_class_id if it already has a value
  IF OLD.primary_class_id IS NOT NULL AND NEW.primary_class_id != OLD.primary_class_id THEN
    RAISE EXCEPTION 'primary_class_id is immutable for non-admin users';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce immutability
DROP TRIGGER IF EXISTS prevent_primary_class_change_trigger ON public.students;
CREATE TRIGGER prevent_primary_class_change_trigger
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_primary_class_change();

-- Update RLS policy for students to allow primary_class_id updates only by admins
DROP POLICY IF EXISTS "Students can update their own profile" ON public.students;
CREATE POLICY "Students can update their own profile" 
ON public.students 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() AND 
  (
    public.is_admin() OR 
    primary_class_id IS NULL OR 
    primary_class_id = (SELECT primary_class_id FROM public.students WHERE user_id = auth.uid())
  )
);