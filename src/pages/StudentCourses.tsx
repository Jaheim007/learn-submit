import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LoadingScreen } from '@/components/LoadingScreen';
import { StudentDashboardLayout } from '@/components/StudentDashboardLayout';
import { Download, BookOpen, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface CourseMaterial {
  id: string;
  file_name: string;
  file_url: string;
}

interface GroupedCourse {
  title: string;
  class_code: string;
  description: string | null;
  materials: CourseMaterial[];
}

export default function StudentCourses() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [groupedCourses, setGroupedCourses] = useState<GroupedCourse[]>([]);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchCourses();
  }, [user]);

  const fetchCourses = async () => {
    try {
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!studentData) return;

      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('class_id')
        .eq('student_id', studentData.id);

      if (!enrollments) return;

      const classIds = enrollments.map(e => e.class_id);

      const { data, error } = await supabase
        .from('course_materials')
        .select(`
          id,
          title,
          file_name,
          file_url,
          description,
          class_id,
          classes (code)
        `)
        .in('class_id', classIds);

      if (error) {
        console.error('Error fetching courses:', error);
        toast.error('Erreur: ' + error.message);
      }

      // Group materials by title and class_code
      const grouped: { [key: string]: GroupedCourse } = {};
      
      data?.forEach((c: any) => {
        const key = `${c.title}_${c.class_id}`;
        if (!grouped[key]) {
          grouped[key] = {
            title: c.title,
            class_code: c.classes?.code || 'N/A',
            description: c.description,
            materials: []
          };
        }
        grouped[key].materials.push({
          id: c.id,
          file_name: c.file_name,
          file_url: c.file_url
        });
      });

      const groupedArray = Object.values(grouped);
      console.log('Grouped courses:', groupedArray);
      setGroupedCourses(groupedArray);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (pathOrUrl: string, title: string) => {
    try {
      const fileName = title || 'cours';

      if (/^https?:\/\//i.test(pathOrUrl)) {
        // Direct external link
        window.open(pathOrUrl, '_blank');
        toast.success('Téléchargement lancé');
        return;
      }

      // Call edge function to get signed URL
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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Téléchargement refusé');
      }

      const { signedUrl } = await response.json();

      // Force download via blob to avoid inline opening in browser
      const res = await fetch(signedUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Téléchargement réussi');
    } catch (error: any) {
      console.error('Course download error:', error);
      toast.error(error.message || 'Téléchargement impossible');
    }
  };

  if (loading || authLoading) return <LoadingScreen />;

  const toggleCourse = (title: string) => {
    setExpandedCourse(expandedCourse === title ? null : title);
  };

  return (
    <StudentDashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Mes Cours</h1>
          <p className="text-muted-foreground">Accédez à vos supports de cours</p>
        </div>

        <div className="space-y-4">
          {groupedCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <BookOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucun cours</h3>
              <p className="text-muted-foreground">Aucun support de cours disponible</p>
            </div>
          ) : (
            groupedCourses.map((course, idx) => {
              const isExpanded = expandedCourse === course.title;
              return (
                <Card key={idx} className="premium-card overflow-hidden">
                  <div
                    className="p-6 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => toggleCourse(course.title)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <BookOpen className="h-8 w-8 text-primary flex-shrink-0" />
                          <h3 className="text-xl font-bold">{course.title}</h3>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{course.class_code}</Badge>
                          <Badge variant="secondary">{course.materials.length} fichier{course.materials.length > 1 ? 's' : ''}</Badge>
                        </div>
                        {course.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                        )}
                      </div>
                      <div className="ml-4">
                        {isExpanded ? (
                          <ChevronUp className="h-6 w-6 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border/50 bg-muted/20 p-6">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Fichiers disponibles
                      </h4>
                      <div className="space-y-3">
                        {course.materials.map((material) => (
                          <div
                            key={material.id}
                            className="flex items-center justify-between p-4 bg-background rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-primary" />
                              <span className="font-medium">{material.file_name}</span>
                            </div>
                            <Button
                              onClick={() => downloadFile(material.file_url, material.file_name)}
                              size="sm"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Télécharger
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </StudentDashboardLayout>
  );
}
