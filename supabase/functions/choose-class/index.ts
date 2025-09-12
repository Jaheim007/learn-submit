import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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
    )

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { class_id } = await req.json()

    // Validate input
    if (!class_id || typeof class_id !== 'number') {
      return new Response(
        JSON.stringify({ error: 'Invalid class_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate class exists and is open for signup
    const { data: classData, error: classError } = await supabaseClient
      .from('classes')
      .select('id, code, title, is_open_for_signup')
      .eq('id', class_id)
      .eq('is_active', true)
      .single()

    if (classError || !classData) {
      return new Response(
        JSON.stringify({ error: 'Invalid class selection' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!classData.is_open_for_signup) {
      return new Response(
        JSON.stringify({ error: 'Les inscriptions pour ce groupe sont fermées. Veuillez choisir un groupe de la 2ème Session.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use the service role client for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Check if student exists and get current class
    const { data: existingStudent } = await supabaseAdmin
      .from('students')
      .select('id, primary_class_id')
      .eq('user_id', user.id)
      .single()

    // Check if user is admin
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    const isAdmin = !!userRole

    // If student has a class already set and is not admin, return error
    if (existingStudent?.primary_class_id && !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Class is immutable' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Start transaction-like operations
    let studentId: string

    if (existingStudent) {
      // Update existing student
      const { error: updateError } = await supabaseAdmin
        .from('students')
        .update({ primary_class_id: class_id })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Error updating student:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      studentId = existingStudent.id
    } else {
      // Create new student profile
      const { data: newStudent, error: insertError } = await supabaseAdmin
        .from('students')
        .insert({
          user_id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          primary_class_id: class_id
        })
        .select('id')
        .single()

      if (insertError || !newStudent) {
        console.error('Error creating student:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to create profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      studentId = newStudent.id
    }

    // Create enrollment (ignore if already exists)
    const { error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .upsert({
        student_id: studentId,
        class_id: class_id
      }, {
        onConflict: 'student_id,class_id',
        ignoreDuplicates: true
      })

    if (enrollmentError) {
      console.error('Error creating enrollment:', enrollmentError)
      // Don't fail here as the main operation succeeded
    }

    return new Response(
      JSON.stringify({
        primary_class_id: class_id,
        class: classData
      }),
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