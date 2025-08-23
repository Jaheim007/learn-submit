import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Search, Eye, FileText, ExternalLink, Download } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Submission {
  id: string;
  submitted_at: string;
  status: string;
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

  const downloadFile = async (filePath: string) => {
    try {
      const { data } = await supabase.storage
        .from('submissions')
        .createSignedUrl(filePath, 60); // 1 minute expiry

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Erreur lors du téléchargement du fichier');
    }
  };

  if (!submission) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Révision de soumission - {submission.student.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Submission Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Projet</Label>
              <p className="text-sm text-muted-foreground">{submission.project.title}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Classe</Label>
              <p className="text-sm text-muted-foreground">{submission.class.code}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Version</Label>
              <p className="text-sm text-muted-foreground">#{submission.version}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Soumis le</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(submission.submitted_at).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>

          {/* Description */}
          {submission.description && (
            <div>
              <Label className="text-sm font-medium">Description</Label>
              <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded-md">
                {submission.description}
              </p>
            </div>
          )}

          {/* Links */}
          {submission.links.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Liens</Label>
              <div className="space-y-2 mt-1">
                {submission.links.map((link, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {link}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {submission.files.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Fichiers</Label>
              <div className="space-y-2 mt-1">
                {submission.files.map((file, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{file.split('/').pop()}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadFile(file)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Form */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Évaluation</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="status">Statut</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submitted">Soumis</SelectItem>
                    <SelectItem value="in_review">En révision</SelectItem>
                    <SelectItem value="approved">Approuvé</SelectItem>
                    <SelectItem value="rejected">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="grade">Note (0-20)</Label>
                <Input
                  id="grade"
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="Note sur 20"
                />
              </div>
            </div>

            <div className="mb-4">
              <Label htmlFor="feedback">Commentaires</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Commentaires et feedback pour l'étudiant..."
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [latestOnly, setLatestOnly] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [latestOnly]);

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
            links,
            files,
            description,
            is_latest,
            students!inner(id, full_name, email),
            projects!inner(id, title),
            classes!inner(id, code, title)
          `)
          .eq('is_latest', latestOnly ? true : undefined)
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
          status: sub.status,
          grade: sub.grade,
          feedback: sub.feedback,
          version: sub.version,
          links: sub.links || [],
          files: sub.files || [],
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

  const updateSubmission = async (submissionId: string, updates: { status?: string; grade?: number; feedback?: string }) => {
    try {
      const { error } = await supabase.functions.invoke('admin-update-submission', {
        body: { submissionId, updates }
      });

      if (error) throw error;

      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === submissionId
            ? { ...sub, ...updates }
            : sub
        )
      );

      toast.success('Soumission mise à jour avec succès');
    } catch (error) {
      console.error('Error updating submission:', error);
      toast.error('Erreur lors de la mise à jour de la soumission');
    }
  };

  const getFilteredSubmissions = () => {
    return submissions.filter(submission => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
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
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'in_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSubmissions = getFilteredSubmissions();

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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Révision des soumissions</h1>
        <p className="text-muted-foreground">
          {filteredSubmissions.length} soumission{filteredSubmissions.length > 1 ? 's' : ''} trouvée{filteredSubmissions.length > 1 ? 's' : ''}
        </p>
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
                <SelectItem value="submitted">Soumis</SelectItem>
                <SelectItem value="in_review">En révision</SelectItem>
                <SelectItem value="approved">Approuvé</SelectItem>
                <SelectItem value="rejected">Rejeté</SelectItem>
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
                      <div className="font-medium">{submission.student.full_name}</div>
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