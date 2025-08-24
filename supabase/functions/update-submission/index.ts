import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Validation schema for the request body
const validateUpdatePayload = (body: any) => {
  const errors: string[] = []
  
  if (!body.submissionId || typeof body.submissionId !== 'string') {
    errors.push('submissionId is required and must be a string')
  }
  
  if (body.status && !['received', 'in_review', 'approved', 'rejected'].includes(body.status)) {
    errors.push('status must be one of: received, in_review, approved, rejected')
  }
  
  if (body.grade !== undefined && body.grade !== null) {
    if (typeof body.grade !== 'number' || body.grade < 0 || body.grade > 20) {
      errors.push('grade must be a number between 0 and 20')
    }
  }
  
  if (body.feedback && typeof body.feedback !== 'string') {
    errors.push('feedback must be a string')
  }
  
  return errors
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

    // 1) Caller identity (uses caller's JWT from Authorization header)
    const anon = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    })
    
    const { data: auth, error: authErr } = await anon.auth.getUser()
    if (authErr || !auth?.user) {
      console.error('Authentication failed:', authErr)
      return new Response(
        JSON.stringify({ error: "unauthorized" }), 
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
        JSON.stringify({ error: "admin_check_failed" }), 
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }
    if (!isAdmin) {
      console.error("User is not admin:", auth.user.id)
      return new Response(
        JSON.stringify({ error: "forbidden" }), 
        { 
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    // 3) Validate body
    const body = await req.json()
    const validationErrors = validateUpdatePayload(body)
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ error: "validation_failed", details: validationErrors }), 
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    // Build partial update
    const update: Record<string, unknown> = {}
    if (typeof body.status !== "undefined") update.status = body.status
    if (typeof body.grade !== "undefined") update.grade = body.grade  // number or null
    if (typeof body.feedback !== "undefined") update.feedback = body.feedback

    console.log('Updating submission:', body.submissionId, 'with:', update)

    // 4) Service-role client for the write (bypasses RLS after admin check)
    const service = createClient(SUPABASE_URL, SERVICE_KEY)
    const { error: updErr } = await service
      .from("submissions")
      .update(update)
      .eq("id", body.submissionId)

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

    console.log('Submission updated successfully:', body.submissionId)

    return new Response(
      JSON.stringify({ ok: true }), 
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } catch (e) {
    console.error("update-submission unhandled error", e)
    const msg = typeof e?.message === "string" ? e.message : "server_error"
    return new Response(
      JSON.stringify({ error: msg }), 
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
})