import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
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
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { email, full_name, class_ids = [] } = await req.json();

    if (!email || !full_name) {
      return new Response(JSON.stringify({ error: 'Email and full_name are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Client with user's token to verify admin
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Service role client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify the current user is an admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid user token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user is admin
    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !adminRole) {
      return new Response(JSON.stringify({ error: 'Unauthorized - admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create auth user for supervisor (invite with temporary password)
    const tempPassword = crypto.randomUUID().substring(0, 12) + 'A1!';
    
    const { data: authUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name,
        role: 'supervisor'
      }
    });

    if (createUserError) {
      console.error('Error creating supervisor auth user:', createUserError);
      return new Response(JSON.stringify({ error: 'Failed to create supervisor account' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create supervisor record
    const { data: supervisorData, error: supervisorError } = await supabaseAdmin
      .from('supervisors')
      .insert({
        user_id: authUser.user.id,
        full_name,
        phone: null
      })
      .select()
      .single();

    if (supervisorError) {
      console.error('Error creating supervisor profile:', supervisorError);
      
      // Cleanup: delete the auth user if supervisor creation failed
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      
      return new Response(JSON.stringify({ error: 'Failed to create supervisor profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create supervisor role in user_roles table
    const { error: userRoleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authUser.user.id,
        role: 'supervisor'
      });

    if (userRoleError) {
      console.error('Error creating supervisor role:', userRoleError);
      // Cleanup: delete supervisor and auth user if role creation failed
      await supabaseAdmin.from('supervisors').delete().eq('user_id', authUser.user.id);
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      
      return new Response(JSON.stringify({ error: 'Failed to assign supervisor role' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create class assignments
    if (class_ids.length > 0) {
      const assignments = class_ids.map((class_id: number) => ({
        supervisor_user_id: authUser.user.id,
        class_id
      }));

      const { error: assignmentError } = await supabaseAdmin
        .from('supervisor_class_assignments')
        .insert(assignments);

      if (assignmentError) {
        console.error('Error creating class assignments:', assignmentError);
        // Continue anyway - assignments can be added later
      }
    }

    // Send password reset email so supervisor can set their own password
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
    });

    if (resetError) {
      console.error('Error sending password reset:', resetError);
      // Continue anyway - admin can manually send reset
    }

    return new Response(JSON.stringify({ 
      success: true, 
      supervisor: supervisorData,
      temporary_password: tempPassword,
      message: 'Supervisor created successfully. Password reset email sent.'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
