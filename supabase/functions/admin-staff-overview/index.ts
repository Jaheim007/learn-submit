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
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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

    // Verify caller is admin
    const { data: { user }, error: authError } = await callerClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: callerRoles } = await serviceClient
      .from('user_roles').select('role').eq('user_id', user.id).in('role', ['admin']);
    if (!callerRoles?.length) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all staff roles - only those relevant to hacktualiz
    const { data: staffRoles, error: rolesError } = await serviceClient
      .from('user_roles').select('user_id, role, platform')
      .in('role', ['admin', 'academy', 'supervisor'])
      .in('platform', ['hacktualiz', 'both']);
    if (rolesError) throw rolesError;

    const uniqueUserIds = [...new Set((staffRoles || []).map(r => r.user_id))];

    // Get user info from profiles first
    const userInfoMap = new Map<string, { email: string; full_name: string; created_at: string }>();

    const { data: profiles } = await serviceClient
      .from('profiles').select('id, full_name, email, created_at').in('id', uniqueUserIds);
    (profiles || []).forEach(p => {
      userInfoMap.set(p.id, { email: p.email, full_name: p.full_name || '', created_at: p.created_at });
    });

    // For users without profiles, fetch from auth.users
    const missingIds = uniqueUserIds.filter(id => !userInfoMap.has(id));
    for (const uid of missingIds) {
      const { data: { user: authUser } } = await serviceClient.auth.admin.getUserById(uid);
      if (authUser) {
        userInfoMap.set(uid, {
          email: authUser.email || '',
          full_name: authUser.user_metadata?.full_name || '',
          created_at: authUser.created_at,
        });
      }
    }

    // Get supervisor class assignments
    const supervisorIds = (staffRoles || []).filter(r => r.role === 'supervisor').map(r => r.user_id);
    let assignments: any[] = [];
    if (supervisorIds.length > 0) {
      const { data } = await serviceClient
        .from('supervisor_class_assignments').select('supervisor_user_id, class_id').in('supervisor_user_id', supervisorIds);
      assignments = data || [];
    }

    // Get classes
    const { data: classes } = await serviceClient
      .from('classes').select('id, code, title').eq('is_active', true).order('code');

    const classMap = new Map((classes || []).map(c => [c.id, c]));

    // Build response
    const supervisors = supervisorIds.map(uid => {
      const info = userInfoMap.get(uid);
      const assignedClasses = assignments
        .filter(a => a.supervisor_user_id === uid)
        .map(a => classMap.get(a.class_id))
        .filter(Boolean);
      const userRoles = (staffRoles || []).filter(r => r.user_id === uid);
      return {
        user_id: uid,
        full_name: info?.full_name || '',
        email: info?.email || '',
        created_at: info?.created_at || '',
        role: 'supervisor',
        platform: userRoles.find(r => r.role === 'supervisor')?.platform || 'both',
        classes: assignedClasses,
      };
    });

    const adminAcademyRoles = (staffRoles || []).filter(r => r.role === 'admin' || r.role === 'academy');
    const adminMap = new Map<string, { roles: string[]; platforms: Record<string, string> }>();
    adminAcademyRoles.forEach(r => {
      const existing = adminMap.get(r.user_id) || { roles: [], platforms: {} };
      existing.roles.push(r.role);
      existing.platforms[r.role] = r.platform;
      adminMap.set(r.user_id, existing);
    });

    const admins = [...adminMap.entries()].map(([uid, data]) => {
      const info = userInfoMap.get(uid);
      const primaryRole = data.roles.includes('admin') ? 'admin' : 'academy';
      return {
        user_id: uid,
        full_name: info?.full_name || '',
        email: info?.email || '',
        created_at: info?.created_at || '',
        role: primaryRole,
        roles: data.roles,
        platforms: data.platforms,
      };
    });

    return new Response(JSON.stringify({ supervisors, admins, classes: classes || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('admin-staff-overview error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
