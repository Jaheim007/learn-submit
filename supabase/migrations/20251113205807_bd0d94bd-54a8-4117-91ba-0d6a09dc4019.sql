-- Drop the trigger that's causing the registration error
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function that references the non-existent humanizer_users table
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Comment: This fixes the "Database error creating new user" issue
-- The trigger was trying to insert into a non-existent humanizer_users table
-- Student registration now uses the profiles table instead via the edge function