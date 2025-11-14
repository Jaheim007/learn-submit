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
  id: number;
  title: string;
  course_code: string;
  file_url: string;
  class_code: string;
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

      const { data } = await supabase
        .from('course_materials')
        .select(`
          id,
          title,
          course_code,
          file_url,
          classes (code)
        `)
        .in('class_id', classIds);

      const mapped = data?.map((c: any) => ({
        ...c,
        class_code: c.classes?.code
      })) || [];

      setCourses(mapped);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (url: string, title: string) => {
    try {
      window.open(url, '_blank');
      toast.success('Téléchargement lancé');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
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
              <div key={course.id} className="premium-card p-6">
                <BookOpen className="h-12 w-12 text-primary mb-4" />
                <Badge variant="outline" className="mb-2">{course.course_code}</Badge>
                <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">Classe: {course.class_code}</p>
                
                <Button
                  onClick={() => downloadFile(course.file_url, course.title)}
                  className="w-full"
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
