-- Create organizations table for multi-tenant Submito
CREATE TABLE submito_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subdomain TEXT UNIQUE,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create organization users table
CREATE TABLE submito_organization_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES submito_organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  full_name TEXT,
  email TEXT NOT NULL,
  is_owner BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Enable RLS on both tables
ALTER TABLE submito_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE submito_organization_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for submito_organizations
CREATE POLICY "Users can view their own organizations"
  ON submito_organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id 
      FROM submito_organization_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create organizations"
  ON submito_organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Organization owners can update their organizations"
  ON submito_organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id 
      FROM submito_organization_users 
      WHERE user_id = auth.uid() AND is_owner = true
    )
  );

-- RLS Policies for submito_organization_users
CREATE POLICY "Users can view members of their organizations"
  ON submito_organization_users FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM submito_organization_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners can manage members"
  ON submito_organization_users FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM submito_organization_users 
      WHERE user_id = auth.uid() AND is_owner = true
    )
  );

-- Create indexes for performance
CREATE INDEX idx_submito_orgs_slug ON submito_organizations(slug);
CREATE INDEX idx_submito_orgs_subdomain ON submito_organizations(subdomain);
CREATE INDEX idx_submito_org_users_org_id ON submito_organization_users(organization_id);
CREATE INDEX idx_submito_org_users_user_id ON submito_organization_users(user_id);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_submito_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_submito_organizations_updated_at
  BEFORE UPDATE ON submito_organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_submito_updated_at_column();

CREATE TRIGGER update_submito_organization_users_updated_at
  BEFORE UPDATE ON submito_organization_users
  FOR EACH ROW
  EXECUTE FUNCTION update_submito_updated_at_column();