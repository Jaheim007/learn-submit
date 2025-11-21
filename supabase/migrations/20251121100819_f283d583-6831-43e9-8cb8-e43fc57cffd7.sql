-- Add image_url column to submito_organization_classes
ALTER TABLE submito_organization_classes 
ADD COLUMN IF NOT EXISTS image_url text;