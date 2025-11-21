-- Create submito_organization_projects table
CREATE TABLE IF NOT EXISTS public.submito_organization_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.submito_organizations(id) ON DELETE CASCADE,
  code text NOT NULL,
  title text NOT NULL,
  description text,
  image_url text,
  deadline_at timestamp with time zone,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create submito_project_resources table for file attachments
CREATE TABLE IF NOT EXISTS public.submito_project_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.submito_organization_projects(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size bigint,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Create submito_project_class_assignments table to assign projects to classes
CREATE TABLE IF NOT EXISTS public.submito_project_class_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.submito_organization_projects(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.submito_organization_classes(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(project_id, class_id)
);

-- Add RLS policies for submito_organization_projects
ALTER TABLE public.submito_organization_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view their org projects"
  ON public.submito_organization_projects
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.submito_organization_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can create projects"
  ON public.submito_organization_projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.submito_organization_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can update their org projects"
  ON public.submito_organization_projects
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.submito_organization_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can delete their org projects"
  ON public.submito_organization_projects
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.submito_organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Add RLS policies for submito_project_resources
ALTER TABLE public.submito_project_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view project resources"
  ON public.submito_project_resources
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM public.submito_organization_projects
      WHERE organization_id IN (
        SELECT organization_id FROM public.submito_organization_users
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Organization members can create project resources"
  ON public.submito_project_resources
  FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.submito_organization_projects
      WHERE organization_id IN (
        SELECT organization_id FROM public.submito_organization_users
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Organization members can delete project resources"
  ON public.submito_project_resources
  FOR DELETE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM public.submito_organization_projects
      WHERE organization_id IN (
        SELECT organization_id FROM public.submito_organization_users
        WHERE user_id = auth.uid()
      )
    )
  );

-- Add RLS policies for submito_project_class_assignments
ALTER TABLE public.submito_project_class_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view project class assignments"
  ON public.submito_project_class_assignments
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM public.submito_organization_projects
      WHERE organization_id IN (
        SELECT organization_id FROM public.submito_organization_users
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Organization members can manage project class assignments"
  ON public.submito_project_class_assignments
  FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM public.submito_organization_projects
      WHERE organization_id IN (
        SELECT organization_id FROM public.submito_organization_users
        WHERE user_id = auth.uid()
      )
    )
  );

-- Create storage bucket for project images
INSERT INTO storage.buckets (id, name, public)
VALUES ('submito-project-images', 'submito-project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for project resources
INSERT INTO storage.buckets (id, name, public)
VALUES ('submito-project-resources', 'submito-project-resources', false)
ON CONFLICT (id) DO NOTHING;

-- Add storage policies for project images
CREATE POLICY "Organization members can upload project images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'submito-project-images' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Anyone can view project images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'submito-project-images');

-- Add storage policies for project resources
CREATE POLICY "Organization members can upload project resources"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'submito-project-resources' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Organization members can view project resources"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'submito-project-resources' AND
    auth.uid() IS NOT NULL
  );

-- Add updated_at trigger
CREATE TRIGGER set_submito_organization_projects_updated_at
  BEFORE UPDATE ON public.submito_organization_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_submito_updated_at_column();