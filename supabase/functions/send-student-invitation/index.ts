import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

    // Get organization details
    const { data: organization, error: orgError } = await supabaseClient
      .from('submito_organizations')
      .select('name')
      .eq('id', organization_id)
      .single();

    if (orgError || !organization) {
      return new Response(JSON.stringify({ error: 'Organization not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get inviter's name
    const { data: inviterProfile } = await supabaseClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const invitedBy = inviterProfile?.full_name || inviterProfile?.email || 'An administrator';

    // Generate registration URL with student ID
    const origin = req.headers.get('origin') || 'https://d684e6da-9985-4c90-afe5-fc8b02ef26fe.lovableproject.com';
    const registrationUrl = `${origin}/organization/${organization_slug}/student/register?email=${encodeURIComponent(email)}&id=${student.id}`;

    // Send invitation email via Resend
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    try {
      const emailResponse = await resend.emails.send({
        from: 'Submito <info@genessible.com>',
        to: [email.toLowerCase()],
        subject: `You've been invited to join ${organization.name} on Submito 🎓`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Student Invitation</title>
          </head>
          <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
              <tr>
                <td align="center">
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="padding:40px 40px 30px;text-align:center;background:linear-gradient(135deg,#06b6d4 0%,#a855f7 100%);border-radius:12px 12px 0 0;">
                        <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">🎓 Welcome to Submito!</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding:40px;">
                        <p style="margin:0 0 20px;color:#1a1a1a;font-size:16px;line-height:1.6;">Hello <strong>${full_name}</strong>,</p>
                        
                        <p style="margin:0 0 24px;color:#1a1a1a;font-size:16px;line-height:1.6;">
                          You have been invited to join <strong style="color:#06b6d4;">${organization.name}</strong> on <strong>Submito</strong>, our learning management platform for students and educators.
                        </p>
                        
                        <p style="margin:0 0 32px;color:#666666;font-size:14px;line-height:1.6;">
                          This invitation was sent by <strong>${invitedBy}</strong>
                        </p>
                        
                        <!-- CTA Button -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding:0 0 32px;">
                              <a href="${registrationUrl}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#06b6d4 0%,#a855f7 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;box-shadow:0 4px 12px rgba(6,182,212,0.4);">
                                Complete Registration
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin:0 0 12px;color:#666666;font-size:14px;line-height:1.6;">
                          Or copy and paste this link into your browser:
                        </p>
                        
                        <p style="margin:0 0 32px;padding:12px;background-color:#f8f9fa;border-radius:6px;word-break:break-all;">
                          <a href="${registrationUrl}" style="color:#06b6d4;text-decoration:none;font-size:13px;">${registrationUrl}</a>
                        </p>
                        
                        <!-- Divider -->
                        <div style="border-top:1px solid #e5e7eb;margin:32px 0;"></div>
                        
                        <!-- Footer Info -->
                        <p style="margin:0 0 16px;color:#666666;font-size:14px;line-height:1.6;">
                          <strong>What is Submito?</strong><br>
                          Submito is a learning management platform where you can access courses, submit projects, track your progress, and communicate with your instructors.
                        </p>
                        
                        <p style="margin:0;color:#999999;font-size:13px;line-height:1.6;">
                          If you received this email by mistake, you can safely ignore it.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding:24px 40px;text-align:center;background-color:#f8f9fa;border-radius:0 0 12px 12px;">
                        <p style="margin:0;color:#999999;font-size:13px;line-height:1.6;">
                          © 2025 Submito. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      });

      console.log('Student invitation email sent successfully:', emailResponse);
    } catch (emailError: any) {
      console.error('Error sending student invitation email:', emailError);
      // Continue even if email fails - student record is still created
    }

    console.log('Student invitation created successfully:', { student_id: student.id, registration_url: registrationUrl });

    return new Response(JSON.stringify({ 
      success: true, 
      student_id: student.id,
      registration_url: registrationUrl,
      message: 'Student invitation sent successfully via email.'
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
