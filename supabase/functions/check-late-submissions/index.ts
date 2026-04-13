import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const now = new Date();

    // 1. Find projects with deadlines that have passed
    const { data: projects } = await supabase
      .from("projects")
      .select("id, title, code, deadline_at, class_projects(class_id)")
      .eq("is_active", true)
      .not("deadline_at", "is", null)
      .lt("deadline_at", now.toISOString());

    if (!projects || projects.length === 0) {
      return new Response(JSON.stringify({ message: "No overdue projects" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let notificationsCreated = 0;
    let emailsSent = 0;

    for (const project of projects) {
      const classIds = (project.class_projects || []).map((cp: any) => cp.class_id);
      if (classIds.length === 0) continue;

      // Get enrolled students
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("student_id, students!inner(id, full_name, email, user_id)")
        .in("class_id", classIds);

      if (!enrollments) continue;

      // Get students who already submitted
      const { data: submissions } = await supabase
        .from("submissions")
        .select("student_id")
        .eq("project_id", project.id)
        .eq("is_latest", true);

      const submittedIds = new Set((submissions || []).map((s: any) => s.student_id));

      for (const enrollment of enrollments) {
        const student = enrollment.students as any;
        if (!student || submittedIds.has(student.id)) continue;

        // Check if notification already sent today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const { data: existingNotif } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", student.user_id)
          .eq("type", "late_submission")
          .gte("created_at", todayStart.toISOString())
          .limit(1);

        if (existingNotif && existingNotif.length > 0) continue;

        // Create in-app notification
        await supabase.from("notifications").insert({
          user_id: student.user_id,
          title: "⚠️ Soumission en retard",
          body: `Vous n'avez pas encore soumis le projet "${project.title}" (${project.code}). La deadline est dépassée.`,
          type: "late_submission",
          metadata: { project_id: project.id, project_code: project.code },
        });
        notificationsCreated++;

        // Send email
        if (student.email) {
          try {
            await fetch(`${GATEWAY_URL}/emails`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "X-Connection-Api-Key": RESEND_API_KEY,
              },
              body: JSON.stringify({
                from: "Hacktualiz <info@genessible.com>",
                to: [student.email],
                subject: `⚠️ Soumission en retard — ${project.title}`,
                html: buildLateEmailHtml(student.full_name || "Étudiant", project.title, project.code),
              }),
            });
            emailsSent++;
          } catch (e) {
            console.error("Email error:", e);
          }
        }
      }
    }

    // Notify admins/academy
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "academy", "super_admin"]);

    if (adminRoles && notificationsCreated > 0) {
      for (const admin of adminRoles) {
        await supabase.from("notifications").insert({
          user_id: admin.user_id,
          title: "📊 Rapport soumissions en retard",
          body: `${notificationsCreated} étudiant(s) n'ont pas soumis avant la deadline aujourd'hui.`,
          type: "admin_late_report",
        });
      }
    }

    return new Response(
      JSON.stringify({ notificationsCreated, emailsSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildLateEmailHtml(name: string, projectTitle: string, projectCode: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5">
<div style="max-width:600px;margin:0 auto;padding:20px">
<div style="background:linear-gradient(135deg,#6c5ce7,#4f46e5);border-radius:12px;padding:30px;color:white;text-align:center">
<h1 style="margin:0;font-size:24px">⚠️ Soumission en retard</h1>
<p style="margin:10px 0 0;opacity:0.9">Hacktualiz — NYS Africa</p>
</div>
<div style="background:white;border-radius:12px;padding:30px;margin-top:16px">
<p style="color:#333;font-size:16px">Bonjour <strong>${name}</strong>,</p>
<p style="color:#555;line-height:1.6">La deadline pour le projet <strong>"${projectTitle}"</strong> (${projectCode}) est <strong>dépassée</strong> et nous n'avons pas encore reçu votre soumission.</p>
<p style="color:#555;line-height:1.6">Veuillez soumettre votre travail dès que possible sur la plateforme.</p>
<div style="text-align:center;margin:25px 0">
<a href="https://learn-submit.lovable.app/etudiant/projets" style="background:linear-gradient(135deg,#6c5ce7,#4f46e5);color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:600;display:inline-block">Soumettre maintenant</a>
</div>
</div>
<p style="text-align:center;color:#999;font-size:12px;margin-top:16px">© ${new Date().getFullYear()} Hacktualiz — NYS Africa</p>
</div></body></html>`;
}
