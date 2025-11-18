-- Add onboarding fields to submito_organizations table
ALTER TABLE submito_organizations
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS staff_size TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Create index for faster onboarding checks
CREATE INDEX IF NOT EXISTS idx_submito_organizations_onboarding 
ON submito_organizations(onboarding_completed);

-- Comment for clarity
COMMENT ON COLUMN submito_organizations.onboarding_completed IS 'Whether the organization has completed the onboarding process';
COMMENT ON COLUMN submito_organizations.industry IS 'The industry/sector the organization operates in';
COMMENT ON COLUMN submito_organizations.staff_size IS 'Size of the organization (e.g., 1-10, 11-50, etc.)';
COMMENT ON COLUMN submito_organizations.banner_url IS 'URL to the organization banner image';