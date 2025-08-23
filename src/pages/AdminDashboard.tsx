import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/AdminLayout';
import AdminGuard from '@/components/admin/AdminGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/hooks/use-toast';
import { Download, Eye, FileText, ExternalLink, Edit, Star } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Navigate } from 'react-router-dom';
import { SubmissionReviewModal } from '@/components/SubmissionReviewModal';

interface Submission {
  id: number;
  submitted_at: string;
  updated_at: string;
  description: string | null;
  status: 'Reçu' | 'En révision' | 'Validé' | 'Refusé';
  grade: number | null;
  feedback: string | null;
  link1: string | null;
  link2: string | null;
  link3: string | null;
  file1_url: string | null;
  file2_url: string | null;
  file3_url: string | null;
  students: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    telegram: string | null;
    github_profile: string | null;
  };
  classes: {
    code: string;
    title: string;
  };
  projects: {
    code: string;
    title: string;
  };
}

interface Class {
  id: number;
  code: string;
  title: string;
}

interface Project {
  id: number;
  code: string;
  title: string;
}

const ADMIN_EMAILS = [
  'admin@nys-africa.com',
  'formation@nys-africa.com',
  'contact@nys-africa.com'
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtres
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState('');
  
  // Review modal
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // Vérification admin
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    if (!isAdmin) return;
    loadData();
  }, [isAdmin]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger les soumissions avec les relations
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          *,
          students!inner(full_name, email, phone, whatsapp, telegram, github_profile),
          classes!inner(code, title),
          projects!inner(code, title)
        `)
        .order('submitted_at', { ascending: false });

      if (submissionsError) throw submissionsError;

      // Charger les classes
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id, code, title')
        .eq('is_active', true)
        .order('code');

      if (classesError) throw classesError;

      // Charger les projets
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, code, title')
        .eq('is_active', true)
        .order('code');

      if (projectsError) throw projectsError;

      setSubmissions(submissionsData || []);
      setClasses(classesData || []);
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSubmission = async (
    submissionId: number, 
    updates: { status?: string; grade?: number | null; feedback?: string }
  ) => {
    try {
      const response = await supabase.functions.invoke('update-submission', {
        body: { submissionId, ...updates },
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.error) throw response.error;

      // Refresh submissions after update
      await loadData();

      toast({
        title: "Soumission mise à jour",
        description: "Les modifications ont été enregistrées avec succès"
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la soumission",
        variant: "destructive"
      });
    }
  };

  const getSignedUrl = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('submissions')
        .createSignedUrl(filePath, 3600); // 1 heure

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Erreur lors de la génération de l\'URL:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le fichier",
        variant: "destructive"
      });
      return null;
    }
  };

  const downloadFile = async (filePath: string) => {
    const url = await getSignedUrl(filePath);
    if (url) {
      window.open(url, '_blank');
    }
  };

  // Filtrage des soumissions
  const filteredSubmissions = submissions.filter(submission => {
    const matchesClass = !selectedClass || submission.classes.code === selectedClass;
    const matchesProject = !selectedProject || submission.projects.code === selectedProject;
    const matchesStatus = !selectedStatus || submission.status === selectedStatus;
    const matchesStudent = !studentSearch || 
      submission.students.full_name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      submission.students.email?.toLowerCase().includes(studentSearch.toLowerCase());
    
    return matchesClass && matchesProject && matchesStatus && matchesStudent;
  });

  const exportCSV = () => {
    const headers = [
      'Date de soumission',
      'Classe',
      'Projet', 
      'Étudiant',
      'Email',
      'Téléphone',
      'WhatsApp',
      'Telegram',
      'GitHub',
      'Lien 1',
      'Lien 2', 
      'Lien 3',
      'Description',
      'Statut',
      'Dernière mise à jour'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredSubmissions.map(s => [
        new Date(s.submitted_at).toLocaleString('fr-FR'),
        s.classes.code,
        s.projects.code,
        s.students.full_name || '',
        s.students.email || '',
        s.students.phone || '',
        s.students.whatsapp || '',
        s.students.telegram || '',
        s.students.github_profile || '',
        s.link1 || '',
        s.link2 || '',
        s.link3 || '',
        (s.description || '').replace(/,/g, ';'),
        s.status,
        new Date(s.updated_at).toLocaleString('fr-FR')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `soumissions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <AdminGuard>
        <AdminLayout>
          <div className="container mx-auto py-8">
            <div className="text-center">Chargement...</div>
          </div>
        </AdminLayout>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <AdminLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard Admin</h1>
            <p className="text-muted-foreground">
              Gestion des soumissions étudiantes
            </p>
          </div>
          <Button onClick={exportCSV} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exporter CSV
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Soumissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{submissions.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                En Attente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {submissions.filter(s => s.status === 'Reçu').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Validées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {submissions.filter(s => s.status === 'Validé').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Classes Actives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{classes.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card>
          <CardHeader>
            <CardTitle>Filtres</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Classe</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes les classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.code}>
                      {cls.code} - {cls.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Projet</label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les projets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les projets</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.code}>
                      {project.code} - {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Statut</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les statuts</SelectItem>
                  <SelectItem value="Reçu">Reçu</SelectItem>
                  <SelectItem value="En révision">En révision</SelectItem>
                  <SelectItem value="Validé">Validé</SelectItem>
                  <SelectItem value="Refusé">Refusé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Étudiant</label>
              <Input
                placeholder="Rechercher par nom ou email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tableau des soumissions */}
        <Card>
          <CardHeader>
            <CardTitle>
              Soumissions ({filteredSubmissions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Classe</TableHead>
                    <TableHead>Projet</TableHead>
                    <TableHead>Étudiant</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Liens</TableHead>
                    <TableHead>Fichiers</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="text-sm">
                        {new Date(submission.submitted_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{submission.classes.code}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{submission.projects.code}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{submission.students.full_name}</div>
                          <div className="text-sm text-muted-foreground">{submission.students.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          {submission.students.phone && (
                            <div>📱 {submission.students.phone}</div>
                          )}
                          {submission.students.whatsapp && (
                            <div>💬 {submission.students.whatsapp}</div>
                          )}
                          {submission.students.telegram && (
                            <div>✈️ {submission.students.telegram}</div>
                          )}
                          {submission.students.github_profile && (
                            <div>
                              <a 
                                href={submission.students.github_profile} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                🐙 GitHub
                              </a>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {[submission.link1, submission.link2, submission.link3]
                            .filter(Boolean)
                            .map((link, idx) => (
                              <div key={idx}>
                                <a 
                                  href={link!} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline text-sm flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Lien {idx + 1}
                                </a>
                              </div>
                            ))
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {[submission.file1_url, submission.file2_url, submission.file3_url]
                            .filter(Boolean)
                            .map((fileUrl, idx) => (
                              <Button
                                key={idx}
                                variant="ghost"
                                size="sm"
                                onClick={() => downloadFile(fileUrl!)}
                                className="text-xs p-1 h-auto"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Fichier {idx + 1}
                              </Button>
                            ))
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        {submission.description && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                Voir
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Description</DialogTitle>
                              </DialogHeader>
                              <div className="whitespace-pre-wrap text-sm">
                                {submission.description}
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={submission.status} />
                      </TableCell>
                      <TableCell className="text-center">
                        {submission.grade !== null ? (
                          <div className="flex items-center justify-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="font-medium">{submission.grade}/20</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSubmission(submission)}
                          className="flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Réviser
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Review Modal */}
        <SubmissionReviewModal
          submission={selectedSubmission}
          isOpen={selectedSubmission !== null}
          onClose={() => setSelectedSubmission(null)}
          onUpdate={updateSubmission}
          onDownloadFile={downloadFile}
        />
      </div>
      </AdminLayout>
    </AdminGuard>
  );
}