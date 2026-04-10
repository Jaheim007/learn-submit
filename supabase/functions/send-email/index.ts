import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailRequest {
  mode: "individual" | "class" | "broadcast";
  to?: string[];
  class_id?: number;
  subject: string;
  html_body: string;
}

interface SendResult {
  email: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

async function logEmailAttempt(
  supabase: any,
  emailType: string,
  recipientEmail: string,
  status: "success" | "failed",
  errorMessage: string | null,
  resendResponse: unknown,
) {
  const { error } = await supabase.from("email_send_logs").insert({
    email_type: emailType,
    recipient_email: recipientEmail,
    recipient_name: null,
    status,
    error_message: errorMessage,
    resend_response: resendResponse,
  });

  if (error) {
    console.error("Failed to log email attempt:", error.message);
  }
}

async function sendViaResend({
  supabase,
  to,
  subject,
  html,
  emailType,
}: {
  supabase: any;
  to: string[];
  subject: string;
  html: string;
  emailType: string;
}): Promise<SendResult[]> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const resendFrom = Deno.env.get("RESEND_FROM") || "Hacktualiz <info@genessible.com>";

  if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");

  const results: SendResult[] = [];
  const batchSize = 50;

  for (let i = 0; i < to.length; i += batchSize) {
    const batch = to.slice(i, i + batchSize);

    for (const email of batch) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: resendFrom,
            to: [email],
            subject,
            html,
          }),
        });

        const rawBody = await res.text();
        let parsedBody: unknown = null;

        try {
          parsedBody = rawBody ? JSON.parse(rawBody) : null;
        } catch {
          parsedBody = rawBody;
        }

        const errorMessage = res.ok
          ? null
          : typeof parsedBody === "object" && parsedBody && "message" in (parsedBody as Record<string, unknown>)
            ? String((parsedBody as Record<string, unknown>).message)
            : "Resend request failed";

        await logEmailAttempt(
          supabase,
          emailType,
          email,
          res.ok ? "success" : "failed",
          errorMessage,
          parsedBody,
        );

        results.push({
          email,
          success: res.ok,
          data: parsedBody,
          ...(errorMessage ? { error: errorMessage } : {}),
        });

        if (!res.ok) {
          console.error(`Failed to send to ${email}:`, parsedBody);
        }
      } catch (err: any) {
        const errorMessage = err?.message || "Unexpected send error";

        await logEmailAttempt(supabase, emailType, email, "failed", errorMessage, null);

        results.push({
          email,
          success: false,
          error: errorMessage,
        });
      }
    }
  }

  return results;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { mode, to, class_id, subject, html_body }: EmailRequest = await req.json();

    if (!subject || !html_body) {
      return new Response(JSON.stringify({ error: "subject and html_body required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let recipients: string[] = [];

    if (mode === "individual") {
      if (!to || to.length === 0) {
        return new Response(JSON.stringify({ error: "No recipients specified" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      recipients = to;
    } else if (mode === "class") {
      if (!class_id) {
        return new Response(JSON.stringify({ error: "class_id required for class mode" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("students!inner(email)")
        .eq("class_id", class_id);

      if (enrollments) {
        recipients = enrollments
          .map((enrollment: any) => enrollment.students?.email)
          .filter((studentEmail: string | null) => studentEmail);
      }
    } else if (mode === "broadcast") {
      const { data: students } = await supabase
        .from("students")
        .select("email")
        .eq("is_active", true)
        .eq("status", "active");

      if (students) {
        recipients = students
          .map((student: any) => student.email)
          .filter((studentEmail: string | null) => studentEmail);
      }
    }

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ error: "No recipients found", sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailType = `admin_${mode}`;
    const results = await sendViaResend({
      supabase,
      to: recipients,
      subject,
      html: html_body,
      emailType,
    });

    const successCount = results.filter((result) => result.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        total: recipients.length,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Error in send-email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
