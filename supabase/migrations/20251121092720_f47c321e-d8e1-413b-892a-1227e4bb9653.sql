-- Create organization classes table
CREATE TABLE IF NOT EXISTS public.submito_organization_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.submito_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, code)
);

-- Add class_id to students table
ALTER TABLE public.submito_organization_students
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.submito_organization_classes(id) ON DELETE SET NULL;

-- Create junction table for classes and courses
CREATE TABLE IF NOT EXISTS public.submito_organization_class_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.submito_organization_classes(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.submito_organization_courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_id, course_id)
);

-- Enable RLS
ALTER TABLE public.submito_organization_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submito_organization_class_courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization classes
CREATE POLICY "Organization members can view classes"
ON public.submito_organization_classes
FOR SELECT
USING (
  is_member_of_org(organization_id)
);

CREATE POLICY "Organization owners can manage classes"
ON public.submito_organization_classes
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.submito_organization_users
    WHERE organization_id = submito_organization_classes.organization_id
      AND user_id = auth.uid()
      AND (is_owner = true OR role IN ('owner', 'admin'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.submito_organization_users
    WHERE organization_id = submito_organization_classes.organization_id
      AND user_id = auth.uid()
      AND (is_owner = true OR role IN ('owner', 'admin'))
  )
);

-- RLS Policies for class courses junction
CREATE POLICY "Organization members can view class courses"
ON public.submito_organization_class_courses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.submito_organization_classes c
    WHERE c.id = class_id AND is_member_of_org(c.organization_id)
  )
);

CREATE POLICY "Organization owners can manage class courses"
ON public.submito_organization_class_courses
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.submito_organization_classes c
    JOIN public.submito_organization_users u ON u.organization_id = c.organization_id
    WHERE c.id = class_id
      AND u.user_id = auth.uid()
      AND (u.is_owner = true OR u.role IN ('owner', 'admin'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.submito_organization_classes c
    JOIN public.submito_organization_users u ON u.organization_id = c.organization_id
    WHERE c.id = class_id
      AND u.user_id = auth.uid()
      AND (u.is_owner = true OR u.role IN ('owner', 'admin'))
  )
);

-- Update RLS for students to include class filtering
CREATE POLICY "Students can view their class courses"
ON public.submito_organization_courses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.submito_organization_students s
    JOIN public.submito_organization_class_courses cc ON cc.class_id = s.class_id
    WHERE s.user_id = auth.uid()
      AND cc.course_id = submito_organization_courses.id
  )
);

-- Create updated_at trigger
CREATE TRIGGER set_updated_at_organization_classes
BEFORE UPDATE ON public.submito_organization_classes
FOR EACH ROW
EXECUTE FUNCTION public.update_submito_updated_at_column();