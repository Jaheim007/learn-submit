import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText, Calendar, Layers, Download, Eye, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RichTextRenderer } from '@/components/ui/rich-text-editor';
import { toast } from 'sonner';

interface CourseMaterial {
  id: string;
  title: string;
  description: string;
  file_name: string;
  file_type: string;
  file_url: string;
  image_url: string | null;
  image_src?: string | null;
  class_id: number;
  created_at: string;
  uploaded_by: string;
  uploaded_by_name?: string;
  classes: { title: string };
}

export default function AcademyCourses() {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<CourseMaterial | null>(null);

  useEffect(() => { fetchMaterials(); }, []);

  const getCourseImagePath = (value: string | null) => {
    if (!value) return null;
    if (!value.includes('/storage/v1/object/')) return value;
    return value.split('/course-materials/')[1]?.split('?')[0] || null;
  };

  const getCourseImageSrc = async (value: string | null) => {
    const path = getCourseImagePath(value);
    if (!path) return null;
    const { data } = await supabase.storage.from('course-materials').createSignedUrl(path, 600);
    return data?.signedUrl || null;
  };

  const fetchMaterials = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('course_materials')
      .select('*, classes (title)')
      .order('created_at', { ascending: false });

    if (data) {
      // Get uploader names from profiles
      const uploaderIds = [...new Set(data.map((m: any) => m.uploaded_by).filter(Boolean))];
      let uploaderNames: Record<string, string> = {};
      if (uploaderIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', uploaderIds);
        if (profiles) {
          profiles.forEach(p => {
            uploaderNames[p.id] = p.full_name || p.email;
          });
        }
      }

      const enriched = data.map((m: any) => ({
        ...m,
        uploaded_by_name: m.uploaded_by ? uploaderNames[m.uploaded_by] || 'Inconnu' : null,
      }));
      const withImages = await Promise.all(enriched.map(async (material: any) => ({
        ...material,
        image_src: await getCourseImageSrc(material.image_url),
      })));
      setMaterials(withImages);
    }
    setLoading(false);
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from('course-materials').download(filePath);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Erreur lors du téléchargement');
    }
  };

  // Group by class
  const coursesByClass = materials.reduce((acc, m) => {
    const className = m.classes?.title || 'Sans classe';
    if (!acc[className]) acc[className] = [];
    acc[className].push(m);
    return acc;
  }, {} as Record<string, CourseMaterial[]>);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4" />
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded mb-3" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Cours</h1>
        <p className="text-sm text-muted-foreground">
          Vue d'ensemble des cours par classe — {materials.length} cours au total
        </p>
      </div>

      {materials.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">Aucun cours disponible</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(coursesByClass).map(([className, courses]) => (
            <div key={className}>
              <div className="flex items-center gap-2 mb-3">
                <Layers className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-foreground">{className}</h2>
                <Badge variant="secondary" className="text-xs">{courses.length} cours</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map((material) => (
                  <Card key={material.id} className="group overflow-hidden hover:shadow-md transition-all">
                    <div className="flex">
                      {material.image_src ? (
                        <div className="w-28 flex-shrink-0 bg-muted">
                          <img src={material.image_src} alt={material.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-2 flex-shrink-0 bg-primary rounded-l-lg" />
                      )}
                      <div className="flex-1 p-4 min-w-0">
                        <h3 className="font-semibold text-foreground line-clamp-1 text-sm">{material.title}</h3>
                        {material.description && (
                          <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            <RichTextRenderer content={material.description} className="[&_*]:!text-muted-foreground [&_*]:!text-xs" />
                          </div>
                        )}
                        {material.uploaded_by_name && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1.5">
                            <User className="h-3 w-3" />
                            <span className="font-medium text-foreground">{material.uploaded_by_name}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(material.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedCourse(material)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(material.file_url, material.file_name)}>
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      <Dialog open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedCourse?.title}</DialogTitle>
          </DialogHeader>
          {selectedCourse && (
            <div className="space-y-4">
              {selectedCourse.image_src && (
                <img src={selectedCourse.image_src} alt={selectedCourse.title} className="w-full rounded-lg" />
              )}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary"><Layers className="h-3 w-3 mr-1" />{selectedCourse.classes?.title}</Badge>
              </div>
              {selectedCourse.uploaded_by_name && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Publié par <span className="font-medium text-foreground">{selectedCourse.uploaded_by_name}</span> le {new Date(selectedCourse.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              )}
              {selectedCourse.description && (
                <div className="p-3 bg-muted/50 rounded-lg border text-sm">
                  <RichTextRenderer content={selectedCourse.description} />
                </div>
              )}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{selectedCourse.file_name}</span>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => handleDownload(selectedCourse.file_url, selectedCourse.file_name)}>
                  <Download className="h-3.5 w-3.5" />Télécharger
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}