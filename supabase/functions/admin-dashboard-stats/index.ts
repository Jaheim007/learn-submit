import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Check admin role
    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id).in('role', ['admin', 'academy']);
    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const today = new Date().toISOString().split('T')[0];
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Parallel queries
    const [
      activeStudents, pendingStudents, submissionsToday, pendingReviews,
      upcomingDeadlines, activeClasses, allSubmissions, recentSubs, recentProjs,
      topClasses
    ] = await Promise.all([
      supabase.from('students').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('students').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('submissions').select('id', { count: 'exact', head: true }).gte('submitted_at', today + 'T00:00:00'),
      supabase.from('submissions').select('id', { count: 'exact', head: true }).in('status', ['Reçu', 'En révision']),
      supabase.from('projects').select('id', { count: 'exact', head: true }).gte('deadline_at', new Date().toISOString()).lte('deadline_at', weekFromNow),
      supabase.from('classes').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('submissions').select('status'),
      supabase.from('submissions')
        .select('id, submitted_at, status, students!inner(full_name), projects!inner(title), classes!inner(code)')
        .order('submitted_at', { ascending: false }).limit(8),
      supabase.from('projects')
        .select('id, title, deadline_at, class_projects!inner(classes!inner(code))')
        .order('created_at', { ascending: false }).limit(4),
      supabase.from('classes')
        .select('id, code, title')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(6),
    ]);

    // Build status distribution
    const statusDist: Record<string, number> = {};
    if (allSubmissions.data) {
      for (const s of allSubmissions.data) {
        const status = s.status || 'unknown';
        const normalized = status === 'received' ? 'Reçu' : status === 'in_review' ? 'En révision' : status === 'approved' ? 'Validé' : status === 'rejected' ? 'Refusé' : status;
        statusDist[normalized] = (statusDist[normalized] || 0) + 1;
      }
    }

    // Get enrollment counts for top classes
    const classesWithCounts = [];
    if (topClasses.data) {
      for (const c of topClasses.data) {
        const { count: sc } = await supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('class_id', c.id);
        const { count: subc } = await supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('class_id', c.id);
        classesWithCounts.push({ code: c.code, title: c.title, students: sc || 0, submissions: subc || 0 });
      }
    }

    // Format recent submissions
    const formattedSubs = recentSubs.data?.map((sub: any) => ({
      id: sub.id, submitted_at: sub.submitted_at, status: sub.status,
      student_name: sub.students?.full_name, project_title: sub.projects?.title, class_code: sub.classes?.code,
    })) || [];

    // Format recent projects
    const formattedProjs = recentProjs.data?.map((proj: any) => ({
      id: proj.id, title: proj.title, deadline_at: proj.deadline_at,
      class_codes: proj.class_projects?.map((cp: any) => cp.classes?.code).filter(Boolean) || [],
    })) || [];

    const result = {
      stats: {
        activeStudents: activeStudents.count || 0,
        pendingStudents: pendingStudents.count || 0,
        submissionsToday: submissionsToday.count || 0,
        pendingReviews: pendingReviews.count || 0,
        upcomingDeadlines: upcomingDeadlines.count || 0,
        activeClasses: activeClasses.count || 0,
      },
      statusDistribution: statusDist,
      topClasses: classesWithCounts,
      recentSubmissions: formattedSubs,
      recentProjects: formattedProjs,
    };

    return new Response(JSON.stringify(result), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
