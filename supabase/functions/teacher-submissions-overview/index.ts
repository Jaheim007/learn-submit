import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error: authError } = await callerClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roles, error: rolesError } = await serviceClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['supervisor', 'teacher']);

    if (rolesError || !roles?.length) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: assignments, error: assignmentsError } = await serviceClient
      .from('supervisor_class_assignments')
      .select('class_id')
      .eq('supervisor_user_id', user.id);

    if (assignmentsError) {
      throw assignmentsError;
    }

    const classIds = (assignments ?? []).map((assignment) => assignment.class_id);

    if (!classIds.length) {
      return new Response(JSON.stringify({ submissions: [], classes: [], projects: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const [{ data: classes, error: classesError }, { data: submissions, error: submissionsError }] = await Promise.all([
      serviceClient
        .from('classes')
        .select('id, code, title')
        .in('id', classIds)
        .order('code'),
      serviceClient
        .from('submissions')
        .select('id, class_id, project_id, student_id, status, grade, submitted_at, link1, link2, link3, file1_url, file2_url, file3_url, file_urls, description, feedback')
        .in('class_id', classIds)
        .order('submitted_at', { ascending: false }),
    ]);

    if (classesError || submissionsError) {
      throw classesError || submissionsError;
    }

    const studentIds = [...new Set((submissions ?? []).map((submission) => submission.student_id))];
    const projectIds = [...new Set((submissions ?? []).map((submission) => submission.project_id))];

    const [{ data: students, error: studentsError }, { data: projects, error: projectsError }] = await Promise.all([
      studentIds.length
        ? serviceClient
            .from('students')
            .select('id, full_name, email, phone, whatsapp, telegram, github_profile')
            .in('id', studentIds)
        : Promise.resolve({ data: [], error: null }),
      projectIds.length
        ? serviceClient
            .from('projects')
            .select('id, code, title')
            .in('id', projectIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (studentsError || projectsError) {
      throw studentsError || projectsError;
    }

    const classMap = new Map((classes ?? []).map((classe) => [classe.id, classe]));
    const studentMap = new Map((students ?? []).map((student) => [student.id, student]));
    const projectMap = new Map((projects ?? []).map((project) => [project.id, project]));

    const formattedSubmissions = (submissions ?? []).map((submission) => ({
      ...submission,
      student: studentMap.get(submission.student_id) ?? {
        full_name: 'Étudiant inconnu',
        email: '',
        phone: '',
        whatsapp: '',
        telegram: '',
        github_profile: '',
      },
      class: classMap.get(submission.class_id) ?? { code: '', title: '' },
      project: projectMap.get(submission.project_id) ?? { code: '', title: '' },
    }));

    return new Response(JSON.stringify({ submissions: formattedSubmissions, classes: classes ?? [], projects: projects ?? [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('teacher-submissions-overview error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});