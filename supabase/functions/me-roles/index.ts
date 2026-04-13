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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: {
        headers: {
          Authorization: req.headers.get('Authorization')!,
        },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('Auth error or no user:', authError);
      return new Response(
        JSON.stringify({ 
          roles: [],
          isAdmin: false,
          isSupervisor: false,
          isTeacher: false,
          isAcademy: false,
          error: 'Unauthorized'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Fetching roles for user:', user.id);

    // Fetch user roles filtered by platform = 'hacktualiz' or 'both'
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role, platform')
      .eq('user_id', user.id)
      .in('platform', ['hacktualiz', 'both']);

    if (roleError) {
      console.error('Error fetching roles:', roleError);
      return new Response(
        JSON.stringify({ 
          roles: [],
          isAdmin: false,
          isSupervisor: false,
          isTeacher: false,
          isAcademy: false,
          error: 'Failed to fetch roles'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const roles = roleData?.map(r => r.role) || [];
    console.log('Found roles (hacktualiz):', roles);

    return new Response(
      JSON.stringify({ 
        roles,
        isAdmin: roles.includes('admin'),
        isSupervisor: roles.includes('supervisor'),
        isTeacher: roles.includes('teacher') || roles.includes('supervisor'),
        isAcademy: roles.includes('academy')
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error in me-roles:', error);
    return new Response(
      JSON.stringify({ 
        roles: [],
        isAdmin: false,
        isSupervisor: false,
        isTeacher: false,
        isAcademy: false,
        error: 'Internal server error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
