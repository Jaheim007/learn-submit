import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin or supervisor role
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const roles = (userRoles || []).map((r: { role: string }) => r.role);
    if (!roles.includes('admin') && !roles.includes('supervisor') && !roles.includes('academy')) {
      return new Response(
        JSON.stringify({ error: 'Access denied.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get caller profile for audit
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const { submissionId, updates } = await req.json();

    if (!submissionId || !updates) {
      return new Response(
        JSON.stringify({ error: 'Missing submissionId or updates' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (updates.status && !['submitted', 'in_review', 'approved', 'rejected'].includes(updates.status)) {
      return new Response(
        JSON.stringify({ error: 'Invalid status value' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (updates.grade !== undefined && (updates.grade < 0 || updates.grade > 20)) {
      return new Response(
        JSON.stringify({ error: 'Grade must be between 0 and 20' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get old submission for logging
    const { data: oldSub } = await supabase
      .from('submissions')
      .select('status, grade, student_id, project_id, class_id')
      .eq('id', submissionId)
      .single();

    // Update the submission
    const { data, error } = await supabase
      .from('submissions')
      .update({
        ...updates,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating submission:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to update submission' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Write audit log
    try {
      // Get student & project names
      let studentName = '';
      let projectName = '';
      if (oldSub) {
        const { data: student } = await supabase.from('students').select('full_name').eq('id', oldSub.student_id).single();
        const { data: project } = await supabase.from('projects').select('title').eq('id', oldSub.project_id).single();
        studentName = student?.full_name || '';
        projectName = project?.title || '';
      }

      await supabase.from('activity_logs').insert({
        action: 'submission_status_changed',
        entity_type: 'submission',
        entity_id: String(submissionId),
        user_id: user.id,
        user_name: callerProfile?.full_name || callerProfile?.email || 'Admin',
        user_email: callerProfile?.email,
        details: {
          student: studentName,
          project: projectName,
          old_status: oldSub?.status,
          new_status: updates.status || oldSub?.status,
          grade: updates.grade ?? oldSub?.grade,
          reviewed_by: callerProfile?.full_name || callerProfile?.email,
        },
      });
    } catch (e) {
      console.warn('Activity log write failed:', e);
    }

    return new Response(
      JSON.stringify({ success: true, submission: data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
