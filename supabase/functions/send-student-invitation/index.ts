import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StudentInvitationRequest {
  email: string;
  full_name: string;
  organization_id: string;
  organization_slug: string;
  class_id?: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { email, full_name, organization_id, organization_slug, class_id }: StudentInvitationRequest = await req.json();

    console.log('Creating student invitation:', { email, full_name, organization_id, invited_by: user.id, class_id });

    // Verify user is owner/admin of the organization
    const { data: membership, error: membershipError } = await supabaseClient
      .from('submito_organization_users')
      .select('is_owner, role')
      .eq('organization_id', organization_id)
      .eq('user_id', user.id)
      .single();

    if (membershipError || (!membership?.is_owner && membership?.role !== 'admin' && membership?.role !== 'academy')) {
      return new Response(JSON.stringify({ error: 'Not authorized to invite students' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if student already exists
    const { data: existingStudent } = await supabaseClient
      .from('submito_organization_students')
      .select('id, status')
      .eq('organization_id', organization_id)
      .eq('email', email.toLowerCase())
      .single();

    if (existingStudent) {
      return new Response(JSON.stringify({ 
        error: `Student already exists with status: ${existingStudent.status}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create student record with pending status
    const { data: student, error: studentError } = await supabaseClient
      .from('submito_organization_students')
      .insert({
        organization_id,
        email: email.toLowerCase(),
        full_name,
        status: 'pending',
        class_id: class_id || null
      })
      .select()
      .single();

    if (studentError) {
      console.error('Error creating student:', studentError);
      return new Response(JSON.stringify({ error: studentError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate registration URL
    const registrationUrl = `${req.headers.get('origin')}/organization/${organization_slug}/student/register?email=${encodeURIComponent(email)}&id=${student.id}`;

    console.log('Student invitation created successfully:', { student_id: student.id, registration_url: registrationUrl });

    return new Response(JSON.stringify({ 
      success: true, 
      student_id: student.id,
      registration_url: registrationUrl,
      message: 'Student invitation created. Registration URL generated.',
      note: 'Share the registration URL with the student.'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in send-student-invitation:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);
