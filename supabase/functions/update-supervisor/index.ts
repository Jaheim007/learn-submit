import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin');

    if (roleError || !userRoles || userRoles.length === 0) {
      return new Response(JSON.stringify({ error: 'Access denied: Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { supervisor_user_id, class_ids } = await req.json();

    if (!supervisor_user_id || !class_ids || !Array.isArray(class_ids)) {
      return new Response(JSON.stringify({ error: 'Missing required fields: supervisor_user_id, class_ids' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Remove existing class assignments
    const { error: deleteError } = await supabaseAdmin
      .from('supervisor_class_assignments')
      .delete()
      .eq('supervisor_user_id', supervisor_user_id);

    if (deleteError) {
      console.error('Error removing existing assignments:', deleteError);
      return new Response(JSON.stringify({ error: `Failed to update assignments: ${deleteError.message}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Add new class assignments
    if (class_ids.length > 0) {
      const classAssignments = class_ids.map((class_id: number) => ({
        supervisor_user_id,
        class_id
      }));

      const { error: insertError } = await supabaseAdmin
        .from('supervisor_class_assignments')
        .insert(classAssignments);

      if (insertError) {
        console.error('Error inserting new assignments:', insertError);
        return new Response(JSON.stringify({ error: `Failed to assign classes: ${insertError.message}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Classes du superviseur mises à jour avec succès'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in update-supervisor function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});