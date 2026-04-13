-- Change 5 admin users to academy role
UPDATE public.user_roles 
SET role = 'academy' 
WHERE user_id IN (
  '16215177-5371-4a3f-8b05-ad15d30dafb5', -- Anne-Marie Y.
  'bcb91519-deac-464e-872c-73660f64b894', -- Coach Ferlux Yapo
  '31ad31b6-b0ca-4e7c-95bc-961c3436d39a', -- Denéa Naxelle
  '717e666c-1802-4f23-95ab-f2c80ee96d70', -- Kouamé
  'cec9bd1d-b478-457a-96e3-f87f4ddb4a23'  -- Mireille Mela
) AND role = 'admin';