import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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

    // Verify caller is admin
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: adminRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    if (!adminRole) throw new Error('Not admin');

    // Find auth users without student records and without staff roles
    const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    
    const { data: existingStudents } = await supabaseAdmin
      .from('students')
      .select('user_id');
    const existingUserIds = new Set((existingStudents || []).map(s => s.user_id));

    const { data: staffRoles } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role')
      .in('role', ['admin', 'academy', 'supervisor', 'teacher']);
    const staffUserIds = new Set((staffRoles || []).map(r => r.user_id));

    // Filter to test-like emails to exclude
    const excludePatterns = ['@nys-africa.com', 'student@gmail.com', 'joson@gmail.com', 'hadi@gmail.com', 'phil@gmail.com', 'fire@gmail.com', 'in@gmail.com', 'hey@gmail.com', 'assit@gmail.com'];

    const missingUsers = (allUsers?.users || []).filter(u => {
      if (existingUserIds.has(u.id)) return false;
      if (staffUserIds.has(u.id)) return false;
      const email = u.email || '';
      if (excludePatterns.some(p => email.includes(p) || email === p)) return false;
      return true;
    });

    const created = [];
    for (const u of missingUsers) {
      const fullName = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'User';
      const avatarUrl = u.user_metadata?.avatar_url || null;

      const { data, error } = await supabaseAdmin
        .from('students')
        .insert({
          user_id: u.id,
          email: u.email || '',
          full_name: fullName,
          avatar_url: avatarUrl,
          is_active: false,
          status: 'pending',
        })
        .select('id, full_name, email')
        .single();

      if (!error && data) {
        created.push(data);
        // Also assign student role
        await supabaseAdmin.from('user_roles').upsert(
          { user_id: u.id, role: 'student' },
          { onConflict: 'user_id,role' }
        );
      }
    }

    return new Response(
      JSON.stringify({ created_count: created.length, students: created }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
