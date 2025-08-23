-- Add policy so users can read their own roles
CREATE POLICY "Users can read their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());