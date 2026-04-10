import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, full_name } = await req.json();

    console.log('Registering student (pending approval):', { email, full_name });

    // Validate required fields
    if (!email || !password || !full_name) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email, password, and full_name are required' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }


    // Use service role to create user and profile
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    });

    if (authError || !authUser.user) {
      console.error('Auth user creation failed:', authError);
      
      // Check for specific error codes
      let errorMessage = authError?.message || 'Failed to create user';
      let statusCode = 400;
      
      // Handle duplicate email error
      if (authError?.message?.includes('already been registered') || authError?.code === 'email_exists') {
        errorMessage = 'Cette adresse email est déjà utilisée';
        statusCode = 422;
      } else if (authError?.message?.includes('Password should be at least')) {
        errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      }
      
      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Auth user created:', authUser.user.id);

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email,
        full_name
      });

    if (profileError) {
      console.error('Profile creation failed:', profileError);
      // Cleanup: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create profile' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Profile created for user:', authUser.user.id);

    // Add student role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authUser.user.id,
        role: 'student'
      });

    if (roleError) {
      console.error('Role creation failed:', roleError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to assign student role' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Student role assigned to user:', authUser.user.id);

    // Create student record with "pending" status (no class assignment yet)
    const { error: studentError } = await supabaseAdmin
      .from('students')
      .insert({
        user_id: authUser.user.id,
        email,
        full_name,
        status: 'pending',  // Awaiting admin approval
        is_active: false
      });

    if (studentError) {
      console.error('Student record creation failed:', studentError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create student profile' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Student registration completed successfully (pending approval)');

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: authUser.user.id,
        message: 'Student registered successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});