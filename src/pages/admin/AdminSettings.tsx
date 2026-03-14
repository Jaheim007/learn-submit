import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Database, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = {
  received: 'Reçu',
  reviewing: 'En révision',
  approved: 'Validé',
  rejected: 'Refusé',
  resubmit: 'À resoumettre',
};

const formatDate = (date: string | null) => {
  if (!date) return 'Non défini';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateOnly = (date: string | null) => {
  if (!date) return 'Non défini';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export default function AdminSettings() {
  const [exportingAll, setExportingAll] = useState(false);
  const [exportingFiles, setExportingFiles] = useState(false);

  const exportAllData = async () => {
    setExportingAll(true);
    try {
      const [studentsData, submissionsData, projectsData, classesData, enrollmentsData] = await Promise.all([
        supabase
          .from('students')
          .select(`
            id,
            full_name,
            email,
            phone,
            whatsapp,
            telegram,
            github_profile,
            is_active,
            status,
            created_at,
            primary_class_id,
            enrollments(
              classes(code, title)
            )
          `),

        supabase
          .from('submissions')
          .select(`
            id,
            submitted_at,
            updated_at,
            status,
            grade,
            version,
            is_latest,
            feedback,
            description,
            link1,
            link2,
            link3,
            file_urls,
            reviewed_at,
            students!inner(full_name, email, phone, whatsapp),
            projects!inner(code, title),
            classes!inner(code, title)
          `)
          .order('submitted_at', { ascending: false }),

        supabase
          .from('projects')
          .select(`
            id,
            code,
            title,
            description,
            deadline_at,
            due_at,
            allow_resubmit,
            max_resubmits,
            is_active,
            created_at
          `),

        supabase
          .from('classes')
          .select(`id, code, title, is_active, session_name, created_at`),

        supabase
          .from('enrollments')
          .select(`student_id, class_id, classes(code, title), students(full_name, email)`)
      ]);

      // ── Students CSV ──
      const studentsCsv = createCSV(
        [
          'ID Étudiant',
          'Nom complet',
          'Email',
          'Téléphone',
          'WhatsApp',
          'Telegram',
          'GitHub',
          'Classes inscrites (codes)',
          'Classes inscrites (noms)',
          'Statut compte',
          'Actif',
          'Date d\'inscription',
        ],
        studentsData.data?.map(s => {
          const classCodes = s.enrollments?.map((e: any) => e.classes?.code).filter(Boolean).join(' | ') || 'Aucune';
          const classTitles = s.enrollments?.map((e: any) => e.classes?.title).filter(Boolean).join(' | ') || 'Aucune';
          return [
            s.id,
            s.full_name || 'Non renseigné',
            s.email || 'Non renseigné',
            s.phone || '',
            s.whatsapp || '',
            s.telegram || '',
            s.github_profile || '',
            classCodes,
            classTitles,
            s.status || 'approved',
            s.is_active ? 'Oui' : 'Non',
            formatDate(s.created_at),
          ];
        }) || []
      );

      // ── Submissions CSV ──
      const submissionsCsv = createCSV(
        [
          'ID Soumission',
          'Nom étudiant',
          'Email étudiant',
          'Téléphone étudiant',
          'WhatsApp étudiant',
          'Code projet',
          'Titre projet',
          'Code classe',
          'Nom classe',
          'Date de soumission',
          'Statut',
          'Note (/20)',
          'Version',
          'Dernière version',
          'Lien 1',
          'Lien 2',
          'Lien 3',
          'Nombre fichiers uploadés',
          'Description',
          'Feedback formateur',
          'Date de correction',
          'Dernière mise à jour',
        ],
        submissionsData.data?.map(s => {
          const student = s.students as any;
          const project = s.projects as any;
          const cls = s.classes as any;
          return [
            s.id.toString(),
            student.full_name || 'Non renseigné',
            student.email || '',
            student.phone || '',
            student.whatsapp || '',
            project.code || '',
            project.title || '',
            cls.code || '',
            cls.title || '',
            formatDate(s.submitted_at),
            STATUS_LABELS[s.status] || s.status,
            s.grade !== null && s.grade !== undefined ? `${s.grade}/20` : 'Non noté',
            s.version?.toString() || '1',
            s.is_latest ? 'Oui' : 'Non',
            s.link1 || '',
            s.link2 || '',
            s.link3 || '',
            (s.file_urls?.length || 0).toString(),
            s.description || '',
            s.feedback || '',
            s.reviewed_at ? formatDate(s.reviewed_at) : 'Non corrigé',
            formatDate(s.updated_at),
          ];
        }) || []
      );

      // ── Projects CSV ──
      const projectsCsv = createCSV(
        [
          'ID Projet',
          'Code projet',
          'Titre',
          'Description',
          'Date limite (deadline)',
          'Date d\'échéance (due)',
          'Resoumission autorisée',
          'Nombre max de resoumissions',
          'Statut',
          'Date de création',
        ],
        projectsData.data?.map(p => [
          p.id.toString(),
          p.code,
          p.title,
          p.description || 'Aucune description',
          p.deadline_at ? formatDateOnly(p.deadline_at) : 'Pas de deadline',
          p.due_at ? formatDateOnly(p.due_at) : 'Pas de date d\'échéance',
          p.allow_resubmit ? 'Oui' : 'Non',
          p.max_resubmits?.toString() || 'Illimité',
          p.is_active ? 'Actif' : 'Inactif',
          formatDate(p.created_at),
        ]) || []
      );

      // ── Classes CSV ──
      const classesCsv = createCSV(
        [
          'ID Classe',
          'Code',
          'Titre',
          'Session',
          'Statut',
          'Date de création',
        ],
        classesData.data?.map(c => [
          c.id.toString(),
          c.code,
          c.title,
          c.session_name || 'Non défini',
          c.is_active ? 'Active' : 'Inactive',
          formatDate(c.created_at),
        ]) || []
      );

      // ── Enrollments CSV ──
      const enrollmentsCsv = createCSV(
        [
          'Nom étudiant',
          'Email étudiant',
          'Code classe',
          'Nom classe',
        ],
        enrollmentsData.data?.map(e => [
          (e.students as any)?.full_name || 'Non renseigné',
          (e.students as any)?.email || '',
          (e.classes as any)?.code || '',
          (e.classes as any)?.title || '',
        ]) || []
      );

      const today = new Date().toISOString().split('T')[0];
      downloadCSV(studentsCsv, `etudiants_${today}.csv`);
      downloadCSV(submissionsCsv, `soumissions_${today}.csv`);
      downloadCSV(projectsCsv, `projets_${today}.csv`);
      downloadCSV(classesCsv, `classes_${today}.csv`);
      downloadCSV(enrollmentsCsv, `inscriptions_${today}.csv`);

      toast.success('Export terminé — 5 fichiers CSV téléchargés');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error("Erreur lors de l'export des données");
    } finally {
      setExportingAll(false);
    }
  };

  const createCSV = (headers: string[], rows: any[][]) => {
    const BOM = '\uFEFF';
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    return BOM + csvContent;
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportSubmissionFiles = async () => {
    setExportingFiles(true);
    try {
      const { data: submissions } = await supabase
        .from('submissions')
        .select(`
          id,
          version,
          submitted_at,
          status,
          grade,
          description,
          link1,
          link2,
          link3,
          file_urls,
          students!inner(full_name, email),
          projects!inner(code, title),
          classes!inner(code)
        `)
        .order('submitted_at', { ascending: false });

      if (!submissions || submissions.length === 0) {
        toast.info('Aucun fichier à exporter');
        setExportingFiles(false);
        return;
      }

      const csvContent = createCSV(
        [
          'ID Soumission',
          'Nom étudiant',
          'Email étudiant',
          'Code projet',
          'Titre projet',
          'Classe',
          'Version',
          'Date soumission',
          'Statut',
          'Note',
          'Lien 1',
          'Lien 2',
          'Lien 3',
          'Fichiers uploadés (URLs)',
          'Description',
        ],
        submissions.map(s => {
          const student = s.students as any;
          const project = s.projects as any;
          const cls = s.classes as any;
          return [
            s.id.toString(),
            student.full_name || '',
            student.email || '',
            project.code || '',
            project.title || '',
            cls.code || '',
            s.version?.toString() || '1',
            formatDate(s.submitted_at),
            STATUS_LABELS[s.status] || s.status,
            s.grade !== null && s.grade !== undefined ? `${s.grade}/20` : 'Non noté',
            s.link1 || '',
            s.link2 || '',
            s.link3 || '',
            s.file_urls?.join(' | ') || 'Aucun fichier',
            s.description || '',
          ];
        })
      );

      downloadCSV(csvContent, `rapport_fichiers_soumissions_${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('Rapport des fichiers exporté');
    } catch (error) {
      console.error('Error exporting files:', error);
      toast.error("Erreur lors de l'export des fichiers");
    } finally {
      setExportingFiles(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Paramètres</h1>
        <p className="text-muted-foreground">Configuration et outils d'administration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Export des données</span>
            </CardTitle>
            <CardDescription>
              Export complet de toutes les données de la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={exportAllData} className="w-full" variant="outline" disabled={exportingAll}>
              {exportingAll ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Export en cours...</>
              ) : (
                <><Download className="h-4 w-4 mr-2" /> Exporter toutes les données</>
              )}
            </Button>
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium">Génère 5 fichiers CSV :</p>
              <ul className="list-disc list-inside text-xs space-y-0.5">
                <li>Étudiants (nom, contacts, classes, statut)</li>
                <li>Soumissions (détails complets avec notes et feedback)</li>
                <li>Projets (deadlines, resoumissions, statut)</li>
                <li>Classes (code, session, statut)</li>
                <li>Inscriptions (étudiant ↔ classe)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Export des fichiers</span>
            </CardTitle>
            <CardDescription>
              Rapport détaillé des fichiers et liens soumis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={exportSubmissionFiles} className="w-full" variant="outline" disabled={exportingFiles}>
              {exportingFiles ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Export en cours...</>
              ) : (
                <><Download className="h-4 w-4 mr-2" /> Rapport des fichiers</>
              )}
            </Button>
            <p className="text-sm text-muted-foreground">
              Liste tous les liens et fichiers uploadés avec projet, classe et note
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informations système</CardTitle>
            <CardDescription>Détails sur la configuration de la plateforme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm"><span className="font-medium">Version :</span> NYS Submissions Portal v1.0</div>
            <div className="text-sm"><span className="font-medium">Base de données :</span> Supabase PostgreSQL</div>
            <div className="text-sm"><span className="font-medium">Stockage :</span> Supabase Storage</div>
            <div className="text-sm"><span className="font-medium">Authentification :</span> Supabase Auth</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aide & Documentation</CardTitle>
            <CardDescription>Ressources pour l'utilisation de la plateforme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-2">
              <p><span className="font-medium">Support technique :</span> admin@nys-africa.org</p>
              <p><span className="font-medium">Documentation :</span> Consultez le README du projet</p>
              <p><span className="font-medium">Mises à jour :</span> Vérifiez régulièrement les nouvelles fonctionnalités</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
