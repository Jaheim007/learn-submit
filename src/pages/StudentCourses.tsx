import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, BookOpen, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cleanClassName } from '@/lib/utils';

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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Retour
      </Button>
      
      <div className="flex items-center gap-3">
        <BookOpen className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-primary">Mes Cours</h1>
          <p className="text-muted-foreground">Téléchargez les cours de votre formation</p>
        </div>
      </div>

      {groupedCourses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun cours disponible</h3>
            <p className="text-muted-foreground">
              Vos formateurs n'ont pas encore uploadé de cours pour votre groupe.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupedCourses.map((course) => (
            <Card key={course.course_group_id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <FileText className="h-8 w-8 text-primary" />
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {course.class_code}
                  </span>
                </div>
                <CardTitle className="text-lg mt-2">{course.title}</CardTitle>
                <CardDescription>{cleanClassName(course.class_title)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {course.description && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {course.description}
                  </p>
                )}
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {course.files.length} fichier{course.files.length > 1 ? 's' : ''} :
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {course.files.map((file) => (
                      <li key={file.id} className="flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        <span className="truncate">{file.file_name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Ajouté le {new Date(course.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>

                <Button
                  onClick={() => handleDownloadAll(course.files, course.title)}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger tout ({course.files.length})
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
