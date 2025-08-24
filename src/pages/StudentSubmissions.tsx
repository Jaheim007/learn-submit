import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Calendar, 
  ExternalLink, 
  Download, 
  Edit3, 
  Trash2, 
  Loader2,
  RefreshCw,
  AlertTriangle,
  BookOpen,
  Star,
  MessageSquare
} from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// Status mapping from English DB values to French labels
const reverseStatusMap: Record<string, "Reçu" | "En révision" | "Validé" | "Refusé"> = {
  "received": "Reçu",
  "in_review": "En révision", 
  "approved": "Validé",
  "rejected": "Refusé",
};

interface Submission {
  id: number;
  status: 'Reçu' | 'En révision' | 'Validé' | 'Refusé';
  grade: number | null;
  feedback: string | null;
  submitted_at: string;
  updated_at: string;
  description: string | null;
  link1: string | null;
  link2: string | null;
  link3: string | null;
  file1_url: string | null;
  file2_url: string | null;
  file3_url: string | null;
  version: number;
  project: {
    id: number;
    code: string;
    title: string;
  };
  class: {
    id: number;
    code: string;
    title: string;
  };
}

interface ApiState {
  data: Submission[];
  loading: boolean;
  error: string | null;
  retryCount: number;
}

export default function StudentSubmissions() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [apiState, setApiState] = useState<ApiState>({
    data: [],
    loading: true,
    error: null,
    retryCount: 0
  });
  const [studentId, setStudentId] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user) {
      fetchSubmissions();
    }
  }, [user, authLoading, navigate]);

  // Set up realtime updates for submission changes
  useEffect(() => {
    if (!studentId || !user) return;

    const channel = supabase
      .channel('submission-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
          filter: `student_id=eq.${studentId}`
        },
        () => {
          // Refresh submissions when any change occurs
          fetchSubmissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId, user]);

  const fetchSubmissions = async (isRetry = false) => {
    console.log('🔍 Fetching student submissions for user:', user?.id);
    
    if (isRetry) {
      setApiState(prev => ({ ...prev, loading: true, error: null }));
    } else {
      setApiState(prev => ({ ...prev, loading: true, error: null, retryCount: 0 }));
    }

    try {
      // Get student record first
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (studentError) {
        throw new Error(`Student fetch error: ${studentError.message}`);
      }

      if (!student) {
        console.log('ℹ️ No student profile found');
        setApiState({
          data: [],
          loading: false,
          error: null,
          retryCount: 0
        });
        return;
      }

      console.log('✅ Student found:', student.id);
      setStudentId(student.id);

      // Get submissions with project and class info
      const { data: submissions, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          id,
          status,
          grade,
          feedback,
          submitted_at,
          updated_at,
          description,
          link1,
          link2,
          link3,
          file1_url,
          file2_url,
          file3_url,
          version,
          project_id,
          class_id,
          projects!inner (
            id,
            code,
            title
          ),
          classes!inner (
            id,
            code,
            title
          )
        `)
        .eq('student_id', student.id)
        .order('submitted_at', { ascending: false });

      if (submissionsError) {
        throw new Error(`Submissions fetch error: ${submissionsError.message}`);
      }

      const formattedSubmissions: Submission[] = (submissions || []).map(sub => ({
        ...sub,
        status: (reverseStatusMap[sub.status] || sub.status) as "Reçu" | "En révision" | "Validé" | "Refusé",
        project: sub.projects,
        class: sub.classes
      }));

      console.log('📄 Submissions data:', formattedSubmissions);
      
      setApiState({
        data: formattedSubmissions,
        loading: false,
        error: null,
        retryCount: 0
      });

    } catch (error: any) {
      console.error('❌ Error fetching submissions:', error);
      
      const retryCount = isRetry ? apiState.retryCount + 1 : 1;
      setApiState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Une erreur inattendue est survenue',
        retryCount
      }));

      // Don't show toast on retry - let user handle it
      if (!isRetry) {
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger vos soumissions",
          variant: "destructive"
        });
      }
    }
  };

  const handleRetry = () => {
    fetchSubmissions(true);
  };

  const handleEdit = (submission: Submission) => {
    navigate(`/etudiant/soumettre?project_id=${submission.project.id}&class_id=${submission.class.id}`);
  };

  const handleDelete = async (submissionId: number) => {
    try {
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', submissionId)
        .eq('student_id', studentId);

      if (error) throw error;

      toast({
        title: "Soumission supprimée",
        description: "La soumission a été supprimée avec succès"
      });

      // Refresh submissions
      fetchSubmissions();

    } catch (error: any) {
      console.error('Error deleting submission:', error);
      toast({
        title: "Erreur de suppression",
        description: error.message || "Impossible de supprimer la soumission",
        variant: "destructive"
      });
    }
  };

  const downloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('submissions')
        .download(fileUrl);

      if (error) throw error;

      // Create download link
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: "Erreur de téléchargement",
        description: "Impossible de télécharger le fichier",
        variant: "destructive"
      });
    }
  };

  const getFileNameFromUrl = (url: string) => {
    return url.split('/').pop() || 'fichier';
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <section className="bg-gradient-card py-12 px-4 border-b border-border">
          <div className="max-w-content mx-auto">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Mes Soumissions
                </h1>
                <p className="text-muted-foreground">
                  Gérez vos projets soumis et suivez leur statut
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-content mx-auto p-4 md:p-6 lg:p-8">
          {/* Loading State */}
          {apiState.loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-muted-foreground">
                  Chargement de vos soumissions...
                </span>
              </div>
            </div>
          )}

          {/* Error State */}
          {!apiState.loading && apiState.error && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-destructive mb-2">
                      Service temporairement indisponible
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Impossible de récupérer vos soumissions. Veuillez réessayer dans quelques instants.
                    </p>
                    <div className="flex items-center gap-3">
                      <Button 
                        onClick={handleRetry} 
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Réessayer {apiState.retryCount > 0 && `(${apiState.retryCount})`}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!apiState.loading && !apiState.error && apiState.data.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium text-foreground mb-2">
                  Aucune soumission trouvée
                </h3>
                <p className="text-muted-foreground mb-6">
                  Vous n'avez soumis aucun projet pour le moment.
                </p>
                <Button onClick={() => navigate('/etudiant/mes-projets')}>
                  Voir mes projets
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Submissions List */}
          {!apiState.loading && !apiState.error && apiState.data.length > 0 && (
            <div className="space-y-6">
              {apiState.data.map((submission) => {
                const canEdit = submission.status === 'Reçu';
                const files = [
                  submission.file1_url,
                  submission.file2_url,
                  submission.file3_url
                ].filter(Boolean);
                const links = [
                  submission.link1,
                  submission.link2,
                  submission.link3
                ].filter(Boolean);

                return (
                  <Card key={submission.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {submission.project.code} - {submission.project.title}
                            <Badge variant="outline">v{submission.version}</Badge>
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <BookOpen className="w-4 h-4" />
                            {submission.class.code} - {submission.class.title}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            Soumis le {new Date(submission.submitted_at).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        <StatusBadge status={submission.status} />
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Description */}
                      {submission.description && (
                        <div>
                          <h4 className="font-medium text-sm text-foreground mb-2">Description</h4>
                          <p className="text-sm text-muted-foreground">
                            {submission.description}
                          </p>
                        </div>
                      )}

                      {/* Links */}
                      {links.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-foreground mb-2">Liens</h4>
                          <div className="space-y-1">
                            {links.map((link, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                <a 
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline truncate"
                                >
                                  {link}
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Files */}
                      {files.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-foreground mb-2">Fichiers</h4>
                          <div className="space-y-1">
                            {files.map((fileUrl, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <button
                                  onClick={() => downloadFile(fileUrl, getFileNameFromUrl(fileUrl))}
                                  className="text-sm text-primary hover:underline truncate text-left"
                                >
                                  {getFileNameFromUrl(fileUrl)}
                                </button>
                                <Download className="w-4 h-4 text-muted-foreground" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Grade and Feedback */}
                      {(submission.grade !== null || submission.feedback) && (
                        <div className="border-t border-border pt-4">
                          {submission.grade !== null && (
                            <div className="flex items-center gap-2 mb-2">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="font-medium text-sm">
                                Note: {submission.grade}/20
                              </span>
                            </div>
                          )}
                          {submission.feedback && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="w-4 h-4 text-primary" />
                                <span className="font-medium text-sm">Commentaires du formateur</span>
                              </div>
                              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                                {submission.feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Locked status badge - submissions are locked after creation */}
                      <div className="pt-4 border-t border-border">
                        <Badge variant="outline" className="text-xs">
                          🔒 Verrouillé après envoi
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}