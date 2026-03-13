-- Assign admin role to the user
INSERT INTO public.user_roles (user_id, role)
VALUES ('c33341d3-e68b-4af0-8ce4-98e33d258bf8', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Also ensure they have an entry in admins table
INSERT INTO public.admins (user_id, full_name)
VALUES ('c33341d3-e68b-4af0-8ce4-98e33d258bf8', 'Super Admin')
ON CONFLICT (user_id) DO NOTHING;