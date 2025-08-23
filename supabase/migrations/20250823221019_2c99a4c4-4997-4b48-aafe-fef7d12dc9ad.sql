-- A) Triggers pour synchroniser les rôles
CREATE OR REPLACE FUNCTION public.grant_admin_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$ 
BEGIN
  INSERT INTO public.user_roles(user_id, role) VALUES (NEW.user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.grant_supervisor_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$ 
BEGIN
  INSERT INTO public.user_roles(user_id, role) VALUES (NEW.user_id, 'supervisor')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END $$;

-- Supprimer les triggers existants s'ils existent
DROP TRIGGER IF EXISTS trg_admins_role ON public.admins;
DROP TRIGGER IF EXISTS trg_supervisors_role ON public.supervisors;

-- Créer les nouveaux triggers
CREATE TRIGGER trg_admins_role 
AFTER INSERT ON public.admins
FOR EACH ROW EXECUTE FUNCTION public.grant_admin_role();

CREATE TRIGGER trg_supervisors_role 
AFTER INSERT ON public.supervisors
FOR EACH ROW EXECUTE FUNCTION public.grant_supervisor_role();

-- B) RLS sur students : interdire aux admins/superviseurs d'insérer des lignes étudiants
DROP POLICY IF EXISTS "Students can insert their own profile" ON public.students;

CREATE POLICY "Students self-insert only (non-admin/supervisor)"
ON public.students FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND NOT public.is_admin()
  AND NOT public.is_supervisor()
);

-- C) Nettoyage des données - déplacer les admins existants hors de students
DO $$
DECLARE 
  r RECORD;
BEGIN
  -- Rechercher les comptes qui sont dans user_roles avec role='admin' mais aussi dans students
  FOR r IN
    SELECT DISTINCT s.user_id, s.email, s.full_name 
    FROM public.students s
    INNER JOIN public.user_roles ur ON s.user_id = ur.user_id
    WHERE ur.role = 'admin'
  LOOP
    -- Insérer dans admins s'il n'existe pas déjà
    INSERT INTO public.admins(user_id, full_name) 
    VALUES (r.user_id, r.full_name) 
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Supprimer de students
    DELETE FROM public.students WHERE user_id = r.user_id;
    
    RAISE NOTICE 'Moved admin user % from students to admins', r.email;
  END LOOP;
  
  -- Faire de même pour les superviseurs
  FOR r IN
    SELECT DISTINCT s.user_id, s.email, s.full_name 
    FROM public.students s
    INNER JOIN public.user_roles ur ON s.user_id = ur.user_id
    WHERE ur.role = 'supervisor'
  LOOP
    -- Insérer dans supervisors s'il n'existe pas déjà
    INSERT INTO public.supervisors(user_id, full_name) 
    VALUES (r.user_id, r.full_name) 
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Supprimer de students
    DELETE FROM public.students WHERE user_id = r.user_id;
    
    RAISE NOTICE 'Moved supervisor user % from students to supervisors', r.email;
  END LOOP;
END $$;