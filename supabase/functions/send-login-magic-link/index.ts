import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LoginMagicLinkRequest {
  email: string;
  redirect_to?: string;
}

async function logEmailAttempt(
  supabaseAdmin: any,
  recipientEmail: string,
  status: "success" | "failed",
  errorMessage: string | null,
  resendResponse: unknown,
) {
  const { error } = await supabaseAdmin.from("email_send_logs").insert({
    email_type: "login_magic_link",
    recipient_email: recipientEmail,
    recipient_name: null,
    status,
    error_message: errorMessage,
    resend_response: resendResponse,
  });

  if (error) {
    console.error("Failed to log login magic link attempt:", error.message);
  }
}

async function generateAuthLink(
  supabaseAdmin: any,
  email: string,
  redirectTo: string,
): Promise<string> {
  const magicLink = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });

  const magicLinkUrl = magicLink.data?.properties?.action_link;
  if (!magicLink.error && magicLinkUrl) {
    return magicLinkUrl;
  }

  const shouldFallbackToSignup =
    magicLink.error?.status === 422 ||
    /not found|has not been registered|user/i.test(magicLink.error?.message ?? "");

  if (!shouldFallbackToSignup) {
    throw magicLink.error ?? new Error("Could not generate a login link");
  }

  const signUpLink = await supabaseAdmin.auth.admin.generateLink({
    type: "signup",
    email,
    password: crypto.randomUUID(),
    options: { redirectTo },
  });

  const signUpUrl = signUpLink.data?.properties?.action_link;
  if (signUpLink.error || !signUpUrl) {
    throw signUpLink.error ?? new Error("Could not generate a signup link");
  }

  return signUpUrl;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resendFrom = Deno.env.get("RESEND_FROM") || "Kelya Group <info@genessible.com>";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    let payload: LoginMagicLinkRequest;
    try {
      payload = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const email = payload.email?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "A valid email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const requestOrigin = req.headers.get("origin");
    const fallbackSiteUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://learn-submit.lovable.app";
    const baseUrl = requestOrigin && requestOrigin.startsWith("http") ? requestOrigin : fallbackSiteUrl;
    const redirectTo = `${baseUrl}/etudiant/login`;

    const actionLink = await generateAuthLink(supabaseAdmin, email, redirectTo);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [email],
        subject: "Connexion à votre espace",
        html: `
          <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 10px; overflow: hidden; border: 1px solid #e5e7eb;">
            <div style="background: linear-gradient(135deg, #1a2744, #c7253e); padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 20px;">Kelya Group × Hacktualiz</h1>
            </div>
            <div style="padding: 24px; color: #1f2937;">
              <h2 style="margin: 0 0 12px; font-size: 18px;">Votre lien de connexion</h2>
              <p style="margin: 0 0 20px; color: #4b5563;">Cliquez sur le bouton ci-dessous pour accéder à votre espace.</p>
              <a href="${actionLink}" style="display: inline-block; background: #c7253e; color: white; text-decoration: none; padding: 12px 22px; border-radius: 8px; font-weight: 600;">
                Se connecter
              </a>
              <p style="margin: 20px 0 0; color: #6b7280; font-size: 13px;">Si vous n'avez pas demandé ce lien, vous pouvez ignorer cet email.</p>
            </div>
          </div>
        `,
      }),
    });

    const responseText = await emailResponse.text();
    let resendPayload: unknown = null;
    try {
      resendPayload = responseText ? JSON.parse(responseText) : null;
    } catch {
      resendPayload = responseText;
    }

    if (!emailResponse.ok) {
      const errorMessage =
        typeof resendPayload === "object" && resendPayload && "message" in (resendPayload as Record<string, unknown>)
          ? String((resendPayload as Record<string, unknown>).message)
          : "Failed to send login email";

      await logEmailAttempt(supabaseAdmin, email, "failed", errorMessage, resendPayload);

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    await logEmailAttempt(supabaseAdmin, email, "success", null, resendPayload);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Login link sent successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error: any) {
    console.error("Error in send-login-magic-link:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unexpected error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
};

serve(handler);
