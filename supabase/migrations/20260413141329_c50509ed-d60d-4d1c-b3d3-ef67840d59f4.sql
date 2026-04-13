
-- Add back 'admin' role to the 5 academy users (they need both roles)
INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'admin'
FROM auth.users au
WHERE au.email IN (
  'annemariey04@gmail.com',
  'coachferluxyapo@gmail.com',
  'deneanaxelle@gmail.com',
  'kouame064@gmail.com',
  'mireillemela@gmail.com'
)
ON CONFLICT (user_id, role) DO NOTHING;
