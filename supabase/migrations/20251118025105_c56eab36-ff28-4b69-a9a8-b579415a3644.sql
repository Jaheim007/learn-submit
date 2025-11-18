-- Fix search_path for the update_submito_updated_at_column function
CREATE OR REPLACE FUNCTION update_submito_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';