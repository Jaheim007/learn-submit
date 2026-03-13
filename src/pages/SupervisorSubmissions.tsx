import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRoles } from '@/hooks/useRoles';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Download, ExternalLink, Search } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { StatusBadge } from '@/components/StatusBadge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Submission {
  id: number;
  class_id: number;
  project_id: number;
  student: {
    full_name: string;
    email: string;
    phone: string;
    whatsapp: string;
    telegram: string;
    github_profile: string;
  };
  class: {
    code: string;
    title: string;
  };
  project: {
    code: string;
    title: string;
  };
  status: string;
  grade: number | null;
  submitted_at: string;
  link1: string | null;
  link2: string | null;
  link3: string | null;
  file1_url: string | null;
  file2_url: string | null;
  file3_url: string | null;
  file_urls: string[] | null;
  description: string | null;
  feedback: string | null;
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

export default function SupervisorSubmissions() {
  const { loading } = useAuth();
  const { isSupervisor, isTeacher, isLoading: rolesLoading } = useRoles();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  
  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!loading && !rolesLoading && (isSupervisor || isTeacher)) {
      loadData();
    }
  }, [loading, rolesLoading, isSupervisor, isTeacher]);

  const loadData = async () => {
    try {
      // Get assigned classes
      const { data: assignments } = await supabase
        .from('supervisor_class_assignments')
        .select('class_id');

      if (!assignments) return;

      const assignedClassIds = assignments.map(a => a.class_id);

      // Load submissions from assigned classes only
      const { data: submissionsData } = await supabase
        .from('submissions')
        .select(`
          *,
          students!inner (
            full_name,
            email,
            phone,
            whatsapp,
            telegram,
            github_profile
          ),
          classes!inner (
            code,
            title
          ),
          projects!inner (
            code,
            title
          )
        `)
        .in('class_id', assignedClassIds)
        .order('submitted_at', { ascending: false });

      // Load assigned classes
      const { data: classesData } = await supabase
        .from('classes')
        .select('*')
        .in('id', assignedClassIds)
        .order('code');

      // Load projects from assigned classes
      const { data: classProjects } = await supabase
        .from('class_projects')
        .select(`
          project_id,
          projects (id, code, title)
        `)
        .in('class_id', assignedClassIds);

      const projectsData = classProjects?.map(cp => cp.projects as Project) || [];

      // Transform submissions data to match interface
      const transformedSubmissions = submissionsData?.map(sub => ({
        ...sub,
        student: sub.students,
        class: sub.classes,
        project: sub.projects
      })) || [];
      
      setSubmissions(transformedSubmissions);
      setClasses(classesData || []);
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const getSignedUrl = async (filePath: string) => {
    const { data } = await supabase.storage
      .from('submissions')
      .createSignedUrl(filePath, 3600);
    return data?.signedUrl;
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const signedUrl = await getSignedUrl(filePath);
      if (signedUrl) {
        const link = document.createElement('a');
        link.href = signedUrl;
        link.download = fileName;
        link.click();
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (selectedClass !== 'all' && submission.class_id.toString() !== selectedClass) {
      return false;
    }
    if (selectedProject !== 'all' && submission.project_id.toString() !== selectedProject) {
      return false;
    }
    if (selectedStatus !== 'all' && submission.status !== selectedStatus) {
      return false;
    }
    if (searchTerm && !submission.student.full_name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  if (!isSupervisor) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Soumissions - Vue Superviseur</h1>
        <p className="text-muted-foreground mt-2">
          Visualisation des soumissions de vos classes assignées (lecture seule)
        </p>
        <Badge variant="outline" className="mt-2">
          Accès en lecture seule
        </Badge>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les projets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les projets</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="Reçu">Reçu</SelectItem>
                  <SelectItem value="En révision">En révision</SelectItem>
                  <SelectItem value="Validé">Validé</SelectItem>
                  <SelectItem value="Refusé">Refusé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un étudiant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Soumissions ({filteredSubmissions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="text-center py-8">Chargement des soumissions...</div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune soumission trouvée
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Étudiant</TableHead>
                    <TableHead>Classe</TableHead>
                    <TableHead>Projet</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        {format(new Date(submission.submitted_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{submission.student.full_name}</div>
                          <div className="text-sm text-muted-foreground">{submission.student.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{submission.class.code}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{submission.project.code}</div>
                          <div className="text-sm text-muted-foreground">{submission.project.title}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={submission.status as any} />
                      </TableCell>
                      <TableCell>
                        {submission.grade ? (
                          <Badge variant="secondary">{submission.grade}/20</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedSubmission(submission)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Voir
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Détails de la soumission</DialogTitle>
                              <DialogDescription>
                                {selectedSubmission?.student.full_name} - {selectedSubmission?.project.code}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedSubmission && (
                              <div className="space-y-4">
                                {/* Student Info */}
                                <div>
                                  <h4 className="font-medium mb-2">Informations étudiant</h4>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>Email: {selectedSubmission.student.email}</div>
                                    <div>Téléphone: {selectedSubmission.student.phone || 'N/A'}</div>
                                    <div>WhatsApp: {selectedSubmission.student.whatsapp || 'N/A'}</div>
                                    <div>Telegram: {selectedSubmission.student.telegram || 'N/A'}</div>
                                  </div>
                                  {selectedSubmission.student.github_profile && (
                                    <div className="mt-2">
                                      <a 
                                        href={selectedSubmission.student.github_profile} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                      >
                                        <ExternalLink className="h-4 w-4 inline mr-1" />
                                        Profil GitHub
                                      </a>
                                    </div>
                                  )}
                                </div>

                                {/* Links */}
                                {(selectedSubmission.link1 || selectedSubmission.link2 || selectedSubmission.link3) && (
                                  <div>
                                    <h4 className="font-medium mb-2">Liens</h4>
                                    <div className="space-y-1">
                                      {selectedSubmission.link1 && (
                                        <div>
                                          <a href={selectedSubmission.link1} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                            <ExternalLink className="h-4 w-4 inline mr-1" />
                                            Lien 1
                                          </a>
                                        </div>
                                      )}
                                      {selectedSubmission.link2 && (
                                        <div>
                                          <a href={selectedSubmission.link2} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                            <ExternalLink className="h-4 w-4 inline mr-1" />
                                            Lien 2
                                          </a>
                                        </div>
                                      )}
                                      {selectedSubmission.link3 && (
                                        <div>
                                          <a href={selectedSubmission.link3} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                            <ExternalLink className="h-4 w-4 inline mr-1" />
                                            Lien 3
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Files */}
                                {/* Files - support unlimited via file_urls array */}
                                {((selectedSubmission.file_urls && selectedSubmission.file_urls.length > 0) ||
                                  selectedSubmission.file1_url || selectedSubmission.file2_url || selectedSubmission.file3_url) && (
                                  <div>
                                    <h4 className="font-medium mb-2">Fichiers</h4>
                                    <div className="space-y-1">
                                      {(selectedSubmission.file_urls && selectedSubmission.file_urls.length > 0
                                        ? selectedSubmission.file_urls
                                        : [selectedSubmission.file1_url, selectedSubmission.file2_url, selectedSubmission.file3_url].filter(Boolean) as string[]
                                      ).map((fileUrl, idx) => (
                                        <Button
                                          key={idx}
                                          variant="outline"
                                          size="sm"
                                          onClick={() => downloadFile(fileUrl, fileUrl.split('/').pop() || `fichier_${idx + 1}`)}
                                        >
                                          <Download className="h-4 w-4 mr-2" />
                                          {fileUrl.split('/').pop()?.replace(/^\d+_/, '') || `Fichier ${idx + 1}`}
                                        </Button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Description */}
                                {selectedSubmission.description && (
                                  <div>
                                    <h4 className="font-medium mb-2">Description</h4>
                                    <p className="text-sm">{selectedSubmission.description}</p>
                                  </div>
                                )}

                                {/* Feedback */}
                                {selectedSubmission.feedback && (
                                  <div>
                                    <h4 className="font-medium mb-2">Commentaires</h4>
                                    <p className="text-sm">{selectedSubmission.feedback}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}