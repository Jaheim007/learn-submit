import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { target_user_id, role, delete_account } = await req.json();

    if (!target_user_id || !role) {
      return new Response(JSON.stringify({ error: 'target_user_id and role are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify caller is admin
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Check caller is admin
    const { data: callerRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!callerRoles) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Prevent self-deletion
    if (target_user_id === user.id) {
      return new Response(JSON.stringify({ error: 'Cannot remove your own role' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Prevent deleting or demoting the last admin account
    const { data: targetAdminRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', target_user_id)
      .eq('role', 'admin')
      .maybeSingle();

    if (targetAdminRole && (delete_account || role === 'admin')) {
      const { count: adminCount, error: adminCountError } = await supabaseAdmin
        .from('user_roles')
        .select('user_id', { count: 'exact', head: true })
        .eq('role', 'admin');

      if (adminCountError) {
        console.error('Error counting admins:', adminCountError);
        return new Response(JSON.stringify({ error: 'Failed to validate admin safety check' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if ((adminCount ?? 0) <= 1) {
        return new Response(JSON.stringify({ error: 'Cannot remove the last admin account' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    if (delete_account) {
      // Full account deletion: remove all related data then the auth user
      console.log(`Full account deletion for user: ${target_user_id}`);

      // Delete student-related data
      await supabaseAdmin.from('class_enrollments').delete().eq('user_id', target_user_id);
      
      // Get student id first for enrollment cleanup
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('user_id', target_user_id)
        .maybeSingle();
      
      if (student) {
        await supabaseAdmin.from('enrollments').delete().eq('student_id', student.id);
        await supabaseAdmin.from('students').delete().eq('user_id', target_user_id);
      }

      // Delete supervisor data
      await supabaseAdmin.from('supervisor_class_assignments').delete().eq('supervisor_user_id', target_user_id);
      await supabaseAdmin.from('supervisors').delete().eq('user_id', target_user_id);

      // Delete admin data
      await supabaseAdmin.from('admins').delete().eq('user_id', target_user_id);

      // Delete all roles
      await supabaseAdmin.from('user_roles').delete().eq('user_id', target_user_id);

      // Delete profile
      await supabaseAdmin.from('profiles').delete().eq('id', target_user_id);

      // Delete notifications
      await supabaseAdmin.from('notifications').delete().eq('user_id', target_user_id);

      // Delete FCM tokens
      await supabaseAdmin.from('fcm_tokens').delete().eq('user_id', target_user_id);

      // Finally delete auth user
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(target_user_id);
      if (deleteAuthError) {
        console.error('Error deleting auth user:', deleteAuthError);
        return new Response(JSON.stringify({ error: 'Failed to delete auth user: ' + deleteAuthError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`Account fully deleted for user: ${target_user_id}`);
    } else {
      // Just remove the specific role
      const { error: deleteError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', target_user_id)
        .eq('role', role);

      if (deleteError) {
        console.error('Error deleting role:', deleteError);
        return new Response(JSON.stringify({ error: 'Failed to delete role' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Clean up role-specific data
      if (role === 'supervisor') {
        await supabaseAdmin.from('supervisor_class_assignments').delete().eq('supervisor_user_id', target_user_id);
        await supabaseAdmin.from('supervisors').delete().eq('user_id', target_user_id);
      }

      if (role === 'academy' || role === 'admin') {
        await supabaseAdmin.from('admins').delete().eq('user_id', target_user_id);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
