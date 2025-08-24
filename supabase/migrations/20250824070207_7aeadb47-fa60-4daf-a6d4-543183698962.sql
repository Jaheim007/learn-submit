-- Add the current user as admin
INSERT INTO public.user_roles (user_id, role) 
VALUES ('831b540f-9421-426e-a223-b9d673364ef3', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;