import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

interface CourseMaterial {
  id: string;
  title: string;
  description: string;
  file_name: string;
  file_type: string;
  file_url: string;
  created_at: string;
  classes: {
    title: string;
    code: string;
  };
}

export default function StudentCourses() {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);

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
    } catch (error: any) {
      toast.error('Erreur lors du chargement des cours');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('course-materials')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Téléchargement réussi');
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
      <div className="flex items-center gap-3">
        <BookOpen className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-primary">Mes Cours</h1>
          <p className="text-muted-foreground">Téléchargez les cours de votre formation</p>
        </div>
      </div>

      {materials.length === 0 ? (
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
          {materials.map((material) => (
            <Card key={material.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <FileText className="h-8 w-8 text-primary" />
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {material.classes.code}
                  </span>
                </div>
                <CardTitle className="text-lg mt-2">{material.title}</CardTitle>
                <CardDescription>{material.classes.title}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {material.description && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {material.description}
                  </p>
                )}
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{material.file_name}</span>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Ajouté le {new Date(material.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>

                <Button
                  onClick={() => handleDownload(material.file_url, material.file_name)}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
