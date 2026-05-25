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
      .in('role', ['admin', 'academy']);

    if (rolesError || !roles?.length) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const [{ data: students, error: studentsError }, { data: classes, error: classesError }] = await Promise.all([
      serviceClient
        .from('students')
        .select('id, user_id, full_name, email, is_active, status, created_at, phone, whatsapp, telegram, github_profile, avatar_url')
        .order('created_at', { ascending: false }),
      serviceClient
        .from('classes')
        .select('id, code, title')
        .order('code'),
    ]);

    if (studentsError || classesError) {
      throw studentsError || classesError;
    }

    const studentIds = (students ?? []).map((student) => student.id);

    if (!studentIds.length) {
      return new Response(JSON.stringify({ students: [], classes: classes ?? [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const [{ data: enrollments, error: enrollmentsError }, { data: submissions, error: submissionsError }] = await Promise.all([
      serviceClient
        .from('enrollments')
        .select('student_id, class_id'),
      serviceClient
        .from('submissions')
        .select('student_id'),
    ]);

    if (enrollmentsError || submissionsError) {
      throw enrollmentsError || submissionsError;
    }

    const classMap = new Map((classes ?? []).map((classe) => [classe.id, { code: classe.code, title: classe.title, id: classe.id }]));
    const submissionCounts = (submissions ?? []).reduce<Record<string, number>>((acc, submission) => {
      acc[submission.student_id] = (acc[submission.student_id] || 0) + 1;
      return acc;
    }, {});

    const enrollmentsByStudent = (enrollments ?? []).reduce<Record<string, Array<{ id: number; code: string; title: string }>>>((acc, enrollment) => {
      const classe = classMap.get(enrollment.class_id);
      if (!classe) return acc;
      if (!acc[enrollment.student_id]) {
        acc[enrollment.student_id] = [];
      }
      acc[enrollment.student_id].push(classe);
      return acc;
    }, {});

    const payload = (students ?? []).map((student) => ({
      ...student,
      classes: enrollmentsByStudent[student.id] ?? [],
      submissions_count: submissionCounts[student.id] ?? 0,
    }));

    return new Response(JSON.stringify({ students: payload, classes: classes ?? [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('admin-students-overview error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});