import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

/**
 * choose-class is NOW admin-only.
 * Students cannot self-assign classes — only admins can do this
 * via the approve-pending-user flow.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Verify caller identity
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ADMIN-ONLY: check caller has admin role
    const { data: adminRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'academy'])

    if (!adminRole || adminRole.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Access denied. Admin or Academy role required. Students are assigned to classes by administrators.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { class_id, student_user_id } = await req.json()

    if (!class_id || typeof class_id !== 'number') {
      return new Response(
        JSON.stringify({ error: 'Invalid class_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Target user is either specified or the caller
    const targetUserId = student_user_id || user.id;

    // Validate class exists and is active
    const { data: classData, error: classError } = await supabaseAdmin
      .from('classes')
      .select('id, code, title')
      .eq('id', class_id)
      .eq('is_active', true)
      .single()

    if (classError || !classData) {
      return new Response(
        JSON.stringify({ error: 'Invalid class selection' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get existing student record
    const { data: existingStudent } = await supabaseAdmin
      .from('students')
      .select('id, primary_class_id')
      .eq('user_id', targetUserId)
      .single()

    if (!existingStudent) {
      return new Response(
        JSON.stringify({ error: 'Student record not found. Approve the user first.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update student class
    await supabaseAdmin
      .from('students')
      .update({ primary_class_id: class_id })
      .eq('user_id', targetUserId)

    // Create enrollment
    await supabaseAdmin
      .from('enrollments')
      .upsert({
        student_id: existingStudent.id,
        class_id: class_id
      }, {
        onConflict: 'student_id,class_id',
        ignoreDuplicates: true
      })

    return new Response(
      JSON.stringify({ primary_class_id: class_id, class: classData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in choose-class function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
