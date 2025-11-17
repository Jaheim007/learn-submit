import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
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

    // Get user from auth header
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('Auth error or no user:', authError);
      return new Response(
        JSON.stringify({ 
          roles: [],
          isAdmin: false,
          isSupervisor: false,
          error: 'Unauthorized'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Fetching roles for user:', user.id);

    // Fetch user roles using anon key (policy allows users to read their own roles)
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roleError) {
      console.error('Error fetching roles:', roleError);
      return new Response(
        JSON.stringify({ 
          roles: [],
          isAdmin: false,
          isSupervisor: false,
          error: 'Failed to fetch roles'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const roles = roleData?.map(r => r.role) || [];
    console.log('Found roles:', roles);

    return new Response(
      JSON.stringify({ 
        roles,
        isAdmin: roles.includes('admin'),
        isSupervisor: roles.includes('supervisor'),
        isTeacher: roles.includes('teacher'),
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
        error: 'Internal server error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});