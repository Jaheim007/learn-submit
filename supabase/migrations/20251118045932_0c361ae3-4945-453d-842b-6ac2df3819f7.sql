-- Auto-assign creator as organization owner on insert
CREATE OR REPLACE FUNCTION public.auto_add_org_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_full_name text;
BEGIN
  -- Get current authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    -- If no auth context (e.g., service role), do nothing
    RETURN NEW;
  END IF;

  -- Fetch email/name from auth.users when available
  SELECT u.email,
         COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
    INTO v_email, v_full_name
  FROM auth.users u
  WHERE u.id = v_user_id;

  -- Insert membership as owner; ignore if already exists
  INSERT INTO public.submito_organization_users (
    user_id,
    organization_id,
    email,
    full_name,
    role,
    is_owner
  ) VALUES (
    v_user_id,
    NEW.id,
    COALESCE(v_email, ''),
    COALESCE(v_full_name, 'User'),
    'owner',
    true
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Create trigger if not exists: drop and recreate to be safe
DROP TRIGGER IF EXISTS trg_auto_add_org_owner ON public.submito_organizations;
CREATE TRIGGER trg_auto_add_org_owner
AFTER INSERT ON public.submito_organizations
FOR EACH ROW
EXECUTE FUNCTION public.auto_add_org_owner();