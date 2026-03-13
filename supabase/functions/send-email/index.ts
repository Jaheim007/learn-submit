import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  mode: 'individual' | 'class' | 'broadcast';
  to?: string[];           // for individual: array of emails
  class_id?: number;       // for class mode
  subject: string;
  html_body: string;
}

async function sendViaResend(to: string[], subject: string, html: string) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  const RESEND_FROM = Deno.env.get('RESEND_FROM') || 'Kelya Group <noreply@kelyagroup.com>';
  
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');

  // Resend supports max 50 recipients per call in batch
  const batchSize = 50;
  const results = [];

  for (let i = 0; i < to.length; i += batchSize) {
    const batch = to.slice(i, i + batchSize);
    
    // Send individually for better deliverability
    for (const email of batch) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: RESEND_FROM,
            to: [email],
            subject,
            html,
          }),
        });

        const data = await res.json();
        results.push({ email, success: res.ok, data });
        
        if (!res.ok) {
          console.error(`Failed to send to ${email}:`, data);
        }
      } catch (err: any) {
        results.push({ email, success: false, error: err.message });
      }
    }
  }

  return results;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the caller is admin
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { mode, to, class_id, subject, html_body }: EmailRequest = await req.json();

    if (!subject || !html_body) {
      return new Response(JSON.stringify({ error: 'subject and html_body required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let recipients: string[] = [];

    if (mode === 'individual') {
      if (!to || to.length === 0) {
        return new Response(JSON.stringify({ error: 'No recipients specified' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      recipients = to;
    } else if (mode === 'class') {
      if (!class_id) {
        return new Response(JSON.stringify({ error: 'class_id required for class mode' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      // Get all students in this class
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('students!inner(email)')
        .eq('class_id', class_id);

      if (enrollments) {
        recipients = enrollments
          .map((e: any) => e.students?.email)
          .filter((email: string | null) => email);
      }
    } else if (mode === 'broadcast') {
      // Get all active students
      const { data: students } = await supabase
        .from('students')
        .select('email')
        .eq('is_active', true)
        .eq('status', 'active');

      if (students) {
        recipients = students
          .map((s: any) => s.email)
          .filter((email: string | null) => email);
      }
    }

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ error: 'No recipients found', sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Sending email to ${recipients.length} recipients (mode: ${mode})`);
    const results = await sendViaResend(recipients, subject, html_body);
    
    const successCount = results.filter(r => r.success).length;

    return new Response(JSON.stringify({ 
      success: true, 
      sent: successCount,
      total: recipients.length,
      results 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in send-email:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
