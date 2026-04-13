import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type EmailType =
  | "new_project"
  | "deadline_reminder"
  | "submission_received"
  | "submission_graded"
  | "new_course"
  | "new_course_material"
  | "welcome_student"
  | "deadline_reminder_teacher";

interface EmailRequest {
  type: EmailType;
  data: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, data } = (await req.json()) as EmailRequest;
    let result = { sent: 0, errors: 0 };

    switch (type) {
      case "new_project":
        result = await handleNewProject(data);
        break;
      case "deadline_reminder":
        result = await handleDeadlineReminder(data);
        break;
      case "submission_received":
        result = await handleSubmissionReceived(data);
        break;
      case "submission_graded":
        result = await handleSubmissionGraded(data);
        break;
      case "new_course":
      case "new_course_material":
        result = await handleNewCourse(data);
        break;
      case "welcome_student":
        result = await handleWelcomeStudent(data);
        break;
      default:
        return new Response(JSON.stringify({ error: "Unknown email type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: "Hacktualiz <info@genessible.com>",
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) throw new Error(`Resend error: ${res.status}`);
  return res.json();
}

function wrap(title: string, content: string, ctaUrl?: string, ctaText?: string): string {
  const cta = ctaUrl
    ? `<div style="text-align:center;margin:25px 0"><a href="${ctaUrl}" style="background:linear-gradient(135deg,#6c5ce7,#4f46e5);color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:600;display:inline-block">${ctaText || "Accéder à la plateforme"}</a></div>`
    : "";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5">
<div style="max-width:600px;margin:0 auto;padding:20px">
<div style="background:linear-gradient(135deg,#6c5ce7,#4f46e5);border-radius:12px;padding:30px;color:white;text-align:center">
<h1 style="margin:0;font-size:22px">${title}</h1>
<p style="margin:8px 0 0;opacity:0.9;font-size:13px">Hacktualiz — NYS Africa</p>
</div>
<div style="background:white;border-radius:12px;padding:30px;margin-top:16px;color:#333;line-height:1.6">
${content}
${cta}
</div>
<p style="text-align:center;color:#999;font-size:12px;margin-top:16px">© ${new Date().getFullYear()} Hacktualiz — NYS Africa</p>
</div></body></html>`;
}

async function handleNewProject(data: Record<string, any>) {
  const { projectTitle, projectCode, deadline, classIds } = data;
  if (!classIds || classIds.length === 0) return { sent: 0, errors: 0 };

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("students!inner(email, full_name)")
    .in("class_id", classIds);

  let sent = 0, errors = 0;
  const seen = new Set<string>();

  for (const e of enrollments || []) {
    const student = e.students as any;
    if (!student?.email || seen.has(student.email)) continue;
    seen.add(student.email);

    try {
      const deadlineStr = deadline ? new Date(deadline).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Non définie";
      await sendEmail(
        student.email,
        `📁 Nouveau projet : ${projectTitle}`,
        wrap("📁 Nouveau projet disponible",
          `<p>Bonjour <strong>${student.full_name || "Étudiant"}</strong>,</p>
          <p>Un nouveau projet a été ajouté à votre programme :</p>
          <div style="background:#f8f7ff;border-radius:8px;padding:16px;margin:16px 0">
            <p style="margin:0"><strong>Projet :</strong> ${projectTitle} (${projectCode})</p>
            <p style="margin:8px 0 0"><strong>Deadline :</strong> ${deadlineStr}</p>
          </div>
          <p>Commencez dès maintenant pour avoir le temps de bien réaliser votre travail.</p>`,
          "https://learn-submit.lovable.app/etudiant/projets", "Voir le projet"
        )
      );
      sent++;
    } catch { errors++; }
  }
  return { sent, errors };
}

async function handleDeadlineReminder(data: Record<string, any>) {
  const { hoursBeforeDeadline } = data;
  const now = new Date();
  const future = new Date(now.getTime() + (hoursBeforeDeadline || 24) * 60 * 60 * 1000);

  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, code, deadline_at, class_projects(class_id)")
    .eq("is_active", true)
    .not("deadline_at", "is", null)
    .gt("deadline_at", now.toISOString())
    .lte("deadline_at", future.toISOString());

  let sent = 0, errors = 0;

  for (const project of projects || []) {
    const classIds = (project.class_projects || []).map((cp: any) => cp.class_id);
    if (classIds.length === 0) continue;

    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("student_id, students!inner(id, email, full_name, user_id)")
      .in("class_id", classIds);

    const { data: submissions } = await supabase
      .from("submissions")
      .select("student_id")
      .eq("project_id", project.id)
      .eq("is_latest", true);

    const submittedIds = new Set((submissions || []).map((s: any) => s.student_id));
    const seen = new Set<string>();

    for (const e of enrollments || []) {
      const student = e.students as any;
      if (!student?.email || submittedIds.has(student.id) || seen.has(student.email)) continue;
      seen.add(student.email);

      const deadlineDate = new Date(project.deadline_at!);
      const hoursLeft = Math.round((deadlineDate.getTime() - now.getTime()) / (60 * 60 * 1000));
      const timeLabel = hoursLeft <= 1 ? "moins d'1 heure" : hoursLeft <= 6 ? `${hoursLeft} heures` : `${Math.round(hoursLeft / 24)} jour(s)`;

      try {
        await sendEmail(
          student.email,
          `⏰ Rappel : ${project.title} — il reste ${timeLabel}`,
          wrap("⏰ Rappel de deadline",
            `<p>Bonjour <strong>${student.full_name || "Étudiant"}</strong>,</p>
            <p>Il vous reste <strong>${timeLabel}</strong> pour soumettre le projet :</p>
            <div style="background:#fff3e0;border-radius:8px;padding:16px;margin:16px 0;border-left:4px solid #f59e0b">
              <p style="margin:0"><strong>${project.title}</strong> (${project.code})</p>
              <p style="margin:8px 0 0">Deadline : <strong>${deadlineDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })}</strong></p>
            </div>
            <p>Ne manquez pas cette échéance !</p>`,
            "https://learn-submit.lovable.app/etudiant/projets", "Soumettre maintenant"
          )
        );
        sent++;

        await supabase.from("notifications").insert({
          user_id: student.user_id,
          title: `⏰ Rappel — ${project.title}`,
          body: `Il reste ${timeLabel} pour soumettre "${project.title}".`,
          type: "deadline_reminder",
          metadata: { project_id: project.id },
        });
      } catch { errors++; }
    }
  }
  return { sent, errors };
}

async function handleSubmissionReceived(data: Record<string, any>) {
  const { studentEmail, studentName, projectTitle, projectCode } = data;
  if (!studentEmail) return { sent: 0, errors: 0 };

  try {
    await sendEmail(
      studentEmail,
      `✅ Soumission reçue — ${projectTitle}`,
      wrap("✅ Soumission reçue",
        `<p>Bonjour <strong>${studentName || "Étudiant"}</strong>,</p>
        <p>Votre soumission pour le projet <strong>"${projectTitle}"</strong> (${projectCode}) a bien été reçue.</p>
        <p>Elle sera examinée par un formateur prochainement.</p>`,
        "https://learn-submit.lovable.app/etudiant/soumissions", "Voir mes soumissions"
      )
    );
    return { sent: 1, errors: 0 };
  } catch { return { sent: 0, errors: 1 }; }
}

async function handleSubmissionGraded(data: Record<string, any>) {
  const { studentEmail, studentName, projectTitle, grade, status, feedback } = data;
  if (!studentEmail) return { sent: 0, errors: 0 };

  const statusLabels: Record<string, string> = {
    approved: "✅ Validé", rejected: "❌ Refusé", reviewing: "🔍 En révision", in_review: "🔍 En révision", resubmit: "🔄 À resoumettre",
  };

  try {
    await sendEmail(
      studentEmail,
      `📊 Évaluation — ${projectTitle}`,
      wrap("📊 Votre soumission a été évaluée",
        `<p>Bonjour <strong>${studentName || "Étudiant"}</strong>,</p>
        <p>Votre soumission pour <strong>"${projectTitle}"</strong> a été évaluée :</p>
        <div style="background:#f8f7ff;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:0"><strong>Statut :</strong> ${statusLabels[status] || status}</p>
          ${grade != null ? `<p style="margin:8px 0 0"><strong>Note :</strong> ${grade}/20</p>` : ""}
          ${feedback ? `<p style="margin:8px 0 0"><strong>Feedback :</strong> ${feedback.substring(0, 200)}${feedback.length > 200 ? "..." : ""}</p>` : ""}
        </div>`,
        "https://learn-submit.lovable.app/etudiant/soumissions", "Voir le détail"
      )
    );
    return { sent: 1, errors: 0 };
  } catch { return { sent: 0, errors: 1 }; }
}

async function handleNewCourse(data: Record<string, any>) {
  const { courseTitle, classId, title } = data;
  const actualTitle = courseTitle || title || "Nouveau cours";
  if (!classId) return { sent: 0, errors: 0 };

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("students!inner(email, full_name)")
    .eq("class_id", classId);

  let sent = 0, errors = 0;
  const seen = new Set<string>();

  for (const e of enrollments || []) {
    const student = e.students as any;
    if (!student?.email || seen.has(student.email)) continue;
    seen.add(student.email);

    try {
      await sendEmail(
        student.email,
        `📚 Nouveau cours : ${actualTitle}`,
        wrap("📚 Nouveau cours disponible",
          `<p>Bonjour <strong>${student.full_name || "Étudiant"}</strong>,</p>
          <p>Un nouveau cours a été ajouté :</p>
          <div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:16px 0;border-left:4px solid #22c55e">
            <p style="margin:0;font-size:16px"><strong>${actualTitle}</strong></p>
          </div>`,
          "https://learn-submit.lovable.app/etudiant/cours", "Voir le cours"
        )
      );
      sent++;
    } catch { errors++; }
  }
  return { sent, errors };
}

async function handleWelcomeStudent(data: Record<string, any>) {
  const { email, fullName } = data;
  if (!email) return { sent: 0, errors: 0 };

  try {
    await sendEmail(
      email,
      "🎉 Bienvenue sur Hacktualiz !",
      wrap("🎉 Bienvenue sur Hacktualiz",
        `<p>Bonjour <strong>${fullName || "Étudiant"}</strong>,</p>
        <p>Bienvenue sur la plateforme académique de <strong>NYS Africa</strong> !</p>
        <p>Votre compte est en cours de validation. Une fois approuvé, vous pourrez :</p>
        <ul style="color:#555">
          <li>📁 Soumettre vos projets</li>
          <li>📚 Accéder aux cours</li>
          <li>📊 Suivre votre progression</li>
          <li>🏆 Consulter le classement</li>
        </ul>`,
        "https://learn-submit.lovable.app/login", "Accéder à la plateforme"
      )
    );
    return { sent: 1, errors: 0 };
  } catch { return { sent: 0, errors: 1 }; }
}
