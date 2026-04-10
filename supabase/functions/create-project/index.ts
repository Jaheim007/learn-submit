import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface CreateProjectRequest {
  title: string;
  description?: string;
  deadline_at?: string;
  allow_resubmit?: boolean;
  max_resubmits?: number;
  is_active?: boolean;
  class_ids: number[];
  image_url?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the user from the request
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Verify user is admin or supervisor
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some(r => r.role === 'admin');
    const isSupervisor = userRoles?.some(r => r.role === 'supervisor');
    
    if (!isAdmin && !isSupervisor) {
      return new Response(
        JSON.stringify({ error: 'Accès admin ou formateur requis' }),
        { status: 403, headers: corsHeaders }
      );
    }

    // If supervisor, verify they're only assigning to their own classes
    if (isSupervisor && !isAdmin) {
      const body_check: CreateProjectRequest = await req.clone().json();
      const { data: assignments } = await supabase
        .from('supervisor_class_assignments')
        .select('class_id')
        .eq('supervisor_user_id', user.id);
      
      const assignedClassIds = new Set(assignments?.map(a => a.class_id) || []);
      const allAssigned = body_check.class_ids.every(id => assignedClassIds.has(id));
      
      if (!allAssigned) {
        return new Response(
          JSON.stringify({ error: 'Vous ne pouvez créer des projets que pour vos classes assignées' }),
          { status: 403, headers: corsHeaders }
        );
      }
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Méthode non autorisée' }),
        { status: 405, headers: corsHeaders }
      );
    }

    const body: CreateProjectRequest = await req.json();
    console.log('Creating project with data:', body);

    // Validation
    if (!body.title?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Le titre est requis' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!body.class_ids || body.class_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Au moins une classe doit être sélectionnée' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate deadline_at if provided
    let deadline_at = null;
    if (body.deadline_at) {
      deadline_at = new Date(body.deadline_at);
      if (isNaN(deadline_at.getTime())) {
        return new Response(
          JSON.stringify({ error: 'Format de date limite invalide' }),
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // Generate project code
    const projectCode = body.title.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10) + 
                       Math.random().toString(36).substring(2, 6).toUpperCase();

    // Start transaction
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        code: projectCode,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        deadline_at: deadline_at?.toISOString() || null,
        allow_resubmit: body.allow_resubmit || false,
        max_resubmits: body.max_resubmits || 1,
        is_active: body.is_active !== false, // default true
        image_url: body.image_url?.trim() || null
      })
      .select()
      .single();

    if (projectError) {
      console.error('Error creating project:', projectError);
      return new Response(
        JSON.stringify({ error: `Erreur création projet: ${projectError.message}` }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('Project created:', project);

    // Insert class associations
    const classProjectsData = body.class_ids.map(classId => ({
      class_id: classId,
      project_id: project.id
    }));

    const { error: classProjectsError } = await supabase
      .from('class_projects')
      .insert(classProjectsData);

    if (classProjectsError) {
      console.error('Error linking classes to project:', classProjectsError);
      
      // Rollback: delete the project
      await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);

      return new Response(
        JSON.stringify({ error: `Erreur liaison classes: ${classProjectsError.message}` }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('Project created successfully with ID:', project.id);

    return new Response(
      JSON.stringify({ 
        id: project.id, 
        code: project.code,
        message: 'Projet créé avec succès' 
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: `Erreur inattendue: ${error.message}` }),
      { status: 500, headers: corsHeaders }
    );
  }
});