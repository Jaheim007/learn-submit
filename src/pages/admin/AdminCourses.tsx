import { useState, useEffect } from 'react';
import { sanitizeStorageKey } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, FileText, Trash2, Download, Edit, BookOpen, Calendar, Layers, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RichTextEditor, RichTextRenderer } from '@/components/ui/rich-text-editor';
import ImageCropper from '@/components/ImageCropper';

interface CourseMaterial {
  id: string;
  title: string;
  description: string;
  file_name: string;
  file_type: string;
  file_url: string;
  image_url: string | null;
  class_id: number;
  created_at: string;
  classes: {
    title: string;
  };
}

interface Class {
  id: number;
  code: string;
  title: string;
}

export default function AdminCourses() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<{ id: string; filePath: string } | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<CourseMaterial | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    class_id: '',
    files: [] as File[],
    image: null as File | null
  });

  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    image: null as File | null
  });

  useEffect(() => {
    fetchClasses();
    fetchMaterials();
  }, []);

  const fetchClasses = async () => {
    const { data } = await supabase
      .from('classes')
      .select('id, code, title')
      .eq('is_active', true)
      .order('code');
    if (data) setClasses(data);
  };

  const fetchMaterials = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('course_materials')
      .select(`*, classes (title)`)
      .order('created_at', { ascending: false });
    if (data) setMaterials(data as any);
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData({ ...formData, files: Array.from(e.target.files) });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, image: e.target.files[0] });
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

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
            uploaded_by: user.id,
            course_group_id: courseGroupId,
            image_url: imageUrl
          });
        if (dbError) throw new Error(`Erreur DB ${file.name}: ${dbError.message}`);
        successCount++;
      }

      toast.success(`Cours "${formData.title}" uploadé avec ${successCount} fichier${successCount > 1 ? 's' : ''}`);
      setFormData({ title: '', description: '', class_id: '', files: [], image: null });
      setShowUploadForm(false);
      fetchMaterials();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (id: string, filePath: string) => {
    setMaterialToDelete({ id, filePath });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!materialToDelete) return;
    try {
      await supabase.storage.from('course-materials').remove([materialToDelete.filePath]);
      await supabase.from('course_materials').delete().eq('id', materialToDelete.id);
      toast.success('Cours supprimé avec succès');
      fetchMaterials();
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setDeleteDialogOpen(false);
      setMaterialToDelete(null);
    }
  };

  const handleEditClick = (material: CourseMaterial) => {
    setEditingMaterial(material);
    setEditFormData({
      title: material.title,
      description: material.description || '',
      image: null
    });
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingMaterial) return;
    try {
      let imageUrl = editingMaterial.image_url;
      if (editFormData.image) {
        const imageExt = editFormData.image.name.split('.').pop();
        const imagePath = `course-images/${Date.now()}.${imageExt}`;
        const { error: imageError } = await supabase.storage
          .from('course-materials')
          .upload(imagePath, editFormData.image, { cacheControl: '3600', upsert: false });
        if (imageError) throw new Error(`Erreur image: ${imageError.message}`);
        const { data: { publicUrl } } = supabase.storage.from('course-materials').getPublicUrl(imagePath);
        imageUrl = publicUrl;
        if (editingMaterial.image_url) {
          const oldImagePath = editingMaterial.image_url.split('/').slice(-2).join('/');
          await supabase.storage.from('course-materials').remove([oldImagePath]);
        }
      }

      const { error } = await supabase
        .from('course_materials')
        .update({
          title: editFormData.title,
          description: editFormData.description,
          image_url: imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingMaterial.id);

      if (error) throw error;
      toast.success('Cours mis à jour avec succès');
      setEditDialogOpen(false);
      setEditingMaterial(null);
      fetchMaterials();
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    }
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

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('html')) return '🌐';
    if (fileType.includes('css')) return '🎨';
    if (fileType.includes('javascript')) return '⚡';
    if (fileType.includes('image')) return '🖼️';
    return '📎';
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des Cours</h1>
          <p className="text-muted-foreground mt-1">
            {materials.length} cours disponible{materials.length > 1 ? 's' : ''} pour vos groupes
          </p>
        </div>
        <Button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="gap-2"
        >
          {showUploadForm ? <ChevronUp className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
          {showUploadForm ? 'Masquer le formulaire' : 'Nouveau cours'}
        </Button>
      </div>

      {/* Upload form — collapsible */}
      {showUploadForm && (
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Uploader un nouveau cours
            </CardTitle>
            <CardDescription>Ajoutez des fichiers de cours pour vos étudiants</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre du cours *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Introduction à Python"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class">Groupe *</Label>
                  <Select value={formData.class_id} onValueChange={(value) => setFormData({ ...formData, class_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un groupe" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id.toString()}>
                          {cls.code} - {cls.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ImageCropper
                label="Image de couverture"
                onImageReady={(file) => setFormData({ ...formData, image: file })}
              />

              <div className="space-y-2">
                <Label>Description</Label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(val) => setFormData({ ...formData, description: val })}
                  placeholder="Décrivez le contenu du cours, les objectifs d'apprentissage..."
                  minHeight="140px"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Fichiers *</Label>
                <Input id="file" type="file" onChange={handleFileChange} multiple required />
                {formData.files.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.files.map((file, index) => (
                      <Badge key={index} variant="secondary" className="gap-1.5 py-1">
                        <FileText className="h-3 w-3" />
                        {file.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" disabled={uploading} className="gap-2">
                <Upload className="h-4 w-4" />
                {uploading ? 'Upload en cours...' : 'Uploader le cours'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Course list — card-based */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Cours disponibles</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : materials.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground font-medium">Aucun cours disponible</p>
              <p className="text-sm text-muted-foreground mt-1">Commencez par uploader votre premier cours</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {materials.map((material) => (
              <Card key={material.id} className="group overflow-hidden hover:shadow-md transition-all duration-200">
                <div className="flex">
                  {/* Image or accent bar */}
                  {material.image_url ? (
                    <div className="w-32 flex-shrink-0 bg-muted">
                      <img 
                        src={material.image_url} 
                        alt={material.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-2 flex-shrink-0 bg-primary rounded-l-lg" />
                  )}

                  <div className="flex-1 p-5 min-w-0">
                    {/* Title & group */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground leading-snug line-clamp-2 text-[15px]">
                          {material.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="secondary" className="text-xs px-2 py-0.5 rounded-full">
                            <Layers className="h-3 w-3 mr-1" />
                            {material.classes.title}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Description preview */}
                    {material.description && (
                      <div className="mb-3 text-sm text-muted-foreground line-clamp-2">
                        <RichTextRenderer content={material.description} className="[&_*]:!text-muted-foreground [&_*]:!text-sm !line-clamp-2" />
                      </div>
                    )}

                    {/* Meta row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          {material.file_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(material.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(material.file_url, material.file_name)} title="Télécharger">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(material)} title="Modifier">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteClick(material.id, material.file_url)} title="Supprimer">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Supprimer ce cours ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le cours et tous ses fichiers seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Course Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Modifier le cours</DialogTitle>
            <DialogDescription>Modifiez les informations du cours</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Titre du cours</Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                placeholder="Titre du cours"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-image">Nouvelle image (optionnel)</Label>
              <Input
                id="edit-image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setEditFormData({ ...editFormData, image: e.target.files[0] });
                  }
                }}
                className="cursor-pointer"
              />
              {editFormData.image && (
                <p className="text-sm text-muted-foreground">{editFormData.image.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <RichTextEditor
                value={editFormData.description}
                onChange={(val) => setEditFormData({ ...editFormData, description: val })}
                placeholder="Description du cours"
                minHeight="120px"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleEditSave}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
