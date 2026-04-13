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
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: callerRoles } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .eq('role', 'admin');
    
    if (!callerRoles || callerRoles.length === 0) {
      return new Response(JSON.stringify({ error: 'Super Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get caller profile for audit log
    const { data: callerProfile } = await adminClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', caller.id)
      .single();

    const { user_id, role, class_ids = [], action } = await req.json();

    if (!user_id || !action) {
      return new Response(JSON.stringify({ error: 'user_id and action are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', user_id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Helper to write audit log
    const logActivity = async (logAction: string, entityType: string, details: Record<string, unknown>) => {
      try {
        await adminClient.from('activity_logs').insert({
          action: logAction,
          entity_type: entityType,
          entity_id: user_id,
          user_id: caller.id,
          user_name: callerProfile?.full_name || callerProfile?.email || 'Admin',
          user_email: callerProfile?.email,
          details,
        });
      } catch (e) {
        console.warn('Activity log write failed:', e);
      }
    };

    // ===== REJECT =====
    if (action === 'reject') {
      const { data: existingStudent } = await adminClient
        .from('students')
        .select('id')
        .eq('user_id', user_id)
        .maybeSingle();

      if (existingStudent) {
        await adminClient.from('students').update({ status: 'rejected', is_active: false }).eq('user_id', user_id);
      }

      await logActivity('student_status_changed', 'student', {
        student: profile.full_name || profile.email,
        email: profile.email,
        old_status: 'pending',
        new_status: 'rejected',
        approved_by: callerProfile?.full_name || callerProfile?.email,
      });

      console.log(`User ${user_id} (${profile.email}) rejected by ${callerProfile?.email}`);
      return new Response(JSON.stringify({ success: true, message: 'User rejected' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ===== APPROVE =====
    if (action !== 'approve' || !role) {
      return new Response(JSON.stringify({ error: 'For approve action, role is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const validRoles = ['student', 'teacher', 'academy'];
    if (!validRoles.includes(role)) {
      return new Response(JSON.stringify({ error: `Invalid role. Must be: ${validRoles.join(', ')}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const dbRole = role === 'teacher' ? 'supervisor' : role;

    await adminClient.from('user_roles').delete().eq('user_id', user_id);

    const { error: roleError } = await adminClient
      .from('user_roles')
      .insert({ user_id, role: dbRole });

    if (roleError) {
      console.error('Role assignment error:', roleError);
      return new Response(JSON.stringify({ error: `Failed to assign role: ${roleError.message}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ===== ROLE-SPECIFIC SETUP =====

    if (role === 'student') {
      await adminClient.from('students').delete().eq('user_id', user_id);

      const { data: student, error: studentError } = await adminClient
        .from('students')
        .insert({
          user_id,
          email: profile.email,
          full_name: profile.full_name,
          status: 'active',
          is_active: true,
          primary_class_id: class_ids.length > 0 ? class_ids[0] : null,
        })
        .select()
        .single();

      if (studentError) {
        console.error('Student creation error:', studentError);
        return new Response(JSON.stringify({ error: `Student creation failed: ${studentError.message}` }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (class_ids.length > 0 && student) {
        const enrollments = class_ids.map((classId: number) => ({
          student_id: student.id,
          class_id: classId,
        }));
        const { error: enrollError } = await adminClient.from('enrollments').insert(enrollments);
        if (enrollError) console.error('Enrollment error:', enrollError);
      }

      // Get class names for the log
      let classNames: string[] = [];
      if (class_ids.length > 0) {
        const { data: classes } = await adminClient.from('classes').select('title').in('id', class_ids);
        classNames = (classes || []).map((c: { title: string }) => c.title);
      }

      await logActivity('student_status_changed', 'student', {
        student: profile.full_name || profile.email,
        email: profile.email,
        old_status: 'pending',
        new_status: 'active',
        role: 'student',
        classes: classNames.join(', '),
        approved_by: callerProfile?.full_name || callerProfile?.email,
      });

      console.log(`User ${user_id} approved as STUDENT by ${callerProfile?.email}`);
    }

    if (role === 'teacher') {
      await adminClient.from('supervisor_class_assignments').delete().eq('supervisor_user_id', user_id);
      
      if (class_ids.length > 0) {
        const assignments = class_ids.map((classId: number) => ({
          supervisor_user_id: user_id,
          class_id: classId,
        }));
        const { error: assignError } = await adminClient.from('supervisor_class_assignments').insert(assignments);
        if (assignError) console.error('Assignment error:', assignError);
      }

      await logActivity('student_status_changed', 'student', {
        student: profile.full_name || profile.email,
        email: profile.email,
        old_status: 'pending',
        new_status: 'active',
        role: 'teacher',
        approved_by: callerProfile?.full_name || callerProfile?.email,
      });

      console.log(`User ${user_id} approved as TEACHER by ${callerProfile?.email}`);
    }

    if (role === 'academy') {
      await logActivity('student_status_changed', 'student', {
        student: profile.full_name || profile.email,
        email: profile.email,
        old_status: 'pending',
        new_status: 'active',
        role: 'academy',
        approved_by: callerProfile?.full_name || callerProfile?.email,
      });

      console.log(`User ${user_id} approved as ACADEMY by ${callerProfile?.email}`);
    }

    // Send notification
    try {
      await adminClient.from('notifications').insert({
        user_id,
        type: 'account_approved',
        title: 'Compte approuvé ✅',
        body: `Votre compte a été approuvé en tant que ${role === 'student' ? 'Étudiant' : role === 'teacher' ? 'Formateur' : 'Academy'}. Vous pouvez maintenant accéder à la plateforme.`,
      });
    } catch (e) {
      console.warn('Notification error:', e);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `User approved as ${role}`,
      role: dbRole,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: `Unexpected error: ${error.message}` }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
