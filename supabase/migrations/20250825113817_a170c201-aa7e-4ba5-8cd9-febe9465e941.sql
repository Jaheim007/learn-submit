-- Assign student role to all existing students who don't have it yet
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT user_id, 'student'
FROM public.students 
WHERE user_id NOT IN (
  SELECT user_id 
  FROM public.user_roles 
  WHERE role = 'student'
)
ON CONFLICT (user_id, role) DO NOTHING;