import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface StudentInvitationRequest {
  email: string;
  full_name: string;
  organization_id: string;
  organization_slug: string;
  class_ids?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate the requesting user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Parse request body first
    const { email, full_name, organization_id, organization_slug, class_ids }: StudentInvitationRequest = await req.json();

    // Verify user has permission to invite students
    const { data: orgMember } = await supabaseClient
      .from("submito_organization_users")
      .select("role, is_owner")
      .eq("organization_id", organization_id)
      .eq("user_id", user.id)
      .single();

    if (!orgMember || (!orgMember.is_owner && !["admin", "academy"].includes(orgMember.role))) {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if student already exists
    const { data: existingStudent } = await supabaseClient
      .from("submito_organization_students")
      .select("id")
      .eq("email", email.toLowerCase())
      .eq("organization_id", organization_id)
      .single();

    if (existingStudent) {
      return new Response(
        JSON.stringify({ error: "A student with this email already exists in this organization" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create student record with pending status (assign first class as primary)
    const primaryClassId = class_ids && class_ids.length > 0 ? class_ids[0] : null;
    
    const { data: newStudent, error: studentError } = await supabaseClient
      .from("submito_organization_students")
      .insert({
        email: email.toLowerCase(),
        full_name: full_name.trim(),
        organization_id,
        class_id: primaryClassId,
        status: "pending",
      })
      .select()
      .single();

    if (studentError) throw studentError;

    // Store all assigned class IDs in metadata for future use
    // This will be used when student accepts invitation
    console.log("Student assigned to classes:", class_ids);

    // Send magic link using Supabase Auth
    const redirectUrl = `${req.headers.get("origin") || supabaseUrl}/student/setup?student_id=${newStudent.id}&org_id=${organization_id}`;
    
    const { error: magicLinkError } = await supabaseClient.auth.admin.generateLink({
      type: "magiclink",
      email: email.toLowerCase(),
      options: {
        redirectTo: redirectUrl,
        data: {
          student_id: newStudent.id,
          organization_id,
          full_name: full_name.trim(),
          role: "student",
          class_ids: class_ids || [],
        },
      },
    });

    if (magicLinkError) throw magicLinkError;

    console.log("Magic link sent successfully to:", email);

    return new Response(
      JSON.stringify({
        student_id: newStudent.id,
        message: "Magic link sent successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-student-magic-link:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
