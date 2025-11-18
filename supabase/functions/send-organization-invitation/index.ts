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

    // Send invitation email via Resend
    const invitationUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/accept-organization-invitation?token=${invitation.invitation_token}`;
    
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    try {
      const emailResponse = await resend.emails.send({
        from: 'Submito <onboarding@olletlazare.com>', // TODO: Change to your verified domain
        to: [email.toLowerCase()],
        subject: "You've been invited to join an organization on Submito 🎉",
        html: `
          <h2>You've been invited to join an organization on Submito 🎉</h2>
          
          <p>Hello,</p>
          
          <p>You have been invited to join the <strong>${organization.name}</strong> organization on <strong>Submito</strong>, our collaborative workspace for managing classes, teachers, students, and school operations.</p>
          
          <p>This invite was sent by <strong>${invitedBy}</strong>. To access your dashboard and activate your account, simply click the button below:</p>
          
          <p>
            <a href="${invitationUrl}" style="
              display:inline-block;
              padding:12px 20px;
              background:#4F46E5;
              color:white;
              text-decoration:none;
              border-radius:6px;
              font-weight:bold;
            ">
              Accept Invitation
            </a>
          </p>
          
          <p>If the button does not work, you can also copy and paste this link into your browser:</p>
          
          <p>${invitationUrl}</p>
          
          <hr>
          
          <p>
          Submito helps organizations manage staff, teachers, and students in one simple platform.  
          If you received this message by mistake, you can simply ignore it.
          </p>
          
          <p>— The Submito Team</p>
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
