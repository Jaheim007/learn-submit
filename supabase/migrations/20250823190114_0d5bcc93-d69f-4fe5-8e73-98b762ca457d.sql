-- Check if classes G1-G5 exist, if not insert them with explicit IDs
DO $$
DECLARE
    class_count INTEGER;
    next_id INTEGER;
BEGIN
    -- Check if G1-G5 classes exist
    SELECT COUNT(*) INTO class_count 
    FROM public.classes 
    WHERE code IN ('G1', 'G2', 'G3', 'G4', 'G5');
    
    -- If fewer than 5 classes exist, find the next available ID and insert missing ones
    IF class_count < 5 THEN
        -- Get the next available ID
        SELECT COALESCE(MAX(id), 0) + 1 INTO next_id FROM public.classes;
        
        -- Insert missing classes
        INSERT INTO public.classes (id, code, title, description, is_active) 
        SELECT 
            next_id + row_number() OVER () - 1,
            class_code,
            'Formation 1000Sites 1ere Session (' || class_code || ')',
            'Groupe de classe ' || class_code || ' pour la formation 1000Sites',
            true
        FROM UNNEST(ARRAY['G1', 'G2', 'G3', 'G4', 'G5']) AS class_code
        WHERE class_code NOT IN (SELECT code FROM public.classes)
        ON CONFLICT (code) DO NOTHING;
    END IF;
END $$;

-- Add primary_class_id column to students table if it doesn't exist
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS primary_class_id bigint 
REFERENCES public.classes(id) 
DEFERRABLE INITIALLY DEFERRED;

-- Create unique index to prevent duplicate enrollments if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'enrollments' 
        AND indexname = 'idx_enrollments_student_class_unique'
    ) THEN
        CREATE UNIQUE INDEX idx_enrollments_student_class_unique 
        ON public.enrollments (student_id, class_id);
    END IF;
END $$;

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