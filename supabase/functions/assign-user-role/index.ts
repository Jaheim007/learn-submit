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

    const { email, full_name, role } = await req.json();

    if (!email || !role) {
      return new Response(JSON.stringify({ error: 'email and role are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const validRoles = ['admin', 'academy', 'supervisor'];
    if (!validRoles.includes(role)) {
      return new Response(JSON.stringify({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }), {
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
    const { data: callerRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!callerRole) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Find or pre-register the user by email
    // First check if user already exists in profiles
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    let targetUserId: string;

    if (existingProfile) {
      targetUserId = existingProfile.id;
    } else {
      // Check auth.users via admin API
      const { data: listRes } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const found = listRes?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());

      if (found) {
        targetUserId = found.id;
        // Ensure profile exists
        await supabaseAdmin.from('profiles').upsert({
          id: found.id,
          email: email.toLowerCase(),
          full_name: full_name || null,
        });
      } else {
        // User doesn't exist yet — pre-register with a placeholder
        // They will complete registration when they log in via OAuth/OTP
        const tempPassword = crypto.randomUUID();
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: email.toLowerCase(),
          password: tempPassword,
          email_confirm: true,
          user_metadata: { full_name: full_name || email.split('@')[0], pre_assigned_role: role }
        });

        if (createError) {
          console.error('Error creating user:', createError);
          return new Response(JSON.stringify({ error: 'Failed to pre-register user' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        targetUserId = newUser.user.id;

        // Create profile
        await supabaseAdmin.from('profiles').upsert({
          id: targetUserId,
          email: email.toLowerCase(),
          full_name: full_name || null,
        });
      }
    }

    // Assign the role (upsert to avoid duplicates)
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert(
        { user_id: targetUserId, role },
        { onConflict: 'user_id,role' }
      );

    if (roleError) {
      console.error('Error assigning role:', roleError);
      return new Response(JSON.stringify({ error: 'Failed to assign role' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update profile name if provided
    if (full_name) {
      await supabaseAdmin.from('profiles').update({ full_name }).eq('id', targetUserId);
    }

    console.log(`Role '${role}' assigned to ${email} (${targetUserId})`);

    return new Response(JSON.stringify({ success: true, user_id: targetUserId }), {
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
