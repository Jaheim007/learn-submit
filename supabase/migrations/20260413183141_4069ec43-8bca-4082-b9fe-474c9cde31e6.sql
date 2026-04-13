
-- Add platform column to user_roles
ALTER TABLE public.user_roles 
ADD COLUMN platform text NOT NULL DEFAULT 'both';

-- Add check constraint for valid platforms
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_platform_check 
CHECK (platform IN ('hacktualiz', 'groupformation', 'both'));

-- Drop old primary key
ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_pkey;

-- Create new primary key including platform
ALTER TABLE public.user_roles ADD PRIMARY KEY (user_id, role, platform);

-- Now update the 5 non-super-admin users:
-- Their admin role → groupformation only
-- Their academy role → hacktualiz only

-- Mireille Mela
UPDATE public.user_roles SET platform = 'groupformation' WHERE user_id = 'cec9bd1d-b478-457a-96e3-f87f4ddb4a23' AND role = 'admin';
UPDATE public.user_roles SET platform = 'hacktualiz' WHERE user_id = 'cec9bd1d-b478-457a-96e3-f87f4ddb4a23' AND role = 'academy';

-- Kouamé
UPDATE public.user_roles SET platform = 'groupformation' WHERE user_id = '717e666c-1802-4f23-95ab-f2c80ee96d70' AND role = 'admin';
UPDATE public.user_roles SET platform = 'hacktualiz' WHERE user_id = '717e666c-1802-4f23-95ab-f2c80ee96d70' AND role = 'academy';

-- Coach Ferlux Yapo
UPDATE public.user_roles SET platform = 'groupformation' WHERE user_id = 'bcb91519-deac-464e-872c-73660f64b894' AND role = 'admin';
UPDATE public.user_roles SET platform = 'hacktualiz' WHERE user_id = 'bcb91519-deac-464e-872c-73660f64b894' AND role = 'academy';

-- Anne-Marie Y.
UPDATE public.user_roles SET platform = 'groupformation' WHERE user_id = '16215177-5371-4a3f-8b05-ad15d30dafb5' AND role = 'admin';
UPDATE public.user_roles SET platform = 'hacktualiz' WHERE user_id = '16215177-5371-4a3f-8b05-ad15d30dafb5' AND role = 'academy';

-- Denéa Naxelle
UPDATE public.user_roles SET platform = 'groupformation' WHERE user_id = '31ad31b6-b0ca-4e7c-95bc-961c3436d39a' AND role = 'admin';
UPDATE public.user_roles SET platform = 'hacktualiz' WHERE user_id = '31ad31b6-b0ca-4e7c-95bc-961c3436d39a' AND role = 'academy';

-- The 3 super admins keep 'both' (default) - no changes needed
