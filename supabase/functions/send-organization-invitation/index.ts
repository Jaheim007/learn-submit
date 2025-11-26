import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationRequest {
  email: string;
  role: string;
  organization_id: string;
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

    const { email, role, organization_id }: InvitationRequest = await req.json();

    console.log('Creating invitation:', { email, role, organization_id, invited_by: user.id });

    // Verify user is owner/admin of the organization
    const { data: membership, error: membershipError } = await supabaseClient
      .from('submito_organization_users')
      .select('is_owner, role')
      .eq('organization_id', organization_id)
      .eq('user_id', user.id)
      .single();

    if (membershipError || (!membership?.is_owner && membership?.role !== 'admin')) {
      return new Response(JSON.stringify({ error: 'Not authorized to invite members' }), {
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

    // Create or update invitation
    const { data: invitation, error: inviteError } = await supabaseClient
      .from('submito_organization_invitations')
      .upsert({
        organization_id,
        email: email.toLowerCase(),
        role,
        invited_by: user.id,
        invitation_token: crypto.randomUUID(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }, {
        onConflict: 'organization_id,email'
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      return new Response(JSON.stringify({ error: inviteError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Determine app base URL: prefer PUBLIC_SITE_URL, then request origin, then fallback
    const origin = req.headers.get('origin');
    const appUrl = Deno.env.get('PUBLIC_SITE_URL') || origin || 'https://soum1.hackerprof.com';
    const invitationUrl = `${appUrl.replace(/\/$/, '')}/accept-invite?token=${invitation.invitation_token}`;
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    try {
      const emailResponse = await resend.emails.send({
        from: 'Submito <info@genessible.com>',
        to: [email.toLowerCase()],
        subject: `You've been invited to join ${organization.name} on Submito 🎉`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Organization Invitation</title>
          </head>
          <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
              <tr>
                <td align="center">
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="padding:40px 40px 30px;text-align:center;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px 12px 0 0;">
                        <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">🎉 You're Invited!</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding:40px;">
                        <p style="margin:0 0 20px;color:#1a1a1a;font-size:16px;line-height:1.6;">Hello,</p>
                        
                        <p style="margin:0 0 24px;color:#1a1a1a;font-size:16px;line-height:1.6;">
                          You have been invited to join <strong style="color:#667eea;">${organization.name}</strong> on <strong>Submito</strong>, the collaborative platform for managing classes, teachers, students, and educational operations.
                        </p>
                        
                        <p style="margin:0 0 32px;color:#666666;font-size:14px;line-height:1.6;">
                          This invitation was sent by <strong>${invitedBy}</strong>
                        </p>
                        
                        <!-- CTA Button -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding:0 0 32px;">
                              <a href="${invitationUrl}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;box-shadow:0 4px 12px rgba(102,126,234,0.4);">
                                Accept Invitation
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin:0 0 12px;color:#666666;font-size:14px;line-height:1.6;">
                          Or copy and paste this link into your browser:
                        </p>
                        
                        <p style="margin:0 0 32px;padding:12px;background-color:#f8f9fa;border-radius:6px;word-break:break-all;">
                          <a href="${invitationUrl}" style="color:#667eea;text-decoration:none;font-size:13px;">${invitationUrl}</a>
                        </p>
                        
                        <!-- Divider -->
                        <div style="border-top:1px solid #e5e7eb;margin:32px 0;"></div>
                        
                        <!-- Footer Info -->
                        <p style="margin:0 0 16px;color:#666666;font-size:14px;line-height:1.6;">
                          <strong>What is Submito?</strong><br>
                          Submito helps organizations manage staff, teachers, and students in one unified platform. Track progress, manage courses, and streamline educational operations effortlessly.
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

      console.log('Email sent successfully:', emailResponse);
    } catch (emailError: any) {
      console.error('Error sending email:', emailError);
      // Continue even if email fails - invitation is still created
    }
    
    console.log('Invitation created successfully:', invitation.id);
    console.log('Invitation URL:', invitationUrl);

    return new Response(JSON.stringify({ 
      success: true, 
      invitation_id: invitation.id,
      message: 'Invitation sent successfully via email.'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in send-organization-invitation function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);
