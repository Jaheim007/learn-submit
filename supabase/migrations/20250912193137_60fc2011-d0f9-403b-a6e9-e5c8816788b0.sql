-- Add session management columns to classes table
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS session_name text,
ADD COLUMN IF NOT EXISTS is_open_for_signup boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS signup_deadline timestamptz;

-- Update existing G1-G5 classes for 1ère Session and close them for signup
UPDATE public.classes 
SET 
  session_name = 'Formation 1000Sites 1ère Session',
  is_open_for_signup = false
WHERE code IN ('G1', 'G2', 'G3', 'G4', 'G5');

-- Reset sequence to avoid conflicts
SELECT setval('classes_id_seq', (SELECT COALESCE(MAX(id), 0) FROM classes), true);

-- Insert new classes for 2ème Session (G6-G12) one by one to avoid conflicts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM classes WHERE code = 'G6') THEN
    INSERT INTO public.classes (code, title, session_name, is_open_for_signup, is_active, description) 
    VALUES ('G6', 'Groupe 6', 'Formation 1000Sites 2ème Session', true, true, 'Formation 1000Sites - Groupe 6');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM classes WHERE code = 'G7') THEN
    INSERT INTO public.classes (code, title, session_name, is_open_for_signup, is_active, description) 
    VALUES ('G7', 'Groupe 7', 'Formation 1000Sites 2ème Session', true, true, 'Formation 1000Sites - Groupe 7');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM classes WHERE code = 'G8') THEN
    INSERT INTO public.classes (code, title, session_name, is_open_for_signup, is_active, description) 
    VALUES ('G8', 'Groupe 8', 'Formation 1000Sites 2ème Session', true, true, 'Formation 1000Sites - Groupe 8');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM classes WHERE code = 'G9') THEN
    INSERT INTO public.classes (code, title, session_name, is_open_for_signup, is_active, description) 
    VALUES ('G9', 'Groupe 9', 'Formation 1000Sites 2ème Session', true, true, 'Formation 1000Sites - Groupe 9');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM classes WHERE code = 'G10') THEN
    INSERT INTO public.classes (code, title, session_name, is_open_for_signup, is_active, description) 
    VALUES ('G10', 'Groupe 10', 'Formation 1000Sites 2ème Session', true, true, 'Formation 1000Sites - Groupe 10');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM classes WHERE code = 'G11') THEN
    INSERT INTO public.classes (code, title, session_name, is_open_for_signup, is_active, description) 
    VALUES ('G11', 'Groupe 11', 'Formation 1000Sites 2ème Session', true, true, 'Formation 1000Sites - Groupe 11');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM classes WHERE code = 'G12') THEN
    INSERT INTO public.classes (code, title, session_name, is_open_for_signup, is_active, description) 
    VALUES ('G12', 'Groupe 12', 'Formation 1000Sites 2ème Session', true, true, 'Formation 1000Sites - Groupe 12');
  END IF;
END $$;