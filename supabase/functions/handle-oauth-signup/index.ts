import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    let user = null;
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader) {
      const authClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user: authUser } } = await authClient.auth.getUser();
      user = authUser;
    }

    // Fallback: check if user_id was passed in body
    if (!user) {
      try {
        const body = await req.json();
        if (body?.user_id) {
          const { data: { user: adminUser } } = await supabaseAdmin.auth.admin.getUserById(body.user_id);
          user = adminUser;
        }
      } catch {}
    }

    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('Processing signup for user:', user.id, user.email);

    // Check if user already has any role assigned
    const { data: existingRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const roleList = (existingRoles || []).map(r => r.role);

    if (roleList.length > 0) {
      console.log('User already has roles:', roleList, '- skipping');
      
      // Ensure profile exists
      await supabaseAdmin.from('profiles').upsert({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      });

      return new Response(
        JSON.stringify({ message: 'User already has roles', roles: roleList }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (existingProfile) {
      console.log('Profile already exists, user is pending role assignment');
      return new Response(
        JSON.stringify({ message: 'Profile exists, pending role assignment', status: 'pending' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract metadata
    const fullName = user.user_metadata?.full_name || 
                     user.user_metadata?.name || 
                     user.user_metadata?.user_name ||
                     user.email?.split('@')[0] || 
                     'User';
    
    const email = user.email || '';

    console.log('Creating profile (pending role assignment):', { fullName, email });

    // ONLY create a profile entry — NO student record, NO role
    // The Super Admin will assign the role later
    await supabaseAdmin.from('profiles').upsert({
      id: user.id,
      email: email,
      full_name: fullName,
    });

    console.log('Profile created — user is now pending role assignment by Super Admin');

    return new Response(
      JSON.stringify({ 
        message: 'Profile created, pending role assignment by admin',
        status: 'pending'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
    );
  } catch (error) {
    console.error('Error in handle-oauth-signup:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
