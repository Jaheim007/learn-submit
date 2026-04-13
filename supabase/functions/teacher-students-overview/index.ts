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
      return new Response(JSON.stringify({ students: [], classes: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const [{ data: classes, error: classesError }, { data: enrollments, error: enrollmentsError }] = await Promise.all([
      serviceClient
        .from('classes')
        .select('id, code, title')
        .in('id', classIds)
        .order('code'),
      serviceClient
        .from('enrollments')
        .select('student_id, class_id')
        .in('class_id', classIds),
    ]);

    if (classesError || enrollmentsError) {
      throw classesError || enrollmentsError;
    }

    const studentIds = [...new Set((enrollments ?? []).map((enrollment) => enrollment.student_id))];

    if (!studentIds.length) {
      return new Response(JSON.stringify({ students: [], classes: classes ?? [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: students, error: studentsError } = await serviceClient
      .from('students')
      .select('id, full_name, email, phone, whatsapp, github_profile, avatar_url')
      .in('id', studentIds);

    if (studentsError) {
      throw studentsError;
    }

    const classMap = new Map((classes ?? []).map((classe) => [classe.id, classe]));
    const studentMap = new Map((students ?? []).map((student) => [student.id, student]));

    const list = (enrollments ?? [])
      .map((enrollment) => {
        const student = studentMap.get(enrollment.student_id);
        const classe = classMap.get(enrollment.class_id);

        if (!student || !classe) return null;

        return {
          id: student.id,
          full_name: student.full_name || 'Sans nom',
          email: student.email || '',
          phone: student.phone || '',
          whatsapp: student.whatsapp || '',
          github_profile: student.github_profile || '',
          avatar_url: student.avatar_url || null,
          className: classe.title || '',
          classCode: classe.code || '',
        };
      })
      .filter(Boolean);

    const seen = new Set<string>();
    const unique = list.filter((student: any) => {
      const key = `${student.id}-${student.classCode}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return new Response(JSON.stringify({ students: unique, classes: classes ?? [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('teacher-students-overview error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});