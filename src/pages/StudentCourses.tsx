import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, BookOpen, LogOut, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';
import { cleanClassName } from '@/lib/utils';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { LoadingScreen } from '@/components/LoadingScreen';
import { NotificationBell } from '@/components/NotificationBell';
import nysLogo from '@/assets/nys-logo.png';

interface CourseMaterial {
  id: string;
  title: string;
  description: string;
  file_name: string;
  file_type: string;
  file_url: string;
  created_at: string;
  course_group_id: string;
  classes: {
    title: string;
    code: string;
  };
}

interface GroupedCourse {
  course_group_id: string;
  title: string;
  description: string;
  created_at: string;
  class_code: string;
  class_title: string;
  files: {
    id: string;
    file_name: string;
    file_url: string;
    file_type: string;
  }[];
}

export default function StudentCourses() {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [groupedCourses, setGroupedCourses] = useState<GroupedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourseMaterials();
  }, []);

  const fetchCourseMaterials = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!studentData) return;

      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('class_id')
        .eq('student_id', studentData.id);

      if (!enrollments || enrollments.length === 0) {
        setLoading(false);
        return;
      }

      const classIds = enrollments.map(e => e.class_id);

      const { data, error } = await supabase
        .from('course_materials')
        .select(`
          *,
          classes (title, code)
        `)
        .in('class_id', classIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials(data as any);
      
      // Group materials by course_group_id
      const grouped = (data as CourseMaterial[]).reduce((acc, material) => {
        const existingGroup = acc.find(g => g.course_group_id === material.course_group_id);
        
        if (existingGroup) {
          existingGroup.files.push({
            id: material.id,
            file_name: material.file_name,
            file_url: material.file_url,
            file_type: material.file_type
          });
        } else {
          acc.push({
            course_group_id: material.course_group_id,
            title: material.title,
            description: material.description,
            created_at: material.created_at,
            class_code: material.classes.code,
            class_title: material.classes.title,
            files: [{
              id: material.id,
              file_name: material.file_name,
              file_url: material.file_url,
              file_type: material.file_type
            }]
          });
        }
        
        return acc;
      }, [] as GroupedCourse[]);
      
      setGroupedCourses(grouped);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des cours');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAll = async (files: GroupedCourse['files'], courseTitle: string) => {
    try {
      toast.info(`Téléchargement de ${files.length} fichier${files.length > 1 ? 's' : ''}...`);
      
      for (const file of files) {
        const { data, error } = await supabase.storage
          .from('course-materials')
          .download(file.file_url);

        if (error) throw error;

        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.file_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Small delay between downloads to avoid browser blocking
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      toast.success('Tous les fichiers ont été téléchargés');
    } catch (error: any) {
      toast.error('Erreur lors du téléchargement');
      console.error(error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
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
            <Link to="/etudiant/soumissions" className="text-white/70 hover:text-white transition-colors font-medium">Mes Soumissions</Link>
            <Link to="/etudiant/cours" className="text-white border-b-2 border-blue-500 transition-colors font-medium">Mes Cours</Link>
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

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="h-8 w-8 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">Mes Cours</h1>
          </div>
          <p className="text-white/60 text-lg">
            Téléchargez les cours de votre formation
          </p>
        </div>

        {groupedCourses.length === 0 ? (
          <div className="bg-background/20 backdrop-blur-sm border border-white/10 rounded-3xl p-16 text-center">
            <BookOpen className="h-20 w-20 text-white/10 mx-auto mb-6" />
            <p className="text-white/40 text-lg">
              Aucun cours disponible pour le moment
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {groupedCourses.map((course, index) => {
              const gradients = [
                'from-blue-600/20 to-cyan-600/20',
                'from-purple-600/20 to-pink-600/20',
                'from-indigo-600/20 to-blue-600/20',
              ];
              const gradient = gradients[index % gradients.length];
              
              return (
                <div 
                  key={course.course_group_id} 
                  className={`bg-gradient-to-br ${gradient} backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.01]`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-sm font-semibold">
                          {course.class_code}
                        </span>
                        <h3 className="text-2xl font-bold text-white">{course.title}</h3>
                        <p className="text-white/60">{course.description}</p>
                        <p className="text-sm text-white/40">{course.class_title}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mt-6">
                      <p className="text-sm font-medium text-white/80">
                        {course.files.length} fichier{course.files.length > 1 ? 's' : ''} :
                      </p>
                      {course.files.map((file) => (
                        <div key={file.id} className="flex items-center gap-3 p-3 rounded-2xl bg-black/20 border border-white/5">
                          <FileText className="h-5 w-5 text-blue-400" />
                          <span className="text-sm flex-1 truncate text-white/80">{file.file_name}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      onClick={() => handleDownloadAll(course.files, course.title)}
                      className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl py-6"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Télécharger tout ({course.files.length})
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
