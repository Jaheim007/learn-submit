import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Database, FileText, Loader2, FileSpreadsheet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = {
  received: 'Reçu',
  reviewing: 'En révision',
  in_review: 'En révision',
  approved: 'Validé',
  rejected: 'Refusé',
  resubmit: 'À resoumettre',
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
  const [exportingAll, setExportingAll] = useState(false);
  const [exportingCRM, setExportingCRM] = useState(false);
  const [selectedClass, setSelectedClass] = useState('all');
  const [classes, setClasses] = useState<any[]>([]);
  const [classesLoaded, setClassesLoaded] = useState(false);

  const loadClasses = async () => {
    if (classesLoaded) return;
    const { data } = await supabase.from('classes').select('id, code, title').eq('is_active', true).order('title');
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

      // ── Sheet 1: RÉSUMÉ ──
      const totalActive = students.filter(s => s.status === 'active').length;
      const totalPending = students.filter(s => s.status === 'pending').length;
      const totalApproved = submissions.filter(s => s.status === 'approved').length;
      const totalRejected = submissions.filter(s => s.status === 'rejected').length;
      const completionRate = submissions.length > 0 ? Math.round((totalApproved / submissions.length) * 100) : 0;

      const resumeCSV = createCSV(
        ['RÉSUMÉ — HACKTUALIZ ACADEMY'],
        [
          ['Date du rapport', today],
          [''],
          ['📊 STATISTIQUES GÉNÉRALES'],
          ['Total étudiants', students.length.toString()],
          ['Étudiants actifs', totalActive.toString()],
          ['En attente d\'approbation', totalPending.toString()],
          ['Total soumissions', submissions.length.toString()],
          ['Soumissions validées', totalApproved.toString()],
          ['Soumissions refusées', totalRejected.toString()],
          ['Taux de validation', `${completionRate}%`],
          ['Total classes', allClasses.length.toString()],
          ['Total projets', projects.length.toString()],
          [''],
          ['📊 PAR CLASSE'],
          ['Classe', 'Étudiants inscrits', 'Soumissions', 'Validées', 'Refusées', 'Taux validation'],
          ...allClasses.map(c => {
            const classEnrollments = enrollments.filter(e => e.class_id === c.id).length;
            const classSubs = submissions.filter((s: any) => s.classes?.code === c.code);
            const classApproved = classSubs.filter(s => s.status === 'approved').length;
            const classRejected = classSubs.filter(s => s.status === 'rejected').length;
            const rate = classSubs.length > 0 ? Math.round((classApproved / classSubs.length) * 100) : 0;
            return [c.title, classEnrollments.toString(), classSubs.length.toString(), classApproved.toString(), classRejected.toString(), `${rate}%`];
          }),
        ]
      );

      // ── Sheet 2: ÉTUDIANTS ──
      const studentsCSV = createCSV(
        ['ÉTUDIANTS — HACKTUALIZ ACADEMY', '', '', '', '', '', '', '', '', '', ''],
        [
          ['Source: Export Academy — learn-submit.lovable.app', '', '', '', '', '', '', '', '', 'Date:', today],
          [`Total étudiants: ${students.length}`],
          [''],
          ['Nom complet', 'Email', 'Téléphone', 'WhatsApp', 'Telegram', 'GitHub', 'Statut', 'Actif', 'Classes inscrites', 'Date inscription'],
          ...students.map(s => {
            const classCodes = s.enrollments?.map((e: any) => e.classes?.title).filter(Boolean).join(' | ') || 'Aucune';
            return [s.full_name || '-', s.email || '-', s.phone || '', s.whatsapp || '', s.telegram || '', s.github_profile || '', s.status || 'approved', s.is_active ? 'Oui' : 'Non', classCodes, formatDate(s.created_at)];
          }),
        ]
      );

      // ── Sheet 3: SOUMISSIONS ──
      const subsCSV = createCSV(
        ['SOUMISSIONS — HACKTUALIZ ACADEMY', '', '', '', '', '', '', '', '', '', '', '', ''],
        [
          ['Date:', today, '', 'Total:', submissions.length.toString()],
          [''],
          ['Étudiant', 'Email', 'WhatsApp', 'Projet', 'Classe', 'Date soumission', 'Statut', 'Note', 'Version', 'Dernière', 'Lien 1', 'Lien 2', 'Lien 3', 'Nb fichiers', 'Description', 'Feedback', 'Date correction'],
          ...submissions.map(s => {
            const st = s.students as any;
            const p = s.projects as any;
            const c = s.classes as any;
            return [st.full_name || '-', st.email || '', st.whatsapp || '', p.title || '', c.title || '', formatDate(s.submitted_at), STATUS_LABELS[s.status] || s.status, s.grade != null ? `${s.grade}/20` : '-', s.version?.toString() || '1', s.is_latest ? 'Oui' : 'Non', s.link1 || '', s.link2 || '', s.link3 || '', (s.file_urls?.length || 0).toString(), s.description || '', s.feedback || '', s.reviewed_at ? formatDate(s.reviewed_at) : '-'];
          }),
        ]
      );

      // ── Sheet 4: PROJETS ──
      const projCSV = createCSV(
        ['PROJETS — HACKTUALIZ ACADEMY', '', '', '', '', '', '', ''],
        [
          ['Date:', today],
          [''],
          ['Code', 'Titre', 'Description', 'Deadline', 'Resoumission', 'Max resoum.', 'Actif', 'Classes assignées', 'Nb soumissions', 'Date création'],
          ...projects.map(p => {
            const assignedClasses = (p.class_projects || []).map((cp: any) => cp.classes?.title).filter(Boolean).join(' | ') || 'Aucune';
            const nbSubs = submissions.filter((s: any) => (s.projects as any)?.code === p.code).length;
            return [p.code, p.title, p.description || '-', p.deadline_at ? formatDateOnly(p.deadline_at) : '-', p.allow_resubmit ? 'Oui' : 'Non', p.max_resubmits?.toString() || 'Illimité', p.is_active ? 'Actif' : 'Inactif', assignedClasses, nbSubs.toString(), formatDate(p.created_at)];
          }),
        ]
      );

      // ── Sheet 5: CLASSES ──
      const classCSV = createCSV(
        ['CLASSES — HACKTUALIZ ACADEMY'],
        [
          ['Date:', today],
          [''],
          ['Code', 'Titre', 'Session', 'Statut', 'Nb étudiants', 'Nb soumissions', 'Date création'],
          ...allClasses.map(c => {
            const nbStudents = enrollments.filter(e => e.class_id === c.id).length;
            const nbSubs = submissions.filter((s: any) => (s.classes as any)?.code === c.code).length;
            return [c.code, c.title, c.session_name || '-', c.is_active ? 'Active' : 'Inactive', nbStudents.toString(), nbSubs.toString(), formatDate(c.created_at)];
          }),
        ]
      );

      // ── Sheet 6: INSCRIPTIONS ──
      const enrollCSV = createCSV(
        ['INSCRIPTIONS — HACKTUALIZ ACADEMY'],
        [
          ['Date:', today, '', 'Total:', enrollments.length.toString()],
          [''],
          ['Étudiant', 'Email', 'Classe (code)', 'Classe (titre)'],
          ...enrollments.map(e => [
            (e.students as any)?.full_name || '-',
            (e.students as any)?.email || '',
            (e.classes as any)?.code || '',
            (e.classes as any)?.title || '',
          ]),
        ]
      );

      downloadCSV(resumeCSV, `resume_hacktualiz_${todayISO}.csv`);
      downloadCSV(studentsCSV, `etudiants_hacktualiz_${todayISO}.csv`);
      downloadCSV(subsCSV, `soumissions_hacktualiz_${todayISO}.csv`);
      downloadCSV(projCSV, `projets_hacktualiz_${todayISO}.csv`);
      downloadCSV(classCSV, `classes_hacktualiz_${todayISO}.csv`);
      downloadCSV(enrollCSV, `inscriptions_hacktualiz_${todayISO}.csv`);

      toast.success('Export CRM terminé — 6 fichiers téléchargés');
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Erreur lors de l'export");
    } finally {
      setExportingCRM(false);
    }
  };

  const exportClassReport = async () => {
    if (selectedClass === 'all') {
      toast.info('Sélectionnez une classe spécifique');
      return;
    }
    setExportingAll(true);
    try {
      const classId = parseInt(selectedClass);
      const [{ data: classData }, { data: enrollments }, { data: submissions }] = await Promise.all([
        supabase.from('classes').select('*').eq('id', classId).single(),
        supabase.from('enrollments').select('students!inner(id, full_name, email, phone, whatsapp, github_profile, status)').eq('class_id', classId),
        supabase.from('submissions').select('*, students!inner(full_name, email), projects!inner(code, title)').eq('class_id', classId).eq('is_latest', true).order('submitted_at', { ascending: false }),
      ]);

      if (!classData) { toast.error('Classe non trouvée'); return; }

      const students = (enrollments || []).map((e: any) => e.students);
      const today = new Date().toLocaleDateString('fr-FR');
      const todayISO = new Date().toISOString().split('T')[0];
      const approved = (submissions || []).filter(s => s.status === 'approved').length;
      const total = (submissions || []).length;
      const rate = total > 0 ? Math.round((approved / total) * 100) : 0;

      const csv = createCSV(
        [`RAPPORT DE CLASSE — ${classData.title.toUpperCase()}`],
        [
          ['Code:', classData.code, '', 'Session:', classData.session_name || '-'],
          ['Date du rapport:', today],
          [''],
          ['📊 STATISTIQUES'],
          ['Étudiants inscrits', students.length.toString()],
          ['Soumissions totales', total.toString()],
          ['Validées', approved.toString()],
          ['Taux de validation', `${rate}%`],
          [''],
          ['📋 LISTE DES ÉTUDIANTS'],
          ['Nom', 'Email', 'Téléphone', 'WhatsApp', 'GitHub', 'Statut'],
          ...students.map((s: any) => [s.full_name || '-', s.email || '-', s.phone || '', s.whatsapp || '', s.github_profile || '', s.status || '-']),
          [''],
          ['📝 SOUMISSIONS'],
          ['Étudiant', 'Projet', 'Date', 'Statut', 'Note', 'Feedback'],
          ...(submissions || []).map((s: any) => [
            (s.students as any)?.full_name || '-',
            (s.projects as any)?.title || '-',
            formatDate(s.submitted_at),
            STATUS_LABELS[s.status] || s.status,
            s.grade != null ? `${s.grade}/20` : '-',
            s.feedback || '-',
          ]),
        ]
      );

      downloadCSV(csv, `rapport_${classData.code}_${todayISO}.csv`);
      toast.success(`Rapport de ${classData.title} exporté`);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'export");
    } finally {
      setExportingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Paramètres & Exports</h1>
        <p className="text-muted-foreground">Outils d'exportation et configuration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Export CRM complet
            </CardTitle>
            <CardDescription>
              Export structuré inspiré du format CRM Hacktualiz — 6 fichiers avec résumé, statistiques et détails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={exportCRMStyle} className="w-full" disabled={exportingCRM}>
              {exportingCRM ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Export en cours...</>
              ) : (
                <><Download className="h-4 w-4 mr-2" /> Export CRM (6 fichiers)</>
              )}
            </Button>
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium">Fichiers générés :</p>
              <ul className="list-disc list-inside text-xs space-y-0.5">
                <li>📊 Résumé avec statistiques globales et par classe</li>
                <li>👤 Étudiants avec contacts complets</li>
                <li>📝 Soumissions avec détails et évaluations</li>
                <li>📁 Projets avec classes assignées</li>
                <li>🏫 Classes avec nombre d'étudiants/soumissions</li>
                <li>📋 Inscriptions étudiant ↔ classe</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Rapport par classe
            </CardTitle>
            <CardDescription>
              Synthèse détaillée d'une classe — étudiants, soumissions, taux de complétion
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
            <Button onClick={exportClassReport} className="w-full" variant="outline" disabled={exportingAll || selectedClass === 'all'}>
              {exportingAll ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Export en cours...</>
              ) : (
                <><Download className="h-4 w-4 mr-2" /> Exporter le rapport</>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informations système</CardTitle>
            <CardDescription>Détails sur la configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="font-medium">Version :</span> Hacktualiz Academy v2.0</div>
            <div><span className="font-medium">Base de données :</span> Supabase PostgreSQL</div>
            <div><span className="font-medium">Stockage :</span> Supabase Storage</div>
            <div><span className="font-medium">Emails :</span> Resend (info@genessible.com)</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aide & Documentation</CardTitle>
            <CardDescription>Ressources</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-medium">Support :</span> admin@nys-africa.org</p>
            <p><span className="font-medium">Emails auto :</span> Nouveaux projets, rappels deadline, soumissions, évaluations</p>
            <p><span className="font-medium">Journal :</span> Toutes les actions sont enregistrées dans l'historique</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
