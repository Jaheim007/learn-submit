import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
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
  MessageSquare,
  LogOut,
  Send
} from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { LoadingScreen } from '@/components/LoadingScreen';
import { NotificationBell } from '@/components/NotificationBell';
import nysLogo from '@/assets/nys-logo.png';

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const renderContent = () => {
    if (apiState.loading && apiState.retryCount === 0) {
      return <LoadingScreen />;
    }

    if (apiState.error) {
      return (
        <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-3xl p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Erreur de chargement</h2>
          <p className="text-white/60 mb-6">{apiState.error}</p>
          <Button
            onClick={() => fetchSubmissions(true)}
            disabled={apiState.loading}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${apiState.loading ? 'animate-spin' : ''}`} />
            Réessayer{apiState.retryCount > 0 ? ` (${apiState.retryCount})` : ''}
          </Button>
        </div>
      );
    }

    if (!apiState.data || apiState.data.length === 0) {
      return (
        <div className="bg-background/20 backdrop-blur-sm border border-white/10 rounded-3xl p-16 text-center">
          <BookOpen className="h-20 w-20 text-white/10 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-white mb-2">Aucune soumission trouvée</h2>
          <p className="text-white/40 mb-6">
            Vous n'avez soumis aucun projet pour le moment.
          </p>
          <Button
            onClick={() => navigate('/etudiant/projets')}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
          >
            Voir mes projets
          </Button>
        </div>
      );
    }

    return (
      <div className="grid gap-6">
        {apiState.data.map((submission, index) => {
          const gradients = [
            'from-blue-600/20 to-cyan-600/20',
            'from-purple-600/20 to-pink-600/20',
            'from-indigo-600/20 to-blue-600/20',
          ];
          const gradient = gradients[index % gradients.length];

          const links = [submission.link1, submission.link2, submission.link3].filter(Boolean);
          const files = [submission.file1_url, submission.file2_url, submission.file3_url].filter(Boolean);

          return (
            <div
              key={submission.id}
              className={`bg-gradient-to-br ${gradient} backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-sm font-semibold">
                        {submission.class.code}
                      </span>
                      <StatusBadge status={submission.status} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {submission.project.title}
                    </h3>
                    <p className="text-white/60 text-sm">
                      Code: {submission.project.code}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-white/60">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(submission.submitted_at).toLocaleDateString('fr-FR')}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-white/70 border-white/20">
                      v{submission.version}
                    </Badge>
                  </div>
                </div>

                {submission.description && (
                  <div className="bg-black/20 border border-white/5 rounded-2xl p-4">
                    <p className="text-white/70 text-sm whitespace-pre-wrap">{submission.description}</p>
                  </div>
                )}

                {links.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-white/80">Liens</h4>
                    {links.map((link, idx) => (
                      <a
                        key={idx}
                        href={link!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-2xl bg-black/20 border border-white/5 hover:bg-black/30 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-white/70 truncate">{link}</span>
                      </a>
                    ))}
                  </div>
                )}

                {files.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-white/80">Fichiers</h4>
                    {files.map((fileUrl, idx) => (
                      <button
                        key={idx}
                        onClick={() => downloadFile(fileUrl!, getFileNameFromUrl(fileUrl!))}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl bg-black/20 border border-white/5 hover:bg-black/30 transition-colors"
                      >
                        <FileText className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-white/70 flex-1 text-left truncate">
                          {getFileNameFromUrl(fileUrl!)}
                        </span>
                        <Download className="h-4 w-4 text-white/40" />
                      </button>
                    ))}
                  </div>
                )}

                {(submission.grade !== null || submission.feedback) && (
                  <div className="border-t border-white/10 pt-4 space-y-3">
                    {submission.grade !== null && (
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-400" />
                        <span className="font-semibold text-white">
                          Note: {submission.grade}/20
                        </span>
                      </div>
                    )}
                    {submission.feedback && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-blue-400" />
                          <span className="text-sm font-medium text-white/80">Commentaires</span>
                        </div>
                        <p className="text-sm text-white/70 bg-black/20 p-3 rounded-2xl border border-white/5">
                          {submission.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (authLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
      {/* Premium Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={nysLogo} alt="NYS" className="h-10 w-10 object-contain filter drop-shadow-[0_0_10px_rgba(59,130,246,0.3)] group-hover:drop-shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all" />
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/etudiant/projets" className="text-white/70 hover:text-white transition-colors font-medium">Mes Projets</Link>
            <Link to="/etudiant/soumissions" className="text-white border-b-2 border-blue-500 transition-colors font-medium">Mes Soumissions</Link>
            <Link to="/etudiant/cours" className="text-white/70 hover:text-white transition-colors font-medium">Mes Cours</Link>
            <Link to="/etudiant/profil" className="text-white/70 hover:text-white transition-colors font-medium">Mon Profil</Link>
          </nav>
          
          <div className="flex items-center gap-4">
            <NotificationBell />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="relative z-10 container mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-8">
          <div className="flex items-center gap-3">
            <Send className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">Mes Soumissions</h1>
              <p className="text-white/60 text-sm">
                Gérez vos projets soumis et suivez leur statut
              </p>
            </div>
          </div>
          
          <Button
            onClick={() => fetchSubmissions(true)}
            disabled={apiState.loading}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${apiState.loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {renderContent()}
      </div>
    </div>
  );
}