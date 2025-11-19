-- Create organization-scoped students table
CREATE TABLE IF NOT EXISTS public.submito_organization_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.submito_organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, active, rejected
  enrolled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organization_id, email)
);

-- Create organization-scoped courses table
CREATE TABLE IF NOT EXISTS public.submito_organization_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.submito_organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organization_id, code)
);

-- Create organization-scoped submissions table
CREATE TABLE IF NOT EXISTS public.submito_organization_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.submito_organizations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.submito_organization_students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.submito_organization_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  grade NUMERIC,
  feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.submito_organization_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submito_organization_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submito_organization_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for students
CREATE POLICY "Organization members can view their org students"
  ON public.submito_organization_students FOR SELECT
  USING (is_member_of_org(organization_id));

CREATE POLICY "Organization owners can manage students"
  ON public.submito_organization_students FOR ALL
  USING (is_organization_owner(organization_id, auth.uid()))
  WITH CHECK (is_organization_owner(organization_id, auth.uid()));

-- RLS Policies for courses
CREATE POLICY "Organization members can view their org courses"
  ON public.submito_organization_courses FOR SELECT
  USING (is_member_of_org(organization_id));

CREATE POLICY "Organization owners can manage courses"
  ON public.submito_organization_courses FOR ALL
  USING (is_organization_owner(organization_id, auth.uid()))
  WITH CHECK (is_organization_owner(organization_id, auth.uid()));

-- RLS Policies for submissions
CREATE POLICY "Organization members can view their org submissions"
  ON public.submito_organization_submissions FOR SELECT
  USING (is_member_of_org(organization_id));

CREATE POLICY "Organization owners can manage submissions"
  ON public.submito_organization_submissions FOR ALL
  USING (is_organization_owner(organization_id, auth.uid()))
  WITH CHECK (is_organization_owner(organization_id, auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_submito_organization_students_updated_at
  BEFORE UPDATE ON public.submito_organization_students
  FOR EACH ROW EXECUTE FUNCTION public.update_submito_updated_at_column();

CREATE TRIGGER update_submito_organization_courses_updated_at
  BEFORE UPDATE ON public.submito_organization_courses
  FOR EACH ROW EXECUTE FUNCTION public.update_submito_updated_at_column();

CREATE TRIGGER update_submito_organization_submissions_updated_at
  BEFORE UPDATE ON public.submito_organization_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_submito_updated_at_column();