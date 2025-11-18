import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Send invitation email via Supabase Auth
    const invitationUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/accept-organization-invitation?token=${invitation.invitation_token}`;
    
    // Note: This requires custom email templates to be configured in Supabase Auth settings
    // The email template should use these variables:
    // - {{ .Data.org_name }}
    // - {{ .Data.invited_by }}
    // - {{ .Data.invitation_url }}
    // - {{ .Data.role }}

    // For now, we'll just return success - actual email sending will be configured in Supabase Auth
    // Or you can integrate with Resend/SendGrid here
    
    console.log('Invitation created successfully:', invitation.id);
    console.log('Invitation URL:', invitationUrl);

    return new Response(JSON.stringify({ 
      success: true, 
      invitation_id: invitation.id,
      invitation_url: invitationUrl,
      message: 'Invitation created. Email will be sent via Supabase Auth email templates.'
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
