import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LoadingScreen } from '@/components/LoadingScreen';
import { StudentDashboardLayout } from '@/components/StudentDashboardLayout';
import { BookOpen, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations';

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
  image_src?: string | null;
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

  const getCourseImageSrc = async (value: string | null) => {
    if (!value) return null;
    const path = value.includes('/storage/v1/object/')
      ? value.split('/course-materials/')[1]?.split('?')[0]
      : value;
    if (!path) return null;
    const { data } = await supabase.storage.from('course-materials').createSignedUrl(path, 600);
    return data?.signedUrl || null;
  };

  const fetchCourses = async () => {
    try {
      const { data: studentData } = await supabase.from('students').select('id').eq('user_id', user?.id).single();
      if (!studentData) return;
      const { data: enrollments } = await supabase.from('enrollments').select('class_id').eq('student_id', studentData.id);
      if (!enrollments) return;
      const classIds = enrollments.map(e => e.class_id);
      const { data, error } = await supabase
        .from('course_materials')
        .select('id, title, file_name, file_url, description, image_url, class_id, classes (code)')
        .in('class_id', classIds);
      if (error) { toast.error('Erreur: ' + error.message); }
      const grouped: { [key: string]: GroupedCourse } = {};
      data?.forEach((c: any) => {
        const key = `${c.title}_${c.class_id}`;
        if (!grouped[key]) {
          grouped[key] = { id: c.id, title: c.title, class_code: c.classes?.code || 'N/A', description: c.description, image_url: c.image_url, materials: [] };
        }
        grouped[key].materials.push({ id: c.id, file_name: c.file_name, file_url: c.file_url });
      });
      const courses = await Promise.all(Object.values(grouped).map(async (course) => ({
        ...course,
        image_src: await getCourseImageSrc(course.image_url),
      })));
      setGroupedCourses(courses);
    } catch { toast.error('Erreur lors du chargement'); } finally { setLoading(false); }
  };

  if (authLoading || loading) return <LoadingScreen />;

  return (
    <StudentDashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground tracking-tight font-heading">Mes Cours</h1>
          <p className="text-sm text-muted-foreground mt-1">{groupedCourses.length} cours disponible{groupedCourses.length !== 1 ? 's' : ''}</p>
        </motion.div>

        {groupedCourses.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20">
            <div className="h-20 w-20 rounded-[22px] bg-muted/60 flex items-center justify-center mb-5">
              <BookOpen className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">Aucun cours</h3>
            <p className="text-sm text-muted-foreground">Les cours apparaîtront ici</p>
          </motion.div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-3">
            {groupedCourses.map((course) => (
              <motion.div
                key={course.id}
                variants={staggerItem}
                onClick={() => navigate(`/etudiant/cours/${course.id}`)}
                className="bg-card rounded-2xl border border-border/50 overflow-hidden touch-manipulation active:scale-[0.98] cursor-pointer transition-all"
              >
                {course.image_src ? (
                  <div className="relative h-36 w-full overflow-hidden">
                    <img src={course.image_src} alt={course.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <Badge variant="outline" className="bg-card/90 backdrop-blur-sm border-border/30 text-[11px] font-bold rounded-lg">
                        {course.class_code}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-20 w-full bg-gradient-to-br from-primary/8 via-card to-accent/5">
                    <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-primary/5" />
                    <div className="absolute top-3 left-3">
                      <Badge variant="outline" className="bg-card/90 backdrop-blur-sm border-border/30 text-[11px] font-bold rounded-lg">
                        {course.class_code}
                      </Badge>
                    </div>
                  </div>
                )}

                <div className="p-4 space-y-2">
                  <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2">{course.title}</h3>
                  {course.description && (
                    <div className="text-xs text-muted-foreground line-clamp-2 [&_*]:!m-0 [&_*]:!p-0 [&_*]:!inline" dangerouslySetInnerHTML={{ __html: course.description }} />
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                    <span>{course.materials.length} fichier{course.materials.length > 1 ? 's' : ''}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </StudentDashboardLayout>
  );
}