import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { cohort, projectId, statusFilter, lastVersionsOnly } = await req.json();

    console.log('Fetching leaderboard:', { cohort, projectId, statusFilter, lastVersionsOnly });

    // Define cohort class codes
    const cohortMap: Record<string, string[]> = {
      'phase1': ['G1', 'G2', 'G3', 'G4', 'G5'],
      'phase2': ['G6', 'G7', 'G8', 'G9', 'G10', 'G11', 'G12'],
      'phase3': ['G31', 'G32', 'G33', 'G34', 'G35'],
      'advanced': ['AH']
    };

    const classCodes = cohortMap[cohort];
    if (!classCodes) {
      return new Response(
        JSON.stringify({ error: 'Invalid cohort' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the query
    let query = supabase
      .from('submissions')
      .select(`
        id,
        student_id,
        project_id,
        class_id,
        version,
        submitted_at,
        status,
        grade,
        students!inner(
          id,
          full_name,
          email
        ),
        classes!inner(
          code,
          title
        ),
        projects!inner(
          code,
          title
        )
      `)
      .eq('project_id', projectId);

    // Filter by status if not "all"
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    // Filter by last versions only if enabled
    if (lastVersionsOnly) {
      query = query.eq('is_latest', true);
    }

    const { data: submissions, error } = await query;

    if (error) {
      console.error('Error fetching submissions:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter by cohort class codes
    const filteredSubmissions = submissions.filter(sub => 
      classCodes.includes(sub.classes.code)
    );

    // If not last versions only, manually get the latest version per student
    let processedSubmissions = filteredSubmissions;
    if (!lastVersionsOnly) {
      const studentLatestVersions = new Map<string, any>();
      
      filteredSubmissions.forEach(sub => {
        const key = `${sub.student_id}-${sub.project_id}`;
        const existing = studentLatestVersions.get(key);
        
        if (!existing || sub.version > existing.version) {
          studentLatestVersions.set(key, sub);
        }
      });
      
      processedSubmissions = Array.from(studentLatestVersions.values());
    }

    // Sort by grade (desc, nulls last) then by submitted_at (asc)
    const sorted = processedSubmissions.sort((a, b) => {
      if (a.grade === null && b.grade === null) {
        return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
      }
      if (a.grade === null) return 1;
      if (b.grade === null) return -1;
      if (b.grade !== a.grade) return b.grade - a.grade;
      return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
    });

    // Assign dense rank
    let currentRank = 0;
    let previousGrade = undefined;
    const ranked = sorted.map(sub => {
      if (sub.grade !== previousGrade) {
        currentRank++;
        previousGrade = sub.grade;
      }
      
      return {
        rank: sub.grade !== null ? currentRank : null,
        student_id: sub.student_id,
        student_name: sub.students.full_name || sub.students.email,
        class_code: sub.classes.code,
        class_title: sub.classes.title,
        project_code: sub.projects.code,
        project_title: sub.projects.title,
        version: sub.version,
        submitted_at: sub.submitted_at,
        status: sub.status,
        grade: sub.grade,
        submission_id: sub.id
      };
    });

    console.log(`Returning ${ranked.length} ranked submissions`);

    return new Response(
      JSON.stringify({ data: ranked }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-leaderboard:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
