import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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
    const { submissionId, filePath } = body

    if (!submissionId) {
      return new Response(
        JSON.stringify({ error: "validation_failed", detail: "submissionId is required" }), 
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    if (!filePath) {
      return new Response(
        JSON.stringify({ error: "validation_failed", detail: "filePath is required" }), 
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    // 4) Service-role client for the verification (bypasses RLS after admin check)
    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    })
    
    // 5) Verify the file belongs to the submission
    const { data: submission, error: subErr } = await service
      .from("submissions")
      .select("id, file1_url, file2_url, file3_url")
      .eq("id", submissionId)
      .single()

    if (subErr) {
      console.error("submission query error", subErr)
      return new Response(
        JSON.stringify({ error: "submission_not_found", detail: subErr.message }), 
        { 
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    // Check if the file path belongs to this submission
    const submissionFiles = [submission.file1_url, submission.file2_url, submission.file3_url].filter(Boolean)
    if (!submissionFiles.includes(filePath)) {
      console.error("File does not belong to submission:", filePath, submissionFiles)
      return new Response(
        JSON.stringify({ error: "forbidden", detail: "File does not belong to this submission" }), 
        { 
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    // 6) Generate signed URL for download
    const { data: signedUrlData, error: urlErr } = await service.storage
      .from('submissions')
      .createSignedUrl(filePath, 60, {
        download: true
      })

    if (urlErr) {
      console.error("signed URL generation error", urlErr)
      return new Response(
        JSON.stringify({ error: "url_generation_failed", detail: urlErr.message }), 
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    if (!signedUrlData?.signedUrl) {
      console.error("No signed URL generated")
      return new Response(
        JSON.stringify({ error: "url_generation_failed", detail: "No signed URL generated" }), 
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    console.log('Signed URL generated successfully for file:', filePath)

    return new Response(
      JSON.stringify({ 
        ok: true, 
        signedUrl: signedUrlData.signedUrl,
        fileName: filePath.split('/').pop() 
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } catch (e) {
    console.error("download-submission-file unhandled error", e)
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