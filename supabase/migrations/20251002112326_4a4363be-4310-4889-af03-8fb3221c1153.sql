-- Close G1-G12 for signup
UPDATE classes 
SET is_open_for_signup = false
WHERE code IN ('G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10', 'G11', 'G12');

-- Create Advanced Hacking class
INSERT INTO classes (code, title, session_name, is_active, is_open_for_signup, description)
VALUES (
  'AH',
  'Advanced Hacking',
  'Advanced Hacking',
  true,
  true,
  'Formation avancée en cybersécurité et hacking éthique'
)
ON CONFLICT (code) DO UPDATE
SET is_open_for_signup = true,
    session_name = 'Advanced Hacking',
    title = 'Advanced Hacking';