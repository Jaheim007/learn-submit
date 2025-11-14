import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { filePath } = await req.json();

    if (!filePath) {
      return new Response(JSON.stringify({ error: 'filePath required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get student record
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (studentError || !student) {
      return new Response(JSON.stringify({ error: 'Student not found' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get class_id from file path (format: class_id/filename)
    const classIdFromPath = parseInt(filePath.split('/')[0]);

    if (isNaN(classIdFromPath)) {
      return new Response(JSON.stringify({ error: 'Invalid file path format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if student is enrolled in the class
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', student.id)
      .eq('class_id', classIdFromPath)
      .single();

    if (enrollmentError || !enrollment) {
      return new Response(JSON.stringify({ error: 'Access denied: not enrolled in this class' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve a friendly download file name from DB if possible
    const fileNameFromPath = filePath.split('/').pop() || 'file';
    const { data: record } = await supabase
      .from('course_materials')
      .select('file_name')
      .eq('file_url', filePath)
      .maybeSingle();
    const downloadName = record?.file_name || fileNameFromPath;

    // Create signed URL (60 seconds expiry) with forced download
    const { data: signedData, error: signedError } = await supabase.storage
      .from('course-materials')
      .createSignedUrl(filePath, 60, { download: downloadName });

    if (signedError || !signedData?.signedUrl) {
      console.error('Signed URL error:', signedError);
      return new Response(JSON.stringify({ error: 'Failed to generate download URL' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ signedUrl: signedData.signedUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Download course material error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
