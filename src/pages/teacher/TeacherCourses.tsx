import { useState, useEffect } from 'react';
import { sanitizeStorageKey } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, FileText, Trash2, Download, BookOpen, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RichTextEditor, RichTextRenderer } from '@/components/ui/rich-text-editor';

interface CourseMaterial {
  id: string;
  title: string;
  description: string;
  file_name: string;
  file_type: string;
  file_url: string;
  image_url: string | null;
  class_id: number;
  course_group_id: string | null;
  created_at: string;
  classes: { title: string };
}

interface ClassInfo {
  id: number;
  code: string;
  title: string;
}

export default function TeacherCourses() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<{ id: string; filePath: string } | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    class_id: '',
    files: [] as File[],
    image: null as File | null,
  });

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get assigned classes
      const { data: assignments } = await supabase
        .from('supervisor_class_assignments')
        .select('class_id, classes(id, code, title)')
        .eq('supervisor_user_id', user?.id);

      const assignedClasses = (assignments || []).map(a => a.classes as any as ClassInfo);
      setClasses(assignedClasses);

      // RLS already filters to supervisor's classes
      const { data: mats } = await supabase
        .from('course_materials')
        .select('*, classes(title)')
        .order('created_at', { ascending: false });

      setMaterials((mats as any) || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.files.length === 0 || !formData.title || !formData.class_id) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }
    setUploading(true);
    try {
      let imageUrl = null;
      if (formData.image) {
        const imageExt = formData.image.name.split('.').pop();
        const imagePath = `course-images/${Date.now()}.${imageExt}`;
        const { error: imageError } = await supabase.storage
          .from('course-materials')
          .upload(imagePath, formData.image, { cacheControl: '3600', upsert: false });
        if (imageError) throw new Error(`Erreur image: ${imageError.message}`);
        const { data: { publicUrl } } = supabase.storage.from('course-materials').getPublicUrl(imagePath);
        imageUrl = publicUrl;
      }

      const courseGroupId = crypto.randomUUID();
      let successCount = 0;

      for (const file of formData.files) {
        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop();
        const safeName = sanitizeStorageKey(file.name.replace(/\.[^/.]+$/, ''));
        const uniqueFileName = `${safeName}_${timestamp}.${fileExt}`;
        const filePath = `${formData.class_id}/${uniqueFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('course-materials')
          .upload(filePath, file, { cacheControl: '3600', upsert: false });
        if (uploadError) throw new Error(`Erreur upload ${file.name}: ${uploadError.message}`);

        const { error: dbError } = await supabase
          .from('course_materials')
          .insert({
            title: formData.title,
            description: formData.description,
            class_id: parseInt(formData.class_id),
            file_url: filePath,
            file_name: file.name,
            file_type: file.type,
            uploaded_by: user!.id,
            course_group_id: courseGroupId,
            image_url: imageUrl,
          });
        if (dbError) throw new Error(`Erreur DB ${file.name}: ${dbError.message}`);
        successCount++;
      }

      toast.success(`Cours "${formData.title}" uploadé avec ${successCount} fichier${successCount > 1 ? 's' : ''}`);
      setFormData({ title: '', description: '', class_id: '', files: [], image: null });
      setShowUploadForm(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!materialToDelete) return;
    try {
      await supabase.storage.from('course-materials').remove([materialToDelete.filePath]);
      await supabase.from('course_materials').delete().eq('id', materialToDelete.id);
      toast.success('Cours supprimé');
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleteDialogOpen(false);
      setMaterialToDelete(null);
    }
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data } = await supabase.storage.from('course-materials').createSignedUrl(filePath, 3600);
      if (data?.signedUrl) {
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = fileName;
        link.click();
      }
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(groupId) ? next.delete(groupId) : next.add(groupId);
      return next;
    });
  };

  // Group materials by course_group_id
  const grouped = materials.reduce((acc, mat) => {
    const key = mat.course_group_id || mat.id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(mat);
    return acc;
  }, {} as Record<string, CourseMaterial[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cours</h1>
          <p className="text-muted-foreground mt-1">Gérez le contenu pédagogique de vos classes</p>
        </div>
        <Button onClick={() => setShowUploadForm(!showUploadForm)}>
          <Upload className="h-4 w-4 mr-2" />
          Ajouter un cours
        </Button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nouveau cours</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Titre *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Titre du cours"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Classe *</Label>
                  <Select value={formData.class_id} onValueChange={(v) => setFormData({ ...formData, class_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une classe" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.code} - {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(v) => setFormData({ ...formData, description: v })}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Fichiers *</Label>
                  <Input
                    type="file"
                    multiple
                    onChange={(e) => e.target.files && setFormData({ ...formData, files: Array.from(e.target.files) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Image de couverture</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && setFormData({ ...formData, image: e.target.files[0] })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={uploading}>
                  {uploading ? 'Upload en cours...' : 'Publier le cours'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowUploadForm(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Materials List */}
      {Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Aucun cours publié</p>
            <p className="text-sm text-muted-foreground mt-1">Cliquez sur "Ajouter un cours" pour commencer.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([groupId, items]) => {
            const first = items[0];
            const isExpanded = expandedGroups.has(groupId);
            return (
              <Card key={groupId}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4 items-start flex-1">
                      {first.image_url && (
                        <img src={first.image_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                      )}
                      <div className="flex-1">
                        <CardTitle className="text-lg">{first.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">{first.classes?.title}</Badge>
                          <span className="text-xs">{items.length} fichier{items.length > 1 ? 's' : ''}</span>
                        </CardDescription>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => toggleGroup(groupId)}>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="pt-0 space-y-3">
                    {first.description && (
                      <div className="text-sm text-muted-foreground border-t border-border/50 pt-3">
                        <RichTextRenderer content={first.description} />
                      </div>
                    )}
                    <div className="space-y-2">
                      {items.map(mat => (
                        <div key={mat.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{mat.file_name}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => downloadFile(mat.file_url, mat.file_name)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => {
                                setMaterialToDelete({ id: mat.id, filePath: mat.file_url });
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce fichier ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
