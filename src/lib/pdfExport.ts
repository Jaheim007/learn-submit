import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = {
  primary: [79, 70, 229] as [number, number, number],     // indigo
  primaryLight: [108, 92, 231] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
  danger: [239, 68, 68] as [number, number, number],
  warning: [245, 158, 11] as [number, number, number],
  text: [30, 30, 30] as [number, number, number],
  muted: [120, 120, 120] as [number, number, number],
  bg: [248, 248, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  headerBg: [240, 240, 248] as [number, number, number],
};

const STATUS_LABELS: Record<string, string> = {
  received: 'Reçu', reviewing: 'En révision', in_review: 'En révision',
  approved: 'Validé', rejected: 'Refusé', resubmit: 'À resoumettre',
  active: 'Actif', pending: 'En attente',
};

const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

function addHeader(doc: jsPDF, title: string, subtitle: string) {
  // Gradient header bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 210, 36, 'F');
  doc.setFillColor(...COLORS.primaryLight);
  doc.rect(0, 0, 210, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 16);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, 14, 26);

  // Date on the right
  doc.setFontSize(9);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`, 196, 16, { align: 'right' });
  doc.text('Hacktualiz — NYS Africa', 196, 23, { align: 'right' });

  doc.setTextColor(...COLORS.text);
}

function addFooter(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(...COLORS.bg);
    doc.rect(0, 284, 210, 13, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(`© ${new Date().getFullYear()} Hacktualiz — NYS Africa | Confidentiel`, 14, 291);
    doc.text(`Page ${i}/${pages}`, 196, 291, { align: 'right' });
  }
}

function addStatBox(doc: jsPDF, x: number, y: number, w: number, label: string, value: string, color: [number, number, number]) {
  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(230, 230, 240);
  doc.roundedRect(x, y, w, 22, 3, 3, 'FD');
  doc.setFillColor(...color);
  doc.roundedRect(x, y, 4, 22, 2, 2, 'F');
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...color);
  doc.text(value, x + 10, y + 10);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.muted);
  doc.text(label, x + 10, y + 17);
}

function addSectionTitle(doc: jsPDF, y: number, title: string): number {
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text(title, 14, y);
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(14, y + 2, 196, y + 2);
  return y + 8;
}

export interface ClassReportData {
  classInfo: { code: string; title: string; session_name?: string | null };
  students: Array<{ full_name: string; email: string; phone?: string; whatsapp?: string; github_profile?: string; status: string }>;
  submissions: Array<{
    student_name: string; project_title: string; submitted_at: string;
    status: string; grade: number | null; feedback?: string;
  }>;
  projects: Array<{ code: string; title: string; deadline_at: string | null; submissions_count: number; approved_count: number }>;
}

export function generateClassReportPDF(data: ClassReportData): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const { classInfo, students, submissions, projects } = data;

  // Header
  addHeader(doc, `Rapport — ${classInfo.title}`, `Code: ${classInfo.code} | Session: ${classInfo.session_name || 'Non définie'}`);

  // KPI Stats
  const approved = submissions.filter(s => s.status === 'approved').length;
  const rejected = submissions.filter(s => s.status === 'rejected').length;
  const rate = submissions.length > 0 ? Math.round((approved / submissions.length) * 100) : 0;

  let y = 44;
  const boxW = 43;
  addStatBox(doc, 14, y, boxW, 'Étudiants', students.length.toString(), COLORS.primary);
  addStatBox(doc, 61, y, boxW, 'Soumissions', submissions.length.toString(), COLORS.primaryLight);
  addStatBox(doc, 108, y, boxW, 'Validées', approved.toString(), COLORS.success);
  addStatBox(doc, 155, y, boxW, 'Taux validation', `${rate}%`, rate >= 50 ? COLORS.success : COLORS.danger);

  y = 74;

  // Projects table
  y = addSectionTitle(doc, y, '📁 Projets assignés');
  autoTable(doc, {
    startY: y,
    head: [['Code', 'Titre', 'Deadline', 'Soumissions', 'Validées', 'Taux']],
    body: projects.map(p => {
      const pRate = p.submissions_count > 0 ? Math.round((p.approved_count / p.submissions_count) * 100) : 0;
      return [p.code, p.title, formatDate(p.deadline_at), p.submissions_count.toString(), p.approved_count.toString(), `${pRate}%`];
    }),
    theme: 'grid',
    headStyles: { fillColor: COLORS.primary, fontSize: 8, font: 'helvetica', fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: COLORS.text },
    alternateRowStyles: { fillColor: COLORS.bg },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 3 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Students table
  if (y > 230) { doc.addPage(); y = 20; }
  y = addSectionTitle(doc, y, '👤 Étudiants inscrits');
  autoTable(doc, {
    startY: y,
    head: [['Nom', 'Email', 'Tél.', 'WhatsApp', 'GitHub', 'Statut']],
    body: students.map(s => [
      s.full_name || '-', s.email || '-', s.phone || '-', s.whatsapp || '-',
      s.github_profile || '-', STATUS_LABELS[s.status] || s.status,
    ]),
    theme: 'grid',
    headStyles: { fillColor: COLORS.primary, fontSize: 8, font: 'helvetica', fontStyle: 'bold' },
    bodyStyles: { fontSize: 7, textColor: COLORS.text },
    alternateRowStyles: { fillColor: COLORS.bg },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 2.5 },
    columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 45 } },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Submissions table
  if (y > 210) { doc.addPage(); y = 20; }
  y = addSectionTitle(doc, y, '📝 Soumissions');
  autoTable(doc, {
    startY: y,
    head: [['Étudiant', 'Projet', 'Date', 'Statut', 'Note']],
    body: submissions.map(s => [
      s.student_name || '-', s.project_title || '-', formatDate(s.submitted_at),
      STATUS_LABELS[s.status] || s.status, s.grade != null ? `${s.grade}/20` : '-',
    ]),
    theme: 'grid',
    headStyles: { fillColor: COLORS.primary, fontSize: 8, font: 'helvetica', fontStyle: 'bold' },
    bodyStyles: { fontSize: 7, textColor: COLORS.text },
    alternateRowStyles: { fillColor: COLORS.bg },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 2.5 },
    didParseCell: (data: any) => {
      if (data.column.index === 3 && data.section === 'body') {
        const val = data.cell.raw;
        if (val === 'Validé') data.cell.styles.textColor = COLORS.success;
        else if (val === 'Refusé') data.cell.styles.textColor = COLORS.danger;
      }
    },
  });

  addFooter(doc);
  return doc;
}

export interface GlobalReportData {
  stats: {
    totalStudents: number; activeStudents: number; pendingStudents: number;
    totalSubmissions: number; approvedSubmissions: number; rejectedSubmissions: number;
    totalClasses: number; totalProjects: number;
  };
  classSummaries: Array<{
    title: string; code: string; students: number; submissions: number; approved: number; rate: number;
  }>;
  topStudents: Array<{ name: string; submissions: number; approved: number }>;
}

export function generateGlobalReportPDF(data: GlobalReportData): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const { stats, classSummaries, topStudents } = data;

  addHeader(doc, 'Rapport Global — Hacktualiz Academy', 'Synthèse de la plateforme NYS Africa');

  let y = 44;
  const boxW = 43;
  addStatBox(doc, 14, y, boxW, 'Étudiants actifs', stats.activeStudents.toString(), COLORS.primary);
  addStatBox(doc, 61, y, boxW, 'Soumissions', stats.totalSubmissions.toString(), COLORS.primaryLight);
  addStatBox(doc, 108, y, boxW, 'Validées', stats.approvedSubmissions.toString(), COLORS.success);
  addStatBox(doc, 155, y, boxW, 'En attente', stats.pendingStudents.toString(), COLORS.warning);

  y = 74;
  const globalRate = stats.totalSubmissions > 0 ? Math.round((stats.approvedSubmissions / stats.totalSubmissions) * 100) : 0;
  addStatBox(doc, 14, y, 88, 'Taux de validation global', `${globalRate}%`, globalRate >= 50 ? COLORS.success : COLORS.danger);
  addStatBox(doc, 108, y, 88, 'Classes / Projets', `${stats.totalClasses} classes — ${stats.totalProjects} projets`, COLORS.primary);

  y = 104;

  // Class summary table
  y = addSectionTitle(doc, y, '🏫 Synthèse par classe');
  autoTable(doc, {
    startY: y,
    head: [['Classe', 'Code', 'Étudiants', 'Soumissions', 'Validées', 'Taux']],
    body: classSummaries.map(c => [c.title, c.code, c.students.toString(), c.submissions.toString(), c.approved.toString(), `${c.rate}%`]),
    theme: 'grid',
    headStyles: { fillColor: COLORS.primary, fontSize: 9, font: 'helvetica', fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: COLORS.text },
    alternateRowStyles: { fillColor: COLORS.bg },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 3 },
    didParseCell: (data: any) => {
      if (data.column.index === 5 && data.section === 'body') {
        const pct = parseInt(data.cell.raw);
        data.cell.styles.textColor = pct >= 50 ? COLORS.success : COLORS.danger;
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Top students
  if (topStudents.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; }
    y = addSectionTitle(doc, y, '🏆 Top étudiants (par soumissions validées)');
    autoTable(doc, {
      startY: y,
      head: [['#', 'Étudiant', 'Soumissions', 'Validées', 'Taux']],
      body: topStudents.slice(0, 15).map((s, i) => {
        const rate = s.submissions > 0 ? Math.round((s.approved / s.submissions) * 100) : 0;
        return [(i + 1).toString(), s.name, s.submissions.toString(), s.approved.toString(), `${rate}%`];
      }),
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, fontSize: 9, font: 'helvetica', fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: COLORS.text },
      alternateRowStyles: { fillColor: COLORS.bg },
      margin: { left: 14, right: 14 },
      styles: { cellPadding: 3 },
    });
  }

  addFooter(doc);
  return doc;
}
