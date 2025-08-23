import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Database, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AdminSettings() {

  const exportAllData = async () => {
    try {
      // Export students, submissions, projects data
      const [studentsData, submissionsData, projectsData] = await Promise.all([
        supabase
          .from('students')
          .select(`
            id,
            full_name,
            email,
            is_active,
            created_at,
            enrollments!inner(
              classes!inner(code, title)
            )
          `),
        
        supabase
          .from('submissions')
          .select(`
            id,
            submitted_at,
            status,
            grade,
            version,
            students!inner(full_name, email),
            projects!inner(title),
            classes!inner(code)
          `),
        
        supabase
          .from('projects')
          .select(`
            id,
            title,
            description,
            deadline_at,
            allow_resubmit,
            max_resubmits,
            is_active,
            created_at
          `)
      ]);

      // Create CSV content
      const studentsCsv = createCSV(
        ['ID', 'Nom', 'Email', 'Classes', 'Statut', 'Date inscription'],
        studentsData.data?.map(s => [
          s.id,
          s.full_name,
          s.email,
          s.enrollments.map((e: any) => e.classes.code).join(', '),
          s.is_active ? 'Actif' : 'Inactif',
          new Date(s.created_at).toLocaleDateString('fr-FR')
        ]) || []
      );

      const submissionsCsv = createCSV(
        ['ID', 'Étudiant', 'Email', 'Projet', 'Classe', 'Date', 'Statut', 'Note', 'Version'],
        submissionsData.data?.map(s => [
          s.id,
          (s.students as any).full_name,
          (s.students as any).email,
          (s.projects as any).title,
          (s.classes as any).code,
          new Date(s.submitted_at).toLocaleDateString('fr-FR'),
          s.status,
          s.grade || '',
          s.version.toString()
        ]) || []
      );

      const projectsCsv = createCSV(
        ['ID', 'Titre', 'Description', 'Échéance', 'Resoumission', 'Max resoumissions', 'Statut', 'Date création'],
        projectsData.data?.map(p => [
          p.id.toString(),
          p.title,
          p.description || '',
          new Date(p.deadline_at).toLocaleDateString('fr-FR'),
          p.allow_resubmit ? 'Oui' : 'Non',
          p.max_resubmits?.toString() || '',
          p.is_active ? 'Actif' : 'Inactif',
          new Date(p.created_at).toLocaleDateString('fr-FR')
        ]) || []
      );

      // Download files
      downloadCSV(studentsCsv, `etudiants_${new Date().toISOString().split('T')[0]}.csv`);
      downloadCSV(submissionsCsv, `soumissions_${new Date().toISOString().split('T')[0]}.csv`);
      downloadCSV(projectsCsv, `projets_${new Date().toISOString().split('T')[0]}.csv`);

      toast.success('Export terminé - 3 fichiers téléchargés');

    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Erreur lors de l\'export des données');
    }
  };

  const createCSV = (headers: string[], rows: any[][]) => {
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    return csvContent;
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const exportSubmissionFiles = async () => {
    try {
      // Get all file paths from submissions
      const { data: submissions } = await supabase
        .from('submissions')
        .select('id, description, students!inner(full_name), projects!inner(title)');

      if (!submissions || submissions.length === 0) {
        toast.info('Aucun fichier à exporter');
        return;
      }

      // Create a report of submissions
      const fileReport = ['ID Soumission', 'Étudiant', 'Projet', 'Description'];
      const fileRows = submissions
        ?.filter(s => s.description)
        .map(s => [
          s.id,
          (s.students as any).full_name,
          (s.projects as any).title,
          s.description || ''
        ]) || [];

      const csvContent = createCSV(fileReport, fileRows);
      downloadCSV(csvContent, `fichiers_soumissions_${new Date().toISOString().split('T')[0]}.csv`);

      toast.success('Rapport des fichiers exporté');

    } catch (error) {
      console.error('Error exporting files:', error);
      toast.error('Erreur lors de l\'export des fichiers');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Paramètres</h1>
        <p className="text-muted-foreground">Configuration et outils d'administration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Data Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Export des données</span>
            </CardTitle>
            <CardDescription>
              Exporter toutes les données de la plateforme au format CSV
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={exportAllData} className="w-full" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter toutes les données
            </Button>
            <p className="text-sm text-muted-foreground">
              Génère 3 fichiers CSV : étudiants, soumissions et projets
            </p>
          </CardContent>
        </Card>

        {/* Files Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Export des fichiers</span>
            </CardTitle>
            <CardDescription>
              Générer un rapport des fichiers soumis par les étudiants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={exportSubmissionFiles} className="w-full" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Rapport des fichiers
            </Button>
            <p className="text-sm text-muted-foreground">
              Liste tous les fichiers uploadés avec les détails des soumissions
            </p>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informations système</CardTitle>
            <CardDescription>
              Détails sur la configuration de la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Version :</span> NYS Submissions Portal v1.0
            </div>
            <div className="text-sm">
              <span className="font-medium">Base de données :</span> Supabase PostgreSQL
            </div>
            <div className="text-sm">
              <span className="font-medium">Stockage :</span> Supabase Storage
            </div>
            <div className="text-sm">
              <span className="font-medium">Authentification :</span> Supabase Auth
            </div>
          </CardContent>
        </Card>

        {/* Help & Documentation */}
        <Card>
          <CardHeader>
            <CardTitle>Aide & Documentation</CardTitle>
            <CardDescription>
              Ressources pour l'utilisation de la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-2">
              <p>
                <span className="font-medium">Support technique :</span> admin@nys-africa.org
              </p>
              <p>
                <span className="font-medium">Documentation :</span> Consultez le README du projet
              </p>
              <p>
                <span className="font-medium">Mises à jour :</span> Vérifiez régulièrement les nouvelles fonctionnalités
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}