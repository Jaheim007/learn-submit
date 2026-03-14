import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LoadingScreen } from '@/components/LoadingScreen';
import { StudentDashboardLayout } from '@/components/StudentDashboardLayout';
import { Download, FileText, ArrowLeft, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface CourseMaterial {
  id: string;
  file_name: string;
  file_url: string;
}

interface CourseDetail {
  title: string;
  description: string | null;
  image_url: string | null;
  class_code: string;
  materials: CourseMaterial[];
}

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<CourseDetail | null>(null);

  useEffect(() => {
    if (user && courseId) {
      fetchCourseDetail();
    }
  }, [user, courseId]);

  const fetchCourseDetail = async () => {
    try {
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!studentData) return;

      // Fetch all materials for this course group
      const { data, error } = await supabase
        .from('course_materials')
        .select(`
          id,
          title,
          description,
          image_url,
          file_name,
          file_url,
          class_id,
          classes (code)
        `)
        .eq('id', courseId)
        .single();

      if (error) throw error;

      if (data) {
        // Fetch all materials with same title and class
        const { data: materials } = await supabase
          .from('course_materials')
          .select('id, file_name, file_url')
          .eq('title', data.title)
          .eq('class_id', data.class_id);

        setCourse({
          title: data.title,
          description: data.description,
          image_url: data.image_url,
          class_code: (data.classes as any)?.code || 'N/A',
          materials: materials || []
        });
      }
    } catch (error: any) {
      toast.error('Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (pathOrUrl: string, fileName: string) => {
    try {
      if (/^https?:\/\//i.test(pathOrUrl)) {
        const link = document.createElement('a');
        link.href = pathOrUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Téléchargement lancé');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Session expirée, veuillez vous reconnecter');
        return;
      }

      const response = await fetch(
        'https://ucgaxcnfvrbhsxxcwceo.supabase.co/functions/v1/download-course-material',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ filePath: pathOrUrl }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Erreur de téléchargement');
      }

      // Trigger actual file download
      const link = document.createElement('a');
      link.href = result.signedUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Téléchargement lancé');
    } catch (error: any) {
      toast.error('Erreur: ' + error.message);
    }
  };

  if (authLoading || loading) return <LoadingScreen />;

  if (!course) {
    return (
      <StudentDashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">Cours introuvable</h3>
            <Button onClick={() => navigate('/etudiant/cours')} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux cours
            </Button>
          </div>
        </div>
      </StudentDashboardLayout>
    );
  }

  return (
    <StudentDashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/etudiant/cours')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux cours
        </Button>

        {/* Course Image Hero */}
        {course.image_url && (
          <div className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden border border-border/50 bg-gradient-to-br from-primary/5 to-secondary/5">
            <img 
              src={course.image_url} 
              alt={course.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                <BookOpen className="w-3 h-3 mr-1" />
                {course.class_code}
              </Badge>
            </div>
          </div>
        )}

        {/* Course Info Card */}
        <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
          <CardContent className="p-6 space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {course.title}
              </h1>
              {!course.image_url && (
                <Badge variant="secondary" className="mb-4">
                  <BookOpen className="w-3 h-3 mr-1" />
                  {course.class_code}
                </Badge>
              )}
            </div>

            {course.description && (
              <div 
                className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground leading-relaxed [&_p]:mb-3 [&_strong]:text-foreground [&_a]:text-primary"
                dangerouslySetInnerHTML={{ __html: course.description }}
              />
            )}
          </CardContent>
        </Card>

        {/* Course Materials */}
        <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Fichiers du cours ({course.materials.length})
            </h2>
            
            <div className="space-y-3">
              {course.materials.map((material) => (
                <div
                  key={material.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">
                      {material.file_name}
                    </span>
                  </div>
                  <Button
                    onClick={() => downloadFile(material.file_url, material.file_name)}
                    size="sm"
                    variant="default"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </Button>
                </div>
              ))}

              {course.materials.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun fichier disponible pour ce cours
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </StudentDashboardLayout>
  );
}
