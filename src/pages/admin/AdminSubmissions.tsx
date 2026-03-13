import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor, RichTextRenderer } from '@/components/ui/rich-text-editor';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Search, Eye, FileText, ExternalLink, Download } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRefreshInterval } from '@/hooks/useRefreshInterval';
import { RefreshHeader } from '@/components/admin/RefreshHeader';

interface Submission {
  id: string;
  submitted_at: string;
  status: "Reçu" | "En révision" | "Validé" | "Refusé";
  grade?: number;
  feedback?: string;
  version: number;
  links: string[];
  files: string[];
  description?: string;
  student: {
    id: string;
    full_name: string;
    email: string;
  };
  project: {
    id: number;
    title: string;
  };
  class: {
    id: number;
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
  title: string;
}

interface ReviewModalProps {
  submission: Submission | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (submissionId: string, updates: { status?: string; grade?: number; feedback?: string }) => void;
}

function ReviewModal({ submission, isOpen, onClose, onUpdate }: ReviewModalProps) {
  const [status, setStatus] = useState('');
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (submission) {
      setStatus(submission.status);
      setGrade(submission.grade?.toString() || '');
      setFeedback(submission.feedback || '');
    }
  }, [submission]);

  const handleSubmit = async () => {
    if (!submission) return;

    setLoading(true);
    try {
      const updates: any = { status };
      
      if (grade) {
        const gradeNum = parseFloat(grade);
        if (gradeNum >= 0 && gradeNum <= 20) {
          updates.grade = gradeNum;
        } else {
          toast.error('La note doit être entre 0 et 20');
          return;
        }
      }
      
      if (feedback.trim()) {
        updates.feedback = feedback.trim();
      }

      await onUpdate(submission.id, updates);
      onClose();
    } catch (error) {
      console.error('Error updating submission:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (filePath: string, submissionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('download-submission-file', {
        body: { submissionId, filePath }
      });

      if (error) {
        console.error('Error downloading file:', error);
        toast.error('Erreur lors du téléchargement du fichier');
        return;
      }

      if (data?.signedUrl) {
        // Create a temporary anchor element to trigger download
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = data.fileName || filePath.split('/').pop() || 'file';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast.error('URL de téléchargement non disponible');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Erreur lors du téléchargement du fichier');
    }
  };

  if (!submission) return null;

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'Reçu': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'En révision': return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'Validé': return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'Refusé': return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
      default: return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="bg-primary/5 border-b px-6 py-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Révision de soumission
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Badge variant="outline" className="text-xs font-medium">{submission.student.full_name || submission.student.email}</Badge>
            <span className="text-muted-foreground text-xs">•</span>
            <Badge variant="secondary" className="text-xs">{submission.class.code}</Badge>
            <span className="text-muted-foreground text-xs">•</span>
            <span className="text-xs text-muted-foreground">{submission.project.title}</span>
            <span className="text-muted-foreground text-xs">•</span>
            <span className="text-xs text-muted-foreground">v{submission.version}</span>
            <span className="text-muted-foreground text-xs">•</span>
            <span className="text-xs text-muted-foreground">
              {new Date(submission.submitted_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left column — Student submission content */}
            <div className="space-y-5">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Contenu de la soumission</h4>
              
              {/* Description */}
              {submission.description ? (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Description du projet</Label>
                  <div className="p-4 bg-muted/50 rounded-xl border text-sm leading-relaxed">
                    <RichTextRenderer content={submission.description} />
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-muted/30 rounded-xl border border-dashed text-sm text-muted-foreground italic text-center">
                  Aucune description fournie
                </div>
              )}

              {/* Links */}
              {submission.links.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Liens soumis ({submission.links.length})</Label>
                  <div className="space-y-2">
                    {submission.links.map((link, index) => (
                      <a 
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border hover:bg-muted/70 transition-colors group"
                      >
                        <ExternalLink className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm text-primary truncate group-hover:underline">{link}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {submission.files.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Fichiers soumis ({submission.files.length})</Label>
                  <div className="space-y-2">
                    {submission.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between gap-3 p-3 bg-muted/40 rounded-lg border">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm truncate">{file.split('/').pop()}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-shrink-0 gap-1.5"
                          onClick={() => downloadFile(file, submission.id)}
                        >
                          <Download className="h-3.5 w-3.5" />
                          Télécharger
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {submission.links.length === 0 && submission.files.length === 0 && !submission.description && (
                <div className="p-6 bg-muted/30 rounded-xl border border-dashed text-center">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Aucun contenu soumis</p>
                </div>
              )}
            </div>

            {/* Right column — Evaluation */}
            <div className="space-y-5">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Évaluation</h4>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">Statut</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Reçu">
                        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-500" /> Reçu</span>
                      </SelectItem>
                      <SelectItem value="En révision">
                        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500" /> En révision</span>
                      </SelectItem>
                      <SelectItem value="Validé">
                        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Validé</span>
                      </SelectItem>
                      <SelectItem value="Refusé">
                        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-500" /> Refusé</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade" className="text-sm font-medium">Note (/20)</Label>
                  <Input
                    id="grade"
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="Entrez la note sur 20"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback" className="text-sm font-medium">Commentaires & Feedback</Label>
                  <RichTextEditor
                    value={feedback}
                    onChange={setFeedback}
                    placeholder="Donnez un feedback détaillé à l'étudiant sur son travail, les points forts, les axes d'amélioration..."
                    minHeight="180px"
                  />
                  <p className="text-xs text-muted-foreground">Ce commentaire sera visible par l'étudiant</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t px-6 py-4 flex items-center justify-end gap-3 bg-background">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer l\'évaluation'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Status mapping from French labels to English DB values
const statusMap: Record<string, "received" | "in_review" | "approved" | "rejected"> = {
  "Reçu": "received",
  "En révision": "in_review", 
  "Validé": "approved",
  "Refusé": "rejected",
};

// Status mapping from English DB values to French labels
const reverseStatusMap: Record<string, "Reçu" | "En révision" | "Validé" | "Refusé"> = {
  "received": "Reçu",
  "in_review": "En révision", 
  "approved": "Validé",
  "rejected": "Refusé",
};

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [latestOnly, setLatestOnly] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadData = async () => {
    try {
      const [submissionsResponse, classesResponse, projectsResponse] = await Promise.all([
        supabase
          .from('submissions')
          .select(`
            id,
            submitted_at,
            status,
            grade,
            feedback,
            version,
            link1,
            link2,
            link3,
            file1_url,
            file2_url,
            file3_url,
            file_urls,
            description,
            is_latest,
            student_id,
            class_id,
            project_id,
            students!inner(id, full_name, email),
            projects!inner(id, title),
            classes!inner(id, code, title)
          `)
          .eq('is_latest', latestOnly)
          .order('submitted_at', { ascending: false }),
        
        supabase
          .from('classes')
          .select('id, code, title')
          .eq('is_active', true)
          .order('code'),
        
        supabase
          .from('projects')
          .select('id, title')
          .eq('is_active', true)
          .order('title')
      ]);

      if (classesResponse.data) setClasses(classesResponse.data);
      if (projectsResponse.data) setProjects(projectsResponse.data);

      if (submissionsResponse.data) {
        const formattedSubmissions = submissionsResponse.data.map((sub: any) => ({
          id: sub.id,
          submitted_at: sub.submitted_at,
          status: reverseStatusMap[sub.status] || sub.status, // Convert English to French for display
          grade: sub.grade,
          feedback: sub.feedback,
          version: sub.version,
          links: [sub.link1, sub.link2, sub.link3].filter(Boolean),
          // Prefer file_urls array (unlimited), fallback to legacy columns
          files: (sub.file_urls && sub.file_urls.length > 0)
            ? sub.file_urls
            : [sub.file1_url, sub.file2_url, sub.file3_url].filter(Boolean),
          description: sub.description,
          student: sub.students,
          project: sub.projects,
          class: sub.classes,
        }));

        setSubmissions(formattedSubmissions);
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast.error('Erreur lors du chargement des soumissions');
    } finally {
      setLoading(false);
    }
  };

  // Initial load only
  useEffect(() => {
    loadData();
  }, []);

  // Reload only when latestOnly changes
  useEffect(() => {
    if (!loading) loadData();
  }, [latestOnly]);

  const { lastRefreshTime, refresh } = useRefreshInterval(loadData);

  const updateSubmission = async (submissionId: string, updates: { status?: string; grade?: number; feedback?: string }) => {
    try {
      console.log('Updating submission:', submissionId, updates);
      
      // Map French status to English for DB
      const requestBody: any = { submissionId };
      
      if (updates.status) {
        requestBody.status = statusMap[updates.status];
        if (!requestBody.status) {
          throw new Error(`Unknown status: ${updates.status}`);
        }
      }
      
      if (typeof updates.grade !== 'undefined') {
        requestBody.grade = updates.grade;
      }
      
      if (typeof updates.feedback !== 'undefined') {
        requestBody.feedback = updates.feedback;
      }
      
      console.log('Sending request body:', requestBody);
      
      const { data, error } = await supabase.functions.invoke('update-submission', {
        body: requestBody
      });

      if (error) {
        console.error('Edge function error:', error);
        // Check if the error has a detail field for more specific error messages
        const errorMsg = error.message || error?.context?.error?.detail || 'Erreur lors de la mise à jour';
        throw new Error(errorMsg);
      }

      console.log('Update response:', data);

      // Update local state with original French labels
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === submissionId
            ? { 
                ...sub, 
                status: updates.status as "Reçu" | "En révision" | "Validé" | "Refusé" || sub.status,
                grade: updates.grade !== undefined ? updates.grade : sub.grade,
                feedback: updates.feedback !== undefined ? updates.feedback : sub.feedback
              }
            : sub
        )
      );

      toast.success('Soumission mise à jour avec succès');
    } catch (error: any) {
      console.error('Error updating submission:', error);
      // Show more detailed error message if available
      const errorMsg = error.message || error?.detail || 'Erreur lors de la mise à jour de la soumission';
      toast.error(errorMsg);
    }
  };

  const getFilteredSubmissions = useMemo(() => {
    return submissions.filter(submission => {
      // Search filter
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        if (!submission.student.full_name.toLowerCase().includes(searchLower) &&
            !submission.student.email.toLowerCase().includes(searchLower) &&
            !submission.project.title.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // Class filter
      if (selectedClass !== 'all' && submission.class.id.toString() !== selectedClass) {
        return false;
      }
      
      // Project filter
      if (selectedProject !== 'all' && submission.project.id.toString() !== selectedProject) {
        return false;
      }
      
      // Status filter
      if (selectedStatus !== 'all' && submission.status !== selectedStatus) {
        return false;
      }
      
      return true;
    });
  }, [submissions, debouncedSearchTerm, selectedClass, selectedProject, selectedStatus]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Reçu': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800';
      case 'En révision': return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
      case 'Validé': return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
      case 'Refusé': return 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredSubmissions = getFilteredSubmissions;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Révision des soumissions</h1>
          <p className="text-muted-foreground">
            {filteredSubmissions.length} soumission{filteredSubmissions.length > 1 ? 's' : ''} trouvée{filteredSubmissions.length > 1 ? 's' : ''}
          </p>
        </div>
        <RefreshHeader 
          lastRefreshTime={lastRefreshTime} 
          onRefresh={refresh}
          isRefreshing={loading}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les classes</SelectItem>
                {classes.map((classe) => (
                  <SelectItem key={classe.id} value={classe.id.toString()}>
                    {classe.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les projets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les projets</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="latestOnly"
                checked={latestOnly}
                onChange={(e) => setLatestOnly(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="latestOnly" className="text-sm">
                Dernières versions uniquement
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Étudiant</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Projet</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Soumis le</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                   <TableCell>
                     <div>
                       <div className="font-medium">
                         {submission.student.full_name || submission.student.email || 'Nom non défini'}
                       </div>
                       <div className="text-sm text-muted-foreground">{submission.student.email}</div>
                     </div>
                   </TableCell>
                  <TableCell>{submission.class.code}</TableCell>
                  <TableCell>{submission.project.title}</TableCell>
                  <TableCell>#{submission.version}</TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(submission.submitted_at), { 
                      addSuffix: true, 
                      locale: fr 
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(submission.status)}>
                      {submission.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {submission.grade ? `${submission.grade}/20` : '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedSubmission(submission);
                        setIsReviewModalOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Réviser
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredSubmissions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Aucune soumission trouvée
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ReviewModal
        submission={selectedSubmission}
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedSubmission(null);
        }}
        onUpdate={updateSubmission}
      />
    </div>
  );
}