import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LoadingScreen } from '@/components/LoadingScreen';
import { StudentDashboardLayout } from '@/components/StudentDashboardLayout';
import { Download, BookOpen, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Course {
  id: string;
  title: string;
  file_name: string;
  file_url: string;
  class_code: string;
  description: string | null;
}

export default function StudentCourses() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);

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

      const mapped = data?.map((c: any) => ({
        id: c.id,
        title: c.title,
        file_name: c.file_name,
        file_url: c.file_url,
        description: c.description,
        class_code: c.classes?.code || 'N/A'
      })) || [];

      console.log('Fetched courses:', mapped);
      setCourses(mapped);
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

  return (
    <StudentDashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Mes Cours</h1>
          <p className="text-muted-foreground">Accédez à vos supports de cours</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <BookOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucun cours</h3>
              <p className="text-muted-foreground">Aucun support de cours disponible</p>
            </div>
          ) : (
            courses.map((course) => (
              <div key={course.id} className="premium-card p-6 hover:scale-[1.02] transition-transform">
                <BookOpen className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                <Badge variant="outline" className="mb-2">{course.file_name}</Badge>
                <p className="text-sm text-muted-foreground mb-2">Classe: {course.class_code}</p>
                {course.description && (
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{course.description}</p>
                )}
                
                <Button
                  onClick={() => downloadFile(course.file_url, course.file_name)}
                  className="w-full mt-4"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </StudentDashboardLayout>
  );
}
