import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { BookOpen, Calendar, Send, Filter, Clock, RefreshCw, AlertTriangle, LogOut, Bell, User, FileText, Trophy, Menu } from 'lucide-react';
import { cleanClassName } from '@/lib/utils';
import { NotificationBell } from '@/components/NotificationBell';
import nysLogo from '@/assets/nys-logo.png';

interface StudentClass {
  id: number;
  code: string;
  title: string;
}

interface Project {
  id: number;
  code: string;
  title: string;
  description: string;
  due_at: string | null;
  latest_submission?: {
    id: number;
    status: 'Reçu' | 'En révision' | 'Validé' | 'Refusé';
    submitted_at: string;
  } | null;
}

interface ApiState {
  data: { classes: StudentClass[]; projects: Project[] };
  loading: boolean;
  error: string | null;
  retryCount: number;
}

export default function StudentProjects() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [apiState, setApiState] = useState<ApiState>({
    data: { classes: [], projects: [] },
    loading: true,
    error: null,
    retryCount: 0
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user) {
      fetchStudentData();
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    // Check for class filter in URL
    const classParam = searchParams.get('class');
    if (classParam) {
      setSelectedClassId(parseInt(classParam));
    }
  }, [searchParams]);

  useEffect(() => {
    if (apiState.data.classes.length > 0) {
      fetchProjects();
    }
  }, [selectedClassId, apiState.data.classes]);

  const fetchStudentData = async (isRetry = false) => {
    try {
      if (!isRetry) {
        setApiState(prev => ({ ...prev, loading: true, error: null }));
      }

      console.log('🔍 Fetching student data for user:', user?.id);
      
      if (!user?.id) {
        throw new Error('Session expirée, veuillez vous reconnecter');
      }

      // First get the student record
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (studentError) {
        console.error('❌ Error fetching student:', studentError);
        throw new Error('Profil étudiant non trouvé');
      }

      if (!studentData) {
        console.log('ℹ️ No student profile found');
        setApiState(prev => ({
          ...prev,
          data: { classes: [], projects: [] },
          loading: false,
          error: null
        }));
        return;
      }

      console.log('✅ Student found:', studentData.id);

      // Then get enrollments with class information
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          id,
          class_id,
          classes!inner (
            id,
            code,
            title
          )
        `)
        .eq('student_id', studentData.id);

      if (enrollmentsError) {
        console.error('❌ Error fetching enrollments:', enrollmentsError);
        throw new Error('Impossible de récupérer vos inscriptions');
      }

      console.log('📚 Enrollments data:', enrollmentsData);

      const classesData = enrollmentsData?.map(enrollment => enrollment.classes).filter(Boolean) || [];

      console.log('🎓 Student classes:', classesData);
      
      setApiState(prev => ({
        ...prev,
        data: { classes: classesData as StudentClass[], projects: [] },
        loading: false,
        error: null,
        retryCount: 0
      }));
      
      // If there are classes, set the first one as selected by default
      if (classesData.length > 0 && !selectedClassId) {
        setSelectedClassId(classesData[0].id);
      }
      
    } catch (error) {
      console.error('💥 Error fetching student data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Impossible de récupérer vos projets, veuillez réessayer plus tard';
      
      setApiState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        retryCount: prev.retryCount + 1
      }));

      // Only show toast for real server errors (not empty data cases)
      if (error instanceof Error && !error.message.includes('non trouvé')) {
        toast({
          title: "Erreur de connexion",
          description: errorMessage,
          variant: "destructive"
        });
      }
    }
  };

  const fetchProjects = async () => {
    try {
      console.log('📝 Fetching projects...');
      
      // Get student ID first
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!studentData) return;

      // Build query based on class filter
      let classIds = apiState.data.classes.map(c => c.id);
      if (selectedClassId) {
        classIds = [selectedClassId];
      }

      if (classIds.length === 0) {
        setApiState(prev => ({
          ...prev,
          data: { ...prev.data, projects: [] }
        }));
        return;
      }

      // Get projects for the selected classes
      const { data: classProjects, error } = await supabase
        .from('class_projects')
        .select(`
          project_id,
          projects!inner (
            id,
            code,
            title,
            description,
            due_at,
            is_active
          )
        `)
        .in('class_id', classIds)
        .eq('projects.is_active', true);

      if (error) {
        console.error('❌ Error fetching projects:', error);
        throw error;
      }

      // Get unique projects
      const uniqueProjects = classProjects?.reduce((acc, item) => {
        const project = item.projects;
        if (!acc.find(p => p.id === project.id)) {
          acc.push(project);
        }
        return acc;
      }, [] as any[]) || [];

      // For each project, get the latest submission for the current class context
      const projectsWithSubmissions = await Promise.all(
        uniqueProjects.map(async (project) => {
          // Get latest submission for this project in the context of selected class(es)
          const { data: submission } = await supabase
            .from('submissions')
            .select('id, status, submitted_at')
            .eq('student_id', studentData.id)
            .eq('project_id', project.id)
            .in('class_id', classIds)
            .order('submitted_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...project,
            latest_submission: submission
          };
        })
      );

      console.log('📋 Projects with submissions:', projectsWithSubmissions);
      
      setApiState(prev => ({
        ...prev,
        data: { ...prev.data, projects: projectsWithSubmissions }
      }));
    } catch (error) {
      console.error('💥 Error fetching projects:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les projets",
        variant: "destructive"
      });
    }
  };

  const handleRetry = () => {
    fetchStudentData(true);
  };

  const handleClassFilter = (classId: number | null) => {
    setSelectedClassId(classId);
    
    // Update URL params
    if (classId) {
      setSearchParams({ class: classId.toString() });
    } else {
      setSearchParams({});
    }
  };

  const handleSubmitProject = (projectId: number) => {
    if (selectedClassId) {
      navigate(`/etudiant/soumettre?project_id=${projectId}&class_id=${selectedClassId}`);
    } else if (apiState.data.classes.length === 1) {
      navigate(`/etudiant/soumettre?project_id=${projectId}&class_id=${apiState.data.classes[0].id}`);
    } else {
      toast({
        title: "Sélectionnez une classe",
        description: "Veuillez d'abord sélectionner une classe pour soumettre ce projet",
        variant: "destructive"
      });
    }
  };

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Loading state
  if (authLoading || apiState.loading) {
    return <LoadingScreen />;
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      navigate('/');
    }
  };

  // Error state with retry option
  if (apiState.error && apiState.data.classes.length === 0) {
    return (
      <div className="min-h-screen relative">
        <AnimatedBackground />
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="text-center max-w-md mx-auto">
            <h1 className="text-3xl font-bold mb-4 text-white">Mes Projets</h1>
            <p className="text-white/60 mb-8">Consultez et soumettez vos projets par classe</p>
            
            <div className="bg-yellow-500/20 border border-yellow-500/30 backdrop-blur-xl rounded-2xl p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-yellow-500/20 rounded-full">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-yellow-300">Service temporairement indisponible</h3>
              <p className="text-yellow-200 mb-4">{apiState.error}</p>
              <div className="space-y-2">
                <Button 
                  onClick={handleRetry} 
                  disabled={apiState.loading}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  {apiState.loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Reconnexion...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Réessayer
                    </>
                  )}
                </Button>
                {apiState.retryCount > 2 && (
                  <p className="text-xs text-yellow-400 mt-2">
                    Tentative {apiState.retryCount}/3 - Contactez le support si le problème persiste
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { classes, projects } = apiState.data;

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
      {/* Modern Header */}
      <header className="relative z-10 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <img src={nysLogo} alt="NYS" className="h-10 w-10 object-contain transition-transform group-hover:scale-110" />
            </Link>
            
            <nav className="hidden md:flex items-center gap-1">
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10" asChild>
                <Link to="/etudiant/projets" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Mes Projets
                </Link>
              </Button>
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10" asChild>
                <Link to="/etudiant/soumissions" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Mes Soumissions
                </Link>
              </Button>
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10" asChild>
                <Link to="/etudiant/cours" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Mes Cours
                </Link>
              </Button>
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10" asChild>
                <Link to="/etudiant/leaderboard" className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Classement
                </Link>
              </Button>
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10" asChild>
                <Link to="/etudiant/profil" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Mon Profil
                </Link>
              </Button>
              
              <NotificationBell />
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleSignOut}
                className="text-white/80 hover:text-red-400 hover:bg-white/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Premium Hero Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Mes Projets
          </h1>
          <p className="text-white/50 text-lg">
            Consultez et soumettez vos projets par classe
          </p>
        </div>

        {/* Premium Filter Bar */}
        <div className="mb-8 bg-background/40 backdrop-blur-xl border border-white/5 rounded-3xl p-5 shadow-2xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-white/40 text-xs mb-1">Classe sélectionnée</p>
                <p className="text-white font-semibold text-base">
                  {classes.find(c => c.id === selectedClassId)?.title || 'Toutes les classes'}
                </p>
              </div>
            </div>
            <Button
              onClick={handleRetry}
              disabled={apiState.loading}
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white hover:bg-white/5"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${apiState.loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Premium Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-20 bg-background/20 backdrop-blur-xl border border-white/5 rounded-3xl">
            <BookOpen className="w-16 h-16 text-white/10 mx-auto mb-4" />
            <p className="text-white/40 text-base">
              {selectedClassId 
                ? 'Aucun projet disponible pour cette classe pour le moment.'
                : 'Veuillez sélectionner une classe pour voir les projets disponibles.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project, index) => {
              const isLate = project.due_at && new Date(project.due_at) < new Date();
              const daysUntilDue = project.due_at 
                ? Math.ceil((new Date(project.due_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                : null;

              // Gradient colors based on index for visual variety
              const gradients = [
                'from-cyan-500/10 to-teal-500/10 border-cyan-500/20',
                'from-amber-500/10 to-orange-500/10 border-amber-500/20',
                'from-rose-500/10 to-red-500/10 border-rose-500/20',
                'from-blue-500/10 to-indigo-500/10 border-blue-500/20',
                'from-emerald-500/10 to-green-500/10 border-emerald-500/20',
                'from-purple-500/10 to-pink-500/10 border-purple-500/20',
              ];
              
              const gradient = isLate 
                ? 'from-red-500/20 to-red-600/20 border-red-500/30'
                : gradients[index % gradients.length];

              return (
                <div 
                  key={project.id}
                  className={cleanClassName(`
                    bg-gradient-to-br ${gradient}
                    backdrop-blur-xl border rounded-3xl p-6 shadow-xl
                    hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]
                    relative overflow-hidden group
                  `)}
                >
                  {/* Decorative gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <Badge 
                          className="font-mono text-xs bg-background/40 text-white/90 border-white/20 px-3 py-1 mb-3"
                        >
                          {project.code}
                        </Badge>
                        <h3 className="text-xl font-bold text-white mb-2 leading-tight">
                          {project.title}
                        </h3>
                      </div>
                      
                      {/* Status Badge */}
                      {project.latest_submission && (
                        <StatusBadge status={project.latest_submission.status} />
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-white/50 text-sm line-clamp-2 mb-4 leading-relaxed">
                      {project.description}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="flex flex-col gap-2">
                        {/* Deadline */}
                        {project.due_at && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-white/40" />
                            <span className={cleanClassName(`
                              font-medium
                              ${isLate 
                                ? 'text-red-400' 
                                : daysUntilDue && daysUntilDue <= 3
                                ? 'text-yellow-400'
                                : 'text-white/60'
                              }
                            `)}>
                              {new Date(project.due_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short'
                              })}
                            </span>
                          </div>
                        )}
                        
                        {/* Last submission */}
                        {project.latest_submission && (
                          <div className="flex items-center gap-2 text-xs text-white/40">
                            <Clock className="w-3 h-3" />
                            <span>
                              {new Date(project.latest_submission.submitted_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short'
                              })}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <Button
                        onClick={() => navigate(`/etudiant/soumettre/${project.id}`)}
                        size="sm"
                        className={cleanClassName(`
                          ${project.latest_submission
                            ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                            : 'bg-white/95 hover:bg-white text-background font-semibold shadow-lg'
                          }
                        `)}
                      >
                        {project.latest_submission ? (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Revoir
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3 mr-1" />
                            Soumettre
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}