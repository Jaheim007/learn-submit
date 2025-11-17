-- Add 'academy' to user_role enum if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'academy'
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'academy';
  END IF;
END $$;