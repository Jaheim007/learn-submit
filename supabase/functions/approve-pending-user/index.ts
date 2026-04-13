import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// This function approves a pending user by assigning them a role
// Only Super Admins can call this
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

    // Verify caller is admin
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

    // Check caller is admin
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

    const { user_id, role, class_ids = [], action } = await req.json();

    if (!user_id || !action) {
      return new Response(JSON.stringify({ error: 'user_id and action are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get profile
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

    // ===== REJECT =====
    if (action === 'reject') {
      // Remove existing student record if any
      const { data: existingStudent } = await adminClient
        .from('students')
        .select('id')
        .eq('user_id', user_id)
        .maybeSingle();

      if (existingStudent) {
        await adminClient.from('students').update({ status: 'rejected', is_active: false }).eq('user_id', user_id);
      }

      // Don't assign any role — user stays in limbo
      console.log(`User ${user_id} (${profile.email}) rejected`);
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

    // Map frontend role names to DB role names
    const dbRole = role === 'teacher' ? 'supervisor' : role;

    // Remove any existing roles (clean slate)
    await adminClient.from('user_roles').delete().eq('user_id', user_id);

    // Assign the new role
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
      // Remove any existing student record
      await adminClient.from('students').delete().eq('user_id', user_id);

      // Create active student record
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

      // Create enrollments
      if (class_ids.length > 0 && student) {
        const enrollments = class_ids.map((classId: number) => ({
          student_id: student.id,
          class_id: classId,
        }));
        const { error: enrollError } = await adminClient.from('enrollments').insert(enrollments);
        if (enrollError) console.error('Enrollment error:', enrollError);
      }

      console.log(`User ${user_id} approved as STUDENT in ${class_ids.length} class(es)`);
    }

    if (role === 'teacher') {
      // Create supervisor class assignments
      await adminClient.from('supervisor_class_assignments').delete().eq('supervisor_user_id', user_id);
      
      if (class_ids.length > 0) {
        const assignments = class_ids.map((classId: number) => ({
          supervisor_user_id: user_id,
          class_id: classId,
        }));
        const { error: assignError } = await adminClient.from('supervisor_class_assignments').insert(assignments);
        if (assignError) console.error('Assignment error:', assignError);
      }

      console.log(`User ${user_id} approved as TEACHER for ${class_ids.length} class(es)`);
    }

    if (role === 'academy') {
      console.log(`User ${user_id} approved as ACADEMY`);
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
