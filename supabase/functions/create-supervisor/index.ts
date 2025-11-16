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

    // Create or reuse auth user for supervisor
    const tempPassword = crypto.randomUUID().substring(0, 12) + 'A1!';

    let userId: string | null = null;

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
      // If the email already exists, reuse that account instead of failing
      const code = (createUserError as any)?.code || (createUserError as any)?.name;
      console.error('Error creating supervisor auth user:', createUserError);

      if (code === 'email_exists' || (createUserError as any)?.status === 422) {
        // Try to find the user via public.profiles first (faster)
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (existingProfile?.id) {
          userId = existingProfile.id;
        } else {
          // Fallback: list users and find by email
          const { data: listRes, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
          if (listErr) {
            return new Response(JSON.stringify({ error: 'Unable to locate existing account for this email' }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          const found = listRes.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
          if (!found) {
            return new Response(JSON.stringify({ error: 'Email already exists but account not found' }), {
              status: 409,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          userId = found.id;
        }
      } else {
        return new Response(JSON.stringify({ error: 'Failed to create supervisor account' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else if (authUser?.user?.id) {
      userId = authUser.user.id;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Could not resolve user id' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Ensure a profile exists (helpful for UI and joins)
    await supabaseAdmin
      .from('profiles')
      .upsert({ id: userId, email, full_name: full_name ?? null })
      .select()
      .maybeSingle();

    // Upsert supervisor record
    const { data: supervisorData, error: supervisorError } = await supabaseAdmin
      .from('supervisors')
      .upsert({
        user_id: userId,
        full_name,
        phone: null
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (supervisorError) {
      console.error('Error creating/updating supervisor profile:', supervisorError);
      return new Response(JSON.stringify({ error: 'Failed to create supervisor profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Ensure supervisor role
    const { data: existingRole, error: checkRoleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'supervisor')
      .maybeSingle();

    if (checkRoleError) {
      console.error('Error checking supervisor role:', checkRoleError);
      return new Response(JSON.stringify({ error: 'Failed to check supervisor role' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!existingRole) {
      const { error: roleInsertError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: userId, role: 'supervisor' });

      if (roleInsertError) {
        console.error('Error assigning supervisor role:', roleInsertError);
        return new Response(JSON.stringify({ error: 'Failed to assign supervisor role' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Replace class assignments if provided
    if (class_ids && class_ids.length > 0) {
      // Clean existing to avoid duplicates
      await supabaseAdmin.from('supervisor_class_assignments').delete().eq('supervisor_user_id', userId);

      const assignments = class_ids.map((class_id: number) => ({
        supervisor_user_id: userId,
        class_id
      }));

      const { error: assignmentError } = await supabaseAdmin
        .from('supervisor_class_assignments')
        .insert(assignments);

      if (assignmentError) {
        console.error('Error creating class assignments:', assignmentError);
        // Continue anyway - we can assign classes later
      }
    }

    console.log('Successfully ensured supervisor:', userId);

    return new Response(
      JSON.stringify({ 
        success: true,
        user_id: userId 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error in create-supervisor:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
