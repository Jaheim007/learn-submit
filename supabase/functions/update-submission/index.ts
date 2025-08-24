import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

    // 1) Caller identity (uses caller's JWT from Authorization header)
    const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    })
    
    const { data: auth, error: authErr } = await anon.auth.getUser()
    if (authErr || !auth?.user) {
      console.error('Authentication failed:', authErr)
      return new Response(
        JSON.stringify({ error: "unauthorized", detail: "Authentication required" }), 
        { 
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    // 2) Admin check
    const { data: isAdmin, error: adminErr } = await anon.rpc("is_admin")
    if (adminErr) {
      console.error("is_admin RPC error", adminErr)
      return new Response(
        JSON.stringify({ error: "admin_check_failed", detail: adminErr.message }), 
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }
    if (!isAdmin) {
      console.error("User is not admin:", auth.user.id)
      return new Response(
        JSON.stringify({ error: "forbidden", detail: "Admin access required" }), 
        { 
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    // 3) Parse and validate request body
    const body = await req.json()
    const { submissionId, status, grade, feedback } = body

    if (!submissionId || typeof submissionId !== 'string') {
      return new Response(
        JSON.stringify({ error: "validation_failed", detail: "submissionId is required" }), 
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    if (status && !['received', 'in_review', 'approved', 'rejected'].includes(status)) {
      return new Response(
        JSON.stringify({ error: "validation_failed", detail: "Invalid status value" }), 
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    if (grade !== undefined && grade !== null && (typeof grade !== 'number' || grade < 0 || grade > 20)) {
      return new Response(
        JSON.stringify({ error: "validation_failed", detail: "Grade must be a number between 0 and 20" }), 
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    // Build partial update
    const update: Record<string, unknown> = {}
    if (status !== undefined) update.status = status
    if (grade !== undefined) update.grade = grade
    if (feedback !== undefined) update.feedback = feedback

    console.log('Updating submission:', submissionId, 'with:', update)

    // 4) Service-role client for the write (bypasses RLS after admin check)
    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    })
    
    const { error: updErr } = await service
      .from("submissions")
      .update(update)
      .eq("id", submissionId)

    if (updErr) {
      console.error("update-submission DB error", updErr)
      return new Response(
        JSON.stringify({ error: "db_update_failed", detail: updErr.message }), 
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    console.log('Submission updated successfully:', submissionId)

    return new Response(
      JSON.stringify({ ok: true }), 
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } catch (e) {
    console.error("update-submission unhandled error", e)
    const errorDetail = e instanceof Error ? e.message : String(e)
    return new Response(
      JSON.stringify({ error: "server_error", detail: errorDetail }), 
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
})