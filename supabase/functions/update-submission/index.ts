import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
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
    )

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      console.error('Authentication error:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user is admin
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (roleError || !userRole) {
      console.error('Admin check error:', roleError)
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (req.method !== 'PATCH') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const body = await req.json()
    const { submissionId, status, grade, feedback } = body
    
    if (!submissionId || isNaN(Number(submissionId))) {
      return new Response(
        JSON.stringify({ error: 'Invalid submission ID' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }


    // Validate inputs
    const validStatuses = ['Reçu', 'En révision', 'Validé', 'Refusé']
    
    const updateData: any = {}
    
    if (status !== undefined) {
      if (!validStatuses.includes(status)) {
        return new Response(
          JSON.stringify({ error: 'Invalid status value' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      updateData.status = status
    }

    if (grade !== undefined) {
      if (grade !== null && (typeof grade !== 'number' || grade < 0 || grade > 20)) {
        return new Response(
          JSON.stringify({ error: 'Grade must be between 0 and 20' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      updateData.grade = grade
    }

    if (feedback !== undefined) {
      updateData.feedback = feedback
    }

    if (Object.keys(updateData).length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid fields to update' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update the submission
    const { data: updatedSubmission, error: updateError } = await supabaseClient
      .from('submissions')
      .update(updateData)
      .eq('id', Number(submissionId))
      .select(`
        id,
        status,
        grade,
        feedback,
        submitted_at,
        updated_at,
        students!inner(full_name, email),
        classes!inner(code, title),
        projects!inner(code, title)
      `)
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update submission' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Submission updated successfully:', updatedSubmission.id)

    // Create notification for student about status/grade/feedback change
    if (status || grade !== undefined || feedback) {
      try {
        // Get student user_id
        const { data: submissionData } = await supabaseClient
          .from('submissions')
          .select('student:students(user_id, full_name)')
          .eq('id', Number(submissionId))
          .single()

        if (submissionData?.student) {
          let notificationType = 'status_changed'
          let notificationTitle = 'Mise à jour de votre soumission'
          let notificationBody = ''

          if (status) {
            notificationTitle = 'Changement de statut'
            notificationBody = `Le statut de votre soumission a été mis à jour: ${status}`
          } else if (grade !== undefined) {
            notificationType = 'grade_assigned'
            notificationTitle = 'Note attribuée'
            notificationBody = `Votre soumission a reçu la note: ${grade}/20`
          } else if (feedback) {
            notificationType = 'feedback_added'
            notificationTitle = 'Nouveau commentaire'
            notificationBody = 'Un commentaire a été ajouté à votre soumission'
          }

          await supabaseClient.functions.invoke('create-notification', {
            body: {
              user_id: submissionData.student.user_id,
              type: notificationType,
              title: notificationTitle,
              body: notificationBody,
              metadata: {
                submission_id: Number(submissionId),
                status,
                grade,
                has_feedback: !!feedback
              }
            }
          })
        }
      } catch (notifError) {
        console.warn('Failed to create notification:', notifError)
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Submission updated successfully',
        submission: updatedSubmission 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})