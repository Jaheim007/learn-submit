import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StudentInvitationRequest {
  email: string;
  full_name: string;
  organization_id: string;
  organization_slug: string;
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

    const { email, full_name, organization_id, organization_slug }: StudentInvitationRequest = await req.json();

    console.log('Creating student invitation:', { email, full_name, organization_id, invited_by: user.id });

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

    // Create student record with pending status
    const { data: student, error: studentError } = await supabaseClient
      .from('submito_organization_students')
      .insert({
        organization_id,
        email: email.toLowerCase(),
        full_name,
        status: 'pending'
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

    // Send invitation email via Resend
    const registrationUrl = `${Deno.env.get('SUPABASE_URL').replace('//', '//app.')}/organization/${organization_slug}/student/register?email=${encodeURIComponent(email)}`;
    
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Submito <onboarding@resend.dev>',
      to: [email],
      subject: `You're invited to join ${organization.name} on Submito`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Student Invitation</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f6f9fc;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 40px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                    <tr>
                      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Student Invitation</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #333333;">Hi ${full_name},</p>
                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #333333;">
                          ${invitedBy} has invited you to join <strong>${organization.name}</strong> as a student on Submito.
                        </p>
                        <p style="margin: 0 0 30px; font-size: 16px; line-height: 24px; color: #333333;">
                          Click the button below to complete your registration and start learning:
                        </p>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center">
                              <a href="${registrationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">Complete Registration</a>
                            </td>
                          </tr>
                        </table>
                        <p style="margin: 30px 0 0; font-size: 14px; line-height: 20px; color: #666666;">
                          If you didn't expect this invitation, you can safely ignore this email.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color: #f8f9fa; padding: 24px; text-align: center; border-top: 1px solid #e9ecef;">
                        <p style="margin: 0; font-size: 14px; color: #666666;">
                          © ${new Date().getFullYear()} Submito. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      return new Response(JSON.stringify({ error: 'Failed to send invitation email' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Student invitation sent successfully:', { student_id: student.id, email_id: emailData?.id });

    return new Response(JSON.stringify({ 
      success: true, 
      student_id: student.id,
      message: 'Student invitation sent successfully'
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
