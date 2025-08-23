import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create regular client for auth verification
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin');

    if (roleError || !userRoles || userRoles.length === 0) {
      console.error('Role check failed:', roleError);
      return new Response(JSON.stringify({ error: 'Access denied: Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email, full_name, class_ids } = await req.json();

    if (!email || !full_name || !class_ids || !Array.isArray(class_ids)) {
      return new Response(JSON.stringify({ error: 'Missing required fields: email, full_name, class_ids' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Creating supervisor:', { email, full_name, class_ids });

    // Create user account with admin client
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: Math.random().toString(36).slice(-12), // Generate temporary password
      email_confirm: true,
      user_metadata: { full_name }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return new Response(JSON.stringify({ error: `Failed to create user: ${createError.message}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!newUser.user) {
      return new Response(JSON.stringify({ error: 'Failed to create user' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User created:', newUser.user.id);

    // Create student profile
    const { error: studentError } = await supabaseAdmin
      .from('students')
      .insert({
        user_id: newUser.user.id,
        full_name,
        email
      });

    if (studentError) {
      console.error('Error creating student profile:', studentError);
    }

    // Assign supervisor role
    const { error: roleAssignError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: 'supervisor'
      });

    if (roleAssignError) {
      console.error('Error assigning supervisor role:', roleAssignError);
      return new Response(JSON.stringify({ error: `Failed to assign supervisor role: ${roleAssignError.message}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Assign class access
    const classAssignments = class_ids.map((class_id: number) => ({
      supervisor_user_id: newUser.user.id,
      class_id
    }));

    const { error: classAssignError } = await supabaseAdmin
      .from('supervisor_class_assignments')
      .insert(classAssignments);

    if (classAssignError) {
      console.error('Error assigning classes:', classAssignError);
      return new Response(JSON.stringify({ error: `Failed to assign classes: ${classAssignError.message}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Supervisor created successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      supervisor_id: newUser.user.id,
      message: 'Superviseur créé avec succès'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in create-supervisor function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});