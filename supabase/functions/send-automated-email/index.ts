import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type EventType = 'new_course_material' | 'new_project' | 'deadline_reminder';

interface AutoEmailRequest {
  event_type: EventType;
  // For new_course_material
  material_id?: string;
  // For new_project  
  project_id?: number;
  // For deadline_reminder - called by cron, no params needed
}

function getEmailTemplate(type: EventType, data: Record<string, any>): { subject: string; html: string } {
  const brandHeader = `
    <div style="background: linear-gradient(135deg, #4f46e5, #6366f1); padding: 24px; text-align: center;">
      <h1 style="color: white; font-family: 'Space Grotesk', sans-serif; margin: 0; font-size: 20px;">
        Hacktualiz INC
      </h1>
    </div>`;

  const brandFooter = `
    <div style="padding: 16px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #eee;">
      <p>Hacktualiz INC — Formation · Certification · Intégration</p>
    </div>`;

  switch (type) {
    case 'new_course_material':
      return {
        subject: `📚 Nouveau cours : ${data.title}`,
        html: `
          <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
            ${brandHeader}
            <div style="padding: 24px;">
              <h2 style="color: #1a2744; margin-top: 0;">Nouveau contenu de cours disponible</h2>
              <p style="color: #555;">Un nouveau matériel a été ajouté à votre classe <strong>${data.class_title}</strong> :</p>
              <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <h3 style="margin: 0 0 8px; color: #1a2744;">${data.title}</h3>
                ${data.description ? `<p style="margin: 0; color: #666;">${data.description}</p>` : ''}
              </div>
              <a href="${data.site_url}/etudiant/cours" style="display: inline-block; background: linear-gradient(135deg, #4f46e5, #6366f1); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Accéder au cours →
              </a>
            </div>
            ${brandFooter}
          </div>`,
      };

    case 'new_project':
      return {
        subject: `🎯 Nouveau projet : ${data.title}`,
        html: `
          <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
            ${brandHeader}
            <div style="padding: 24px;">
              <h2 style="color: #1a2744; margin-top: 0;">Nouveau projet assigné</h2>
              <p style="color: #555;">Un nouveau projet a été ajouté pour votre classe :</p>
              <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <h3 style="margin: 0 0 8px; color: #1a2744;">${data.title}</h3>
                ${data.description ? `<p style="margin: 0 0 8px; color: #666;">${data.description}</p>` : ''}
                ${data.deadline ? `<p style="margin: 0; color: #6366f1; font-weight: 600;">📅 Date limite : ${data.deadline}</p>` : ''}
              </div>
              <a href="${data.site_url}/etudiant/projets" style="display: inline-block; background: linear-gradient(135deg, #4f46e5, #6366f1); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Voir le projet →
              </a>
            </div>
            ${brandFooter}
          </div>`,
      };

    case 'deadline_reminder':
      return {
        subject: `⏰ Rappel : "${data.project_title}" expire dans 48h`,
        html: `
          <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
            ${brandHeader}
            <div style="padding: 24px;">
              <h2 style="color: #6366f1; margin-top: 0;">⏰ Rappel d'échéance</h2>
              <p style="color: #555;">Le projet suivant arrive à échéance bientôt :</p>
              <div style="background: #fff3f3; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #6366f1;">
                <h3 style="margin: 0 0 8px; color: #1a2744;">${data.project_title}</h3>
                <p style="margin: 0; color: #6366f1; font-weight: 600;">📅 Date limite : ${data.deadline}</p>
              </div>
              <p style="color: #555;">N'oubliez pas de soumettre votre travail avant la date limite !</p>
              <a href="${data.site_url}/etudiant/projets" style="display: inline-block; background: linear-gradient(135deg, #4f46e5, #6366f1); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Soumettre maintenant →
              </a>
            </div>
            ${brandFooter}
          </div>`,
      };
  }
}

async function logEmailAttempt(
  supabase: any,
  emailType: string,
  recipientEmail: string,
  status: 'success' | 'failed',
  errorMessage: string | null,
  resendResponse: unknown,
) {
  const { error } = await supabase.from('email_send_logs').insert({
    email_type: emailType,
    recipient_email: recipientEmail,
    recipient_name: null,
    status,
    error_message: errorMessage,
    resend_response: resendResponse,
  });

  if (error) {
    console.error('Failed to log automated email attempt:', error.message);
  }
}

async function sendViaResend(
  supabase: any,
  to: string[],
  subject: string,
  html: string,
  emailType: string,
) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  const RESEND_FROM = Deno.env.get('RESEND_FROM') || 'Hacktualiz <info@genessible.com>';
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');

  let sent = 0;
  for (const email of to) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: RESEND_FROM, to: [email], subject, html }),
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
        : typeof parsedBody === 'object' && parsedBody && 'message' in (parsedBody as Record<string, unknown>)
          ? String((parsedBody as Record<string, unknown>).message)
          : 'Resend request failed';

      await logEmailAttempt(
        supabase,
        emailType,
        email,
        res.ok ? 'success' : 'failed',
        errorMessage,
        parsedBody,
      );

      if (res.ok) {
        sent++;
      } else {
        console.error(`Resend error for ${email}:`, parsedBody);
      }
    } catch (e: any) {
      const errorMessage = e?.message || 'Unexpected send error';
      console.error(`Send failed for ${email}:`, errorMessage);
      await logEmailAttempt(supabase, emailType, email, 'failed', errorMessage, null);
    }
  }
  return sent;
}

async function sendViaResendWithMeta(
  supabase: any,
  to: string[],
  subject: string,
  html: string,
  emailType: string,
  meta: Record<string, any>,
) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  const RESEND_FROM = Deno.env.get('RESEND_FROM') || 'Hacktualiz <info@genessible.com>';
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');

  let sent = 0;
  for (const email of to) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: RESEND_FROM, to: [email], subject, html }),
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
        : typeof parsedBody === 'object' && parsedBody && 'message' in (parsedBody as Record<string, unknown>)
          ? String((parsedBody as Record<string, unknown>).message)
          : 'Resend request failed';

      // Store meta (project_id) in resend_response for dedup tracking
      const responseWithMeta = { ...(typeof parsedBody === 'object' ? parsedBody : {}), ...meta };

      await logEmailAttempt(
        supabase,
        emailType,
        email,
        res.ok ? 'success' : 'failed',
        errorMessage,
        responseWithMeta,
      );

      if (res.ok) {
        sent++;
      } else {
        console.error(`Resend error for ${email}:`, parsedBody);
      }
    } catch (e: any) {
      const errorMessage = e?.message || 'Unexpected send error';
      console.error(`Send failed for ${email}:`, errorMessage);
      await logEmailAttempt(supabase, emailType, email, 'failed', errorMessage, meta);
    }
  }
  return sent;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const siteUrl = Deno.env.get('PUBLIC_SITE_URL') || 'https://learn-submit.lovable.app';
    const { event_type, material_id, project_id }: AutoEmailRequest = await req.json();

    console.log('Automated email event:', event_type);

    if (event_type === 'new_course_material' && material_id) {
      // Get course material details
      const { data: material } = await supabase
        .from('course_materials')
        .select('title, description, class_id, classes!inner(title)')
        .eq('id', material_id)
        .single();

      if (!material) {
        return new Response(JSON.stringify({ error: 'Material not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get student emails in class
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('students!inner(email)')
        .eq('class_id', material.class_id);

      const emails = (enrollments || [])
        .map((e: any) => e.students?.email)
        .filter(Boolean);

      if (emails.length === 0) {
        return new Response(JSON.stringify({ sent: 0, message: 'No students enrolled' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { subject, html } = getEmailTemplate('new_course_material', {
        title: material.title,
        description: material.description,
        class_title: (material as any).classes?.title,
        site_url: siteUrl,
      });

      const sent = await sendViaResend(supabase, emails, subject, html, 'automation_new_course_material');
      return new Response(JSON.stringify({ success: true, sent, total: emails.length }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (event_type === 'new_project' && project_id) {
      // Get project details
      const { data: project } = await supabase
        .from('projects')
        .select('title, description, deadline_at')
        .eq('id', project_id)
        .single();

      if (!project) {
        return new Response(JSON.stringify({ error: 'Project not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get classes for this project
      const { data: classProjects } = await supabase
        .from('class_projects')
        .select('class_id')
        .eq('project_id', project_id);

      const classIds = (classProjects || []).map((cp: any) => cp.class_id);

      if (classIds.length === 0) {
        return new Response(JSON.stringify({ sent: 0, message: 'No classes assigned' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('students!inner(email)')
        .in('class_id', classIds);

      const emails = [...new Set(
        (enrollments || []).map((e: any) => e.students?.email).filter(Boolean)
      )];

      const deadline = project.deadline_at 
        ? new Date(project.deadline_at).toLocaleDateString('fr-FR', { dateStyle: 'long' })
        : null;

      const { subject, html } = getEmailTemplate('new_project', {
        title: project.title,
        description: project.description,
        deadline,
        site_url: siteUrl,
      });

      const sent = await sendViaResend(supabase, emails, subject, html, 'automation_new_project');
      return new Response(JSON.stringify({ success: true, sent, total: emails.length }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (event_type === 'deadline_reminder') {
      // Find projects with deadlines in the next 48 hours
      const now = new Date();
      const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      const { data: projects } = await supabase
        .from('projects')
        .select('id, title, deadline_at')
        .gte('deadline_at', now.toISOString())
        .lte('deadline_at', in48h.toISOString())
        .eq('is_active', true);

      if (!projects || projects.length === 0) {
        return new Response(JSON.stringify({ sent: 0, message: 'No upcoming deadlines' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Dedup: check which reminder emails were already sent today
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);

      const { data: alreadySentLogs } = await supabase
        .from('email_send_logs')
        .select('recipient_email, resend_response')
        .eq('email_type', 'automation_deadline_reminder')
        .eq('status', 'success')
        .gte('created_at', todayStart.toISOString());

      // Build a set of "email::project_id" keys already sent today
      const alreadySentKeys = new Set<string>();
      for (const log of alreadySentLogs || []) {
        // We store project_id in resend_response metadata
        const projectId = (log.resend_response as any)?.project_id;
        if (projectId) {
          alreadySentKeys.add(`${log.recipient_email}::${projectId}`);
        }
      }

      let totalSent = 0;

      for (const project of projects) {
        // Get classes
        const { data: classProjects } = await supabase
          .from('class_projects')
          .select('class_id')
          .eq('project_id', project.id);

        const classIds = (classProjects || []).map((cp: any) => cp.class_id);
        if (classIds.length === 0) continue;

        // Get students who haven't submitted yet
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('student_id, students!inner(email, id)')
          .in('class_id', classIds);

        if (!enrollments || enrollments.length === 0) continue;

        // Check who already submitted
        const studentIds = enrollments.map((e: any) => e.students.id);
        const { data: submissions } = await supabase
          .from('submissions')
          .select('student_id')
          .eq('project_id', project.id)
          .in('student_id', studentIds);

        const submittedIds = new Set((submissions || []).map((s: any) => s.student_id));

        // Filter out students who submitted OR already received this reminder today
        const emails = [...new Set(
          enrollments
            .filter((e: any) => {
              if (submittedIds.has(e.students.id)) return false;
              const key = `${e.students.email}::${project.id}`;
              if (alreadySentKeys.has(key)) return false;
              return true;
            })
            .map((e: any) => e.students.email)
            .filter(Boolean)
        )];

        if (emails.length === 0) continue;

        const deadline = new Date(project.deadline_at).toLocaleDateString('fr-FR', { dateStyle: 'long' });

        const { subject, html } = getEmailTemplate('deadline_reminder', {
          project_title: project.title,
          deadline,
          site_url: siteUrl,
        });

        // Send with project_id metadata for dedup tracking
        const sent = await sendViaResendWithMeta(supabase, emails, subject, html, 'automation_deadline_reminder', { project_id: project.id });
        totalSent += sent;

        // Create in-app notifications only for students not yet notified today
        const studentsToNotify = enrollments
          .filter((e: any) => {
            if (submittedIds.has(e.students.id)) return false;
            const key = `${e.students.email}::${project.id}`;
            if (alreadySentKeys.has(key)) return false;
            return true;
          })
          .map((e: any) => e.students);

        for (const student of studentsToNotify) {
          await supabase.from('notifications').insert({
            user_id: student.id,
            type: 'deadline_reminder',
            title: '⏰ Rappel d\'échéance',
            body: `Le projet "${project.title}" expire le ${deadline}. N'oubliez pas de soumettre !`,
            metadata: { project_id: project.id },
          }).then(() => {});
        }
      }

      return new Response(JSON.stringify({ success: true, sent: totalSent }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown event_type' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in send-automated-email:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
