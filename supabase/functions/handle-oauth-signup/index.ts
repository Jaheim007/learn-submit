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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    console.log('Processing OAuth signup for user:', user.id);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if user already has a pre-assigned role (admin, academy, supervisor, teacher)
    const { data: existingRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const roleList = (existingRoles || []).map(r => r.role);
    const hasNonStudentRole = roleList.some(r => ['admin', 'academy', 'supervisor', 'teacher'].includes(r));

    if (hasNonStudentRole) {
      console.log('User already has a pre-assigned role:', roleList, '- skipping student creation');
      
      // Ensure profile exists
      await supabaseAdmin.from('profiles').upsert({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      });

      return new Response(
        JSON.stringify({ message: 'User has pre-assigned role, skipping student creation', roles: roleList }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if student profile already exists
    const { data: existingStudent } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingStudent) {
      console.log('Student profile already exists');
      return new Response(
        JSON.stringify({ message: 'Student profile already exists', student_id: existingStudent.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract metadata from OAuth provider
    const fullName = user.user_metadata?.full_name || 
                     user.user_metadata?.name || 
                     user.user_metadata?.user_name ||
                     user.email?.split('@')[0] || 
                     'User';
    
    const email = user.email || '';
    const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
    const githubProfile = user.user_metadata?.user_name 
      ? `https://github.com/${user.user_metadata.user_name}`
      : null;

    console.log('Creating student profile with:', { fullName, email, avatarUrl, githubProfile });

    // Create student profile with pending status
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .insert({
        user_id: user.id,
        email: email,
        full_name: fullName,
        avatar_url: avatarUrl,
        github_profile: githubProfile,
        is_active: false,
        status: 'pending',
      })
      .select()
      .single();

    if (studentError) {
      console.error('Error creating student profile:', studentError);
      throw studentError;
    }

    // Create profile entry
    await supabaseAdmin.from('profiles').upsert({
      id: user.id,
      email: email,
      full_name: fullName,
    });

    // Assign student role
    await supabaseAdmin
      .from('user_roles')
      .upsert(
        { user_id: user.id, role: 'student' },
        { onConflict: 'user_id,role' }
      );

    console.log('OAuth signup completed - student pending approval');

    return new Response(
      JSON.stringify({ 
        message: 'Student profile created successfully',
        student_id: student.id,
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
