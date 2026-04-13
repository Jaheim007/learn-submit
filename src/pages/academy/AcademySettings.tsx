import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Loader2, FileSpreadsheet, FileDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateClassReportPDF, generateGlobalReportPDF, type ClassReportData, type GlobalReportData } from '@/lib/pdfExport';

const STATUS_LABELS: Record<string, string> = {
  received: 'Reçu', reviewing: 'En révision', in_review: 'En révision',
  approved: 'Validé', rejected: 'Refusé', resubmit: 'À resoumettre',
};

const formatDate = (date: string | null) => {
  if (!date) return 'Non défini';
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatDateOnly = (date: string | null) => {
  if (!date) return 'Non défini';
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function AcademySettings() {
  const [exportingCRM, setExportingCRM] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingGlobalPDF, setExportingGlobalPDF] = useState(false);
  const [selectedClass, setSelectedClass] = useState('all');
  const [classes, setClasses] = useState<any[]>([]);
  const [classesLoaded, setClassesLoaded] = useState(false);

  const loadClasses = async () => {
    if (classesLoaded) return;
    const { data } = await supabase.from('classes').select('id, code, title, session_name').eq('is_active', true).order('title');
    setClasses(data || []);
    setClassesLoaded(true);
  };

  const createCSV = (headers: string[], rows: any[][]) => {
    const BOM = '\uFEFF';
    return BOM + [headers, ...rows].map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // ── PDF Export: Class Report ──
  const exportClassPDF = async () => {
    if (selectedClass === 'all') { toast.info('Sélectionnez une classe'); return; }
    setExportingPDF(true);
    try {
      const classId = parseInt(selectedClass);
      const [{ data: classData }, { data: enrollments }, { data: submissions }, { data: classProjects }] = await Promise.all([
        supabase.from('classes').select('*').eq('id', classId).single(),
        supabase.from('enrollments').select('students!inner(id, full_name, email, phone, whatsapp, github_profile, status)').eq('class_id', classId),
        supabase.from('submissions').select('*, students!inner(full_name), projects!inner(code, title)').eq('class_id', classId).eq('is_latest', true).order('submitted_at', { ascending: false }),
        supabase.from('class_projects').select('projects!inner(id, code, title, deadline_at)').eq('class_id', classId),
      ]);

      if (!classData) { toast.error('Classe non trouvée'); return; }

      const studentsList = (enrollments || []).map((e: any) => e.students);
      const subsList = (submissions || []).map((s: any) => ({
        student_name: s.students?.full_name || '-',
        project_title: s.projects?.title || '-',
        submitted_at: s.submitted_at,
        status: s.status,
        grade: s.grade,
        feedback: s.feedback,
      }));

      const projectsList = (classProjects || []).map((cp: any) => {
        const p = cp.projects;
        const pSubs = (submissions || []).filter((s: any) => s.projects?.code === p.code);
        return {
          code: p.code, title: p.title, deadline_at: p.deadline_at,
          submissions_count: pSubs.length,
          approved_count: pSubs.filter((s: any) => s.status === 'approved').length,
        };
      });

      const reportData: ClassReportData = {
        classInfo: { code: classData.code, title: classData.title, session_name: classData.session_name },
        students: studentsList,
        submissions: subsList,
        projects: projectsList,
      };

      const doc = generateClassReportPDF(reportData);
      doc.save(`rapport_${classData.code}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success(`Rapport PDF de ${classData.title} téléchargé`);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'export PDF");
    } finally {
      setExportingPDF(false);
    }
  };

  // ── PDF Export: Global Report ──
  const exportGlobalPDF = async () => {
    setExportingGlobalPDF(true);
    try {
      const [studentsRes, submissionsRes, classesRes, projectsRes, enrollmentsRes] = await Promise.all([
        supabase.from('students').select('id, full_name, status'),
        supabase.from('submissions').select('id, status, student_id, class_id, students!inner(full_name), classes!inner(code, title)').eq('is_latest', true),
        supabase.from('classes').select('id, code, title').eq('is_active', true),
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('enrollments').select('student_id, class_id'),
      ]);

      const students = studentsRes.data || [];
      const subs = submissionsRes.data || [];
      const allClasses = classesRes.data || [];
      const enrollments = enrollmentsRes.data || [];

      const stats = {
        totalStudents: students.length,
        activeStudents: students.filter(s => s.status === 'active').length,
        pendingStudents: students.filter(s => s.status === 'pending').length,
        totalSubmissions: subs.length,
        approvedSubmissions: subs.filter(s => s.status === 'approved').length,
        rejectedSubmissions: subs.filter(s => s.status === 'rejected').length,
        totalClasses: allClasses.length,
        totalProjects: projectsRes.count || 0,
      };

      const classSummaries = allClasses.map(c => {
        const classStudents = enrollments.filter(e => e.class_id === c.id).length;
        const classSubs = subs.filter((s: any) => (s.classes as any)?.code === c.code);
        const classApproved = classSubs.filter(s => s.status === 'approved').length;
        return {
          title: c.title, code: c.code, students: classStudents,
          submissions: classSubs.length, approved: classApproved,
          rate: classSubs.length > 0 ? Math.round((classApproved / classSubs.length) * 100) : 0,
        };
      });

      // Top students by approved submissions
      const studentMap: Record<string, { name: string; submissions: number; approved: number }> = {};
      subs.forEach((s: any) => {
        const name = s.students?.full_name || 'Inconnu';
        if (!studentMap[s.student_id]) studentMap[s.student_id] = { name, submissions: 0, approved: 0 };
        studentMap[s.student_id].submissions++;
        if (s.status === 'approved') studentMap[s.student_id].approved++;
      });
      const topStudents = Object.values(studentMap).sort((a, b) => b.approved - a.approved);

      const reportData: GlobalReportData = { stats, classSummaries, topStudents };
      const doc = generateGlobalReportPDF(reportData);
      doc.save(`rapport_global_hacktualiz_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Rapport global PDF téléchargé');
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'export PDF global");
    } finally {
      setExportingGlobalPDF(false);
    }
  };

  // ── CSV Export: CRM-style ──
  const exportCRMStyle = async () => {
    setExportingCRM(true);
    try {
      const [studentsRes, submissionsRes, projectsRes, classesRes, enrollmentsRes] = await Promise.all([
        supabase.from('students').select('id, full_name, email, phone, whatsapp, telegram, github_profile, is_active, status, created_at, primary_class_id, enrollments(classes(code, title))'),
        supabase.from('submissions').select('id, submitted_at, updated_at, status, grade, version, is_latest, feedback, description, link1, link2, link3, file_urls, reviewed_at, students!inner(full_name, email, phone, whatsapp), projects!inner(code, title), classes!inner(code, title)').order('submitted_at', { ascending: false }),
        supabase.from('projects').select('id, code, title, description, deadline_at, due_at, allow_resubmit, max_resubmits, is_active, created_at, class_projects(class_id, classes(title))'),
        supabase.from('classes').select('id, code, title, is_active, session_name, created_at'),
        supabase.from('enrollments').select('student_id, class_id, classes(code, title), students(full_name, email)'),
      ]);

      const students = studentsRes.data || [];
      const submissions = submissionsRes.data || [];
      const projects = projectsRes.data || [];
      const allClasses = classesRes.data || [];
      const enrollments = enrollmentsRes.data || [];
      const today = new Date().toLocaleDateString('fr-FR');
      const todayISO = new Date().toISOString().split('T')[0];

      const totalApproved = submissions.filter(s => s.status === 'approved').length;
      const totalRejected = submissions.filter(s => s.status === 'rejected').length;
      const completionRate = submissions.length > 0 ? Math.round((totalApproved / submissions.length) * 100) : 0;

      const resumeCSV = createCSV(['RÉSUMÉ — HACKTUALIZ ACADEMY'], [
        ['Date du rapport', today], [''],
        ['📊 STATISTIQUES GÉNÉRALES'],
        ['Total étudiants', students.length.toString()],
        ['Étudiants actifs', students.filter(s => s.status === 'active').length.toString()],
        ['En attente', students.filter(s => s.status === 'pending').length.toString()],
        ['Total soumissions', submissions.length.toString()],
        ['Validées', totalApproved.toString()], ['Refusées', totalRejected.toString()],
        ['Taux validation', `${completionRate}%`],
        ['Classes', allClasses.length.toString()], ['Projets', projects.length.toString()],
        [''], ['📊 PAR CLASSE'],
        ['Classe', 'Étudiants', 'Soumissions', 'Validées', 'Refusées', 'Taux'],
        ...allClasses.map(c => {
          const ce = enrollments.filter(e => e.class_id === c.id).length;
          const cs = submissions.filter((s: any) => (s.classes as any)?.code === c.code);
          const ca = cs.filter(s => s.status === 'approved').length;
          const cr = cs.filter(s => s.status === 'rejected').length;
          return [c.title, ce.toString(), cs.length.toString(), ca.toString(), cr.toString(), `${cs.length > 0 ? Math.round((ca / cs.length) * 100) : 0}%`];
        }),
      ]);

      const studentsCSV = createCSV(['Nom', 'Email', 'Tél.', 'WhatsApp', 'Telegram', 'GitHub', 'Statut', 'Actif', 'Classes', 'Date inscription'],
        students.map(s => [s.full_name || '-', s.email || '-', s.phone || '', s.whatsapp || '', s.telegram || '', s.github_profile || '', s.status || '', s.is_active ? 'Oui' : 'Non', s.enrollments?.map((e: any) => e.classes?.title).filter(Boolean).join(' | ') || '', formatDate(s.created_at)]));

      const subsCSV = createCSV(['Étudiant', 'Email', 'WhatsApp', 'Projet', 'Classe', 'Date', 'Statut', 'Note', 'Version', 'Dernière', 'Lien 1', 'Lien 2', 'Lien 3', 'Fichiers', 'Description', 'Feedback', 'Date correction'],
        submissions.map(s => { const st = s.students as any; const p = s.projects as any; const c = s.classes as any;
          return [st.full_name || '-', st.email || '', st.whatsapp || '', p.title || '', c.title || '', formatDate(s.submitted_at), STATUS_LABELS[s.status] || s.status, s.grade != null ? `${s.grade}/20` : '-', s.version?.toString() || '1', s.is_latest ? 'Oui' : 'Non', s.link1 || '', s.link2 || '', s.link3 || '', (s.file_urls?.length || 0).toString(), s.description || '', s.feedback || '', s.reviewed_at ? formatDate(s.reviewed_at) : '-']; }));

      const projCSV = createCSV(['Code', 'Titre', 'Description', 'Deadline', 'Resoumission', 'Max', 'Actif', 'Classes', 'Soumissions', 'Date création'],
        projects.map(p => [(p as any).code, p.title, p.description || '-', p.deadline_at ? formatDateOnly(p.deadline_at) : '-', p.allow_resubmit ? 'Oui' : 'Non', p.max_resubmits?.toString() || '∞', p.is_active ? 'Actif' : 'Inactif', (p.class_projects || []).map((cp: any) => cp.classes?.title).filter(Boolean).join(' | ') || '', submissions.filter((s: any) => (s.projects as any)?.code === p.code).length.toString(), formatDate(p.created_at)]));

      const classCSV = createCSV(['Code', 'Titre', 'Session', 'Statut', 'Étudiants', 'Soumissions', 'Date création'],
        allClasses.map(c => [c.code, c.title, c.session_name || '-', c.is_active ? 'Active' : 'Inactive', enrollments.filter(e => e.class_id === c.id).length.toString(), submissions.filter((s: any) => (s.classes as any)?.code === c.code).length.toString(), formatDate(c.created_at)]));

      const enrollCSV = createCSV(['Étudiant', 'Email', 'Classe code', 'Classe titre'],
        enrollments.map(e => [(e.students as any)?.full_name || '-', (e.students as any)?.email || '', (e.classes as any)?.code || '', (e.classes as any)?.title || '']));

      [
        [resumeCSV, `resume_hacktualiz_${todayISO}.csv`],
        [studentsCSV, `etudiants_hacktualiz_${todayISO}.csv`],
        [subsCSV, `soumissions_hacktualiz_${todayISO}.csv`],
        [projCSV, `projets_hacktualiz_${todayISO}.csv`],
        [classCSV, `classes_hacktualiz_${todayISO}.csv`],
        [enrollCSV, `inscriptions_hacktualiz_${todayISO}.csv`],
      ].forEach(([content, filename]) => downloadCSV(content as string, filename as string));

      toast.success('Export CRM terminé — 6 fichiers téléchargés');
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Erreur lors de l'export");
    } finally {
      setExportingCRM(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Paramètres & Exports</h1>
        <p className="text-muted-foreground">Outils d'exportation et configuration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Global */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5 text-primary" />
              Rapport global PDF
            </CardTitle>
            <CardDescription>
              Synthèse complète avec statistiques, classement et répartition — format réunion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={exportGlobalPDF} className="w-full" disabled={exportingGlobalPDF}>
              {exportingGlobalPDF ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Génération...</>
              ) : (
                <><FileDown className="h-4 w-4 mr-2" /> Télécharger le rapport global PDF</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* PDF by Class */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Rapport PDF par classe
            </CardTitle>
            <CardDescription>
              Synthèse détaillée d'une classe — étudiants, projets, soumissions, notes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedClass} onValueChange={setSelectedClass} onOpenChange={() => loadClasses()}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une classe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">-- Sélectionner --</SelectItem>
                {classes.map(c => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.title} ({c.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={exportClassPDF} className="w-full" variant="outline" disabled={exportingPDF || selectedClass === 'all'}>
              {exportingPDF ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Génération...</>
              ) : (
                <><FileDown className="h-4 w-4 mr-2" /> Exporter en PDF</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* CSV CRM */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Export CRM complet (CSV)
            </CardTitle>
            <CardDescription>
              6 fichiers CSV détaillés — compatible Excel, séparateur point-virgule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={exportCRMStyle} className="w-full" variant="outline" disabled={exportingCRM}>
              {exportingCRM ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Export en cours...</>
              ) : (
                <><Download className="h-4 w-4 mr-2" /> Export CRM (6 fichiers CSV)</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informations système</CardTitle>
            <CardDescription>Détails sur la configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="font-medium">Version :</span> Hacktualiz Academy v2.1</div>
            <div><span className="font-medium">Base de données :</span> Supabase PostgreSQL</div>
            <div><span className="font-medium">Stockage :</span> Supabase Storage</div>
            <div><span className="font-medium">Emails :</span> Resend (info@genessible.com)</div>
            <div><span className="font-medium">Exports :</span> PDF (jsPDF) + CSV (Excel FR)</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
