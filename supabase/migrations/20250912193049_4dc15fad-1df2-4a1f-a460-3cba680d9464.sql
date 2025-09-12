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

-- Insert new classes for 2ème Session (G6-G12) without specifying ID
INSERT INTO public.classes (code, title, session_name, is_open_for_signup, is_active, description) VALUES
('G6', 'Groupe 6', 'Formation 1000Sites 2ème Session', true, true, 'Formation 1000Sites - Groupe 6'),
('G7', 'Groupe 7', 'Formation 1000Sites 2ème Session', true, true, 'Formation 1000Sites - Groupe 7'),
('G8', 'Groupe 8', 'Formation 1000Sites 2ème Session', true, true, 'Formation 1000Sites - Groupe 8'),
('G9', 'Groupe 9', 'Formation 1000Sites 2ème Session', true, true, 'Formation 1000Sites - Groupe 9'),
('G10', 'Groupe 10', 'Formation 1000Sites 2ème Session', true, true, 'Formation 1000Sites - Groupe 10'),
('G11', 'Groupe 11', 'Formation 1000Sites 2ème Session', true, true, 'Formation 1000Sites - Groupe 11'),
('G12', 'Groupe 12', 'Formation 1000Sites 2ème Session', true, true, 'Formation 1000Sites - Groupe 12')
ON CONFLICT (code) DO UPDATE SET
  session_name = EXCLUDED.session_name,
  is_open_for_signup = EXCLUDED.is_open_for_signup;