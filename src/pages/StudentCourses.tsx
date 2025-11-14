import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LoadingScreen } from '@/components/LoadingScreen';
import { StudentDashboardLayout } from '@/components/StudentDashboardLayout';
import { BookOpen, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface CourseMaterial {
  id: string;
  file_name: string;
  file_url: string;
}

interface GroupedCourse {
  id: string;
  title: string;
  class_code: string;
  description: string | null;
  image_url: string | null;
  materials: CourseMaterial[];
}

export default function StudentCourses() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [groupedCourses, setGroupedCourses] = useState<GroupedCourse[]>([]);

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
          image_url,
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
            id: c.id, // Use first material's ID as representative
            title: c.title,
            class_code: c.classes?.code || 'N/A',
            description: c.description,
            image_url: c.image_url,
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

  if (authLoading || loading) return <LoadingScreen />;

  return (
    <StudentDashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Mes Cours</h1>
          <p className="text-muted-foreground">Accédez à vos supports de cours</p>
        </div>

        {groupedCourses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Aucun cours disponible
            </h3>
            <p className="text-muted-foreground">
              Les supports de cours apparaîtront ici une fois publiés
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {groupedCourses.map((course) => (
              <Card
                key={course.id}
                className="border-border/50 bg-card/40 backdrop-blur-sm hover:bg-accent/20 transition-all overflow-hidden group cursor-pointer"
                onClick={() => navigate(`/etudiant/cours/${course.id}`)}
              >
                {/* Course Image */}
                {course.image_url && (
                  <div className="relative w-full h-48 overflow-hidden">
                    <img 
                      src={course.image_url} 
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                        <BookOpen className="w-3 h-3 mr-1" />
                        {course.class_code}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Course Content */}
                <div className="p-6 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    {!course.image_url && (
                      <Badge variant="secondary">
                        {course.class_code}
                      </Badge>
                    )}
                  </div>

                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <Badge variant="outline" className="text-xs">
                      <FileText className="w-3 h-3 mr-1" />
                      {course.materials.length} fichier{course.materials.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StudentDashboardLayout>
  );
}
