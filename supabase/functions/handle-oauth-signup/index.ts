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

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    console.log('Processing OAuth signup for user:', user.id);
    console.log('User metadata:', user.user_metadata);

    // Check if student profile already exists
    const { data: existingStudent } = await supabaseClient
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

    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create student profile
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .insert({
        user_id: user.id,
        email: email,
        full_name: fullName,
        avatar_url: avatarUrl,
        github_profile: githubProfile,
        is_active: true,
      })
      .select()
      .single();

    if (studentError) {
      console.error('Error creating student profile:', studentError);
      throw studentError;
    }

    console.log('Student profile created:', student.id);

    // Create profile entry
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: user.id,
        email: email,
        full_name: fullName,
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Don't throw - profile is secondary
    }

    // Assign student role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: 'student',
      });

    if (roleError) {
      console.error('Error assigning student role:', roleError);
      throw roleError;
    }

    console.log('OAuth signup completed successfully');

    return new Response(
      JSON.stringify({ 
        message: 'Student profile created successfully',
        student_id: student.id,
        needs_class_selection: true 
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
