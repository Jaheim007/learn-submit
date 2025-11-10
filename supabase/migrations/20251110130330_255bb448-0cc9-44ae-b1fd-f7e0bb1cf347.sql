-- Close signup for Formation 1000Sites 3eme Session classes
UPDATE classes 
SET is_open_for_signup = false 
WHERE code IN ('G31', 'G32', 'G33', 'G34', 'G35');

-- Create new VibeCoding class
INSERT INTO classes (code, title, session_name, is_active, is_open_for_signup, description)
VALUES 
  ('VC1', 'VibeCoding - Groupe 1', 'VibeCoding Session 1', true, true, 'Formation VibeCoding - Session 1');
