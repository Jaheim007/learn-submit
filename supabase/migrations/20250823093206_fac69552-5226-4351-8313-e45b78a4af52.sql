-- NYS Submissions Portal - Initial Schema Setup
-- Educational platform for managing student project submissions

-- Create custom types
CREATE TYPE public.submission_status AS ENUM ('Reçu', 'En révision', 'Validé', 'Refusé');

-- Students table - extends Supabase Auth users
CREATE TABLE public.students (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid UNIQUE NOT NULL, -- maps to auth.users.id
    full_name text,
    email text,
    phone text, -- personal phone number
    whatsapp text, -- WhatsApp number or wa.me link
    telegram text, -- @handle or user id
    github_profile text, -- GitHub profile URL
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Instructors table
CREATE TABLE public.instructors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name text NOT NULL,
    email text UNIQUE,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Classes table
CREATE TABLE public.classes (
    id bigserial PRIMARY KEY,
    code text UNIQUE NOT NULL, -- ex: C-2025-A, DEV-MATIN
    title text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Class instructors relationship (n:n)
CREATE TABLE public.class_instructors (
    id bigserial PRIMARY KEY,
    class_id bigint REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    instructor_id uuid REFERENCES public.instructors(id) ON DELETE CASCADE NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(class_id, instructor_id)
);

-- Student enrollments in classes (n:n)
CREATE TABLE public.enrollments (
    id bigserial PRIMARY KEY,
    class_id bigint REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(class_id, student_id)
);

-- Projects table
CREATE TABLE public.projects (
    id bigserial PRIMARY KEY,
    code text UNIQUE NOT NULL, -- ex: P1, P2, P3
    title text NOT NULL,
    description text,
    due_at timestamptz,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Project assignments to classes (n:n)
CREATE TABLE public.class_projects (
    id bigserial PRIMARY KEY,
    class_id bigint REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    project_id bigint REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(class_id, project_id)
);

-- Student submissions
CREATE TABLE public.submissions (
    id bigserial PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id bigint NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    project_id bigint NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    link1 text,
    link2 text,
    link3 text,
    file1_url text,
    file2_url text,
    file3_url text,
    description text,
    status submission_status DEFAULT 'Reçu' NOT NULL,
    submitted_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for submissions updated_at
CREATE TRIGGER update_submissions_updated_at
    BEFORE UPDATE ON public.submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.touch_updated_at();

-- Useful indexes for performance
CREATE INDEX idx_enrollments_student_class ON public.enrollments(student_id, class_id);
CREATE INDEX idx_class_projects_class_project ON public.class_projects(class_id, project_id);
CREATE INDEX idx_submissions_student_class_project ON public.submissions(student_id, class_id, project_id);
CREATE INDEX idx_submissions_submitted_at ON public.submissions(submitted_at DESC);
CREATE INDEX idx_submissions_status ON public.submissions(status);

-- Enable Row Level Security on all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Public read access for classes and projects (students need to see available options)
CREATE POLICY "Classes are publicly viewable" ON public.classes
    FOR SELECT USING (true);

CREATE POLICY "Projects are publicly viewable" ON public.projects
    FOR SELECT USING (true);

CREATE POLICY "Class projects are publicly viewable" ON public.class_projects
    FOR SELECT USING (true);

-- Students can only see and manage their own profile
CREATE POLICY "Students can view their own profile" ON public.students
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Students can update their own profile" ON public.students
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Students can insert their own profile" ON public.students
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Students can view their enrollments
CREATE POLICY "Students can view their enrollments" ON public.enrollments
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM public.students WHERE user_id = auth.uid()
        )
    );

-- Submissions policies - students can only access their own submissions for enrolled classes
CREATE POLICY "Students can view their own submissions" ON public.submissions
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM public.students WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Students can insert submissions for enrolled classes" ON public.submissions
    FOR INSERT WITH CHECK (
        student_id IN (
            SELECT id FROM public.students WHERE user_id = auth.uid()
        )
        AND class_id IN (
            SELECT e.class_id 
            FROM public.enrollments e
            JOIN public.students s ON s.id = e.student_id
            WHERE s.user_id = auth.uid()
        )
    );

CREATE POLICY "Students can update their own submissions" ON public.submissions
    FOR UPDATE USING (
        student_id IN (
            SELECT id FROM public.students WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        student_id IN (
            SELECT id FROM public.students WHERE user_id = auth.uid()
        )
    );

-- Create storage bucket for submissions
INSERT INTO storage.buckets (id, name, public) 
VALUES ('submissions', 'submissions', false);

-- Storage policies for submissions bucket
CREATE POLICY "Students can upload their own files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'submissions' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Students can view their own files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'submissions' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Seed data for development
INSERT INTO public.instructors (full_name, email) VALUES
    ('Prof. Marie Dubois', 'marie.dubois@nys.edu'),
    ('Dr. Jean Martin', 'jean.martin@nys.edu'),
    ('Mme Sarah Legrand', 'sarah.legrand@nys.edu');

INSERT INTO public.classes (code, title, description) VALUES
    ('C-2025-A', 'Promo 2025 – Matin', 'Formation développement web - session matinale'),
    ('C-2025-B', 'Promo 2025 – Soir', 'Formation développement web - session du soir');

INSERT INTO public.projects (code, title, description, due_at) VALUES
    ('P1', 'Site Vitrine IA', 'Créer un site vitrine pour une entreprise d''IA', now() + interval '2 weeks'),
    ('P2', 'Landing Page Événement', 'Page d''atterrissage pour un événement tech', now() + interval '3 weeks'),
    ('P3', 'E-commerce Local', 'Boutique en ligne pour commerce local', now() + interval '1 month');

-- Assign projects to classes
INSERT INTO public.class_projects (class_id, project_id) VALUES
    (1, 1), (1, 2), -- C-2025-A gets P1 and P2
    (2, 1), (2, 3); -- C-2025-B gets P1 and P3