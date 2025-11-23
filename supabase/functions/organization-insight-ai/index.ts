import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Get user and organization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get organization
    const { data: membership } = await supabaseClient
      .from('submito_organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      throw new Error('Organization not found');
    }

    const orgId = membership.organization_id;

    // Fetch organization data for context
    const { count: totalStudents } = await supabaseClient
      .from('submito_organization_students')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId);

    const { count: activeStudents } = await supabaseClient
      .from('submito_organization_students')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'active');

    const { count: activeCourses } = await supabaseClient
      .from('submito_organization_courses')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('is_active', true);

    const { data: submissions } = await supabaseClient
      .from('submito_organization_submissions')
      .select('grade, status')
      .eq('organization_id', orgId);

    const averageGrade = submissions && submissions.length > 0
      ? submissions.filter(s => s.grade).reduce((sum, s) => sum + (s.grade || 0), 0) / submissions.filter(s => s.grade).length
      : 0;

    const orgContext = `
Organization Statistics:
- Total Students: ${totalStudents || 0}
- Active Students: ${activeStudents || 0}
- Active Courses: ${activeCourses || 0}
- Total Submissions: ${submissions?.length || 0}
- Average Grade: ${Math.round(averageGrade)}%
`;

    const systemPrompt = `You are an AI assistant helping analyze organization performance data. 
    
${orgContext}

Provide clear, concise, and actionable insights based on the data. When answering questions:
- Use the statistics provided above
- Be specific with numbers and percentages
- Offer recommendations when appropriate
- Keep responses brief but informative
- If asked about data you don't have, politely explain that`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ message: aiMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in organization-insight-ai:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
