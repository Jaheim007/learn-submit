-- Add new class "Formation 1000Sites 3eme Session (G31)" and ensure both classes are open for signup

-- Insert the new G31 class
INSERT INTO public.classes (code, title, session_name, is_active, is_open_for_signup)
VALUES (
  'G31',
  'Formation 1000Sites 3eme Session',
  '3ème Session',
  true,
  true
)
ON CONFLICT (code) DO UPDATE
SET 
  is_open_for_signup = true,
  is_active = true,
  title = EXCLUDED.title,
  session_name = EXCLUDED.session_name;

-- Ensure Advanced Hacking remains open for signup
UPDATE public.classes
SET is_open_for_signup = true, is_active = true
WHERE code = 'AH';