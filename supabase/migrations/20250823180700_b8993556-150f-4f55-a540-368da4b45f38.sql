-- Seed data for testing student projects functionality

-- Create test classes
INSERT INTO public.classes (id, code, title, description) VALUES 
(1, 'WEBDEV101', 'Développement Web Fondamental', 'Introduction au développement web avec HTML, CSS et JavaScript'),
(2, 'REACT201', 'React Avancé', 'Maîtrise de React avec hooks, context et patterns avancés'),
(3, 'NODEJS301', 'Node.js Backend', 'Développement backend avec Node.js et Express')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Create test projects
INSERT INTO public.projects (id, code, title, description, due_at) VALUES 
(1, 'P001', 'Site Portfolio', 'Créer un site portfolio personnel responsive', '2025-09-15 23:59:59+00'),
(2, 'P002', 'API REST', 'Développer une API REST avec authentification', '2025-09-30 23:59:59+00'),
(3, 'P003', 'App React', 'Application React avec gestion d''état complexe', '2025-10-15 23:59:59+00'),
(4, 'P004', 'Base de données', 'Conception et implémentation d''une base de données', '2025-10-31 23:59:59+00')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  due_at = EXCLUDED.due_at;

-- Assign projects to classes
INSERT INTO public.class_projects (class_id, project_id) VALUES 
(1, 1), -- WEBDEV101 -> Site Portfolio
(1, 2), -- WEBDEV101 -> API REST
(2, 3), -- REACT201 -> App React
(2, 4), -- REACT201 -> Base de données
(3, 2), -- NODEJS301 -> API REST
(3, 4)  -- NODEJS301 -> Base de données
ON CONFLICT DO NOTHING;

-- Create test students (without auth users since we can't create them in migration)
-- These will be created manually or via the app

-- For user_prof@exemple.com (will have classes and projects)
-- Student ID will be created when user signs up

-- For user_sans_projet@exemple.com (will have no projects)
-- Student ID will be created when user signs up but no enrollments

-- Note: Enrollments will be added via a separate script since we need actual user IDs