import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, FileText, Trash2, Download, Edit } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
      .select(`
        *,
        classes (title)
      `)
      .order('created_at', { ascending: false });
    
    if (data) setMaterials(data as any);
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setFormData({ ...formData, files: filesArray });
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

      // Upload image first if provided
      let imageUrl = null;
      if (formData.image) {
        const imageExt = formData.image.name.split('.').pop();
        const imagePath = `course-images/${Date.now()}.${imageExt}`;
        
        const { error: imageError } = await supabase.storage
          .from('course-materials')
          .upload(imagePath, formData.image, {
            cacheControl: '3600',
            upsert: false
          });

        if (imageError) {
          console.error('Image upload error:', imageError);
          throw new Error(`Erreur lors de l'upload de l'image: ${imageError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('course-materials')
          .getPublicUrl(imagePath);
        
        imageUrl = publicUrl;
      }

      // Generate a single course_group_id for all files in this upload
      const courseGroupId = crypto.randomUUID();
      let successCount = 0;
      
      for (const file of formData.files) {
        // Use unique filename with timestamp to avoid conflicts
        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop();
        const uniqueFileName = `${file.name.replace(/\.[^/.]+$/, '')}_${timestamp}.${fileExt}`;
        const filePath = `${formData.class_id}/${uniqueFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('course-materials')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Erreur lors de l'upload de ${file.name}: ${uploadError.message}`);
        }

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

        if (dbError) {
          console.error('Database error:', dbError);
          throw new Error(`Erreur lors de l'enregistrement de ${file.name}: ${dbError.message}`);
        }
        successCount++;
      }

      toast.success(`Cours "${formData.title}" uploadé avec ${successCount} fichier${successCount > 1 ? 's' : ''}`);
      setFormData({ title: '', description: '', class_id: '', files: [], image: null });
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

      // Upload new image if provided
      if (editFormData.image) {
        const imageExt = editFormData.image.name.split('.').pop();
        const imagePath = `course-images/${Date.now()}.${imageExt}`;
        
        const { error: imageError } = await supabase.storage
          .from('course-materials')
          .upload(imagePath, editFormData.image, {
            cacheControl: '3600',
            upsert: false
          });

        if (imageError) throw new Error(`Erreur lors de l'upload de l'image: ${imageError.message}`);

        const { data: { publicUrl } } = supabase.storage
          .from('course-materials')
          .getPublicUrl(imagePath);
        
        imageUrl = publicUrl;

        // Delete old image if it exists
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
      const { data, error } = await supabase.storage
        .from('course-materials')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Gestion des Cours</h1>
        <p className="text-muted-foreground">Uploadez des cours pour vos groupes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uploader un nouveau cours</CardTitle>
          <CardDescription>Ajoutez tous types de fichiers pour vos étudiants</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="image">Image du cours</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="cursor-pointer"
              />
              {formData.image && (
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.image.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du cours..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Fichiers *</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                multiple
                required
              />
              {formData.files.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">{formData.files.length} fichier{formData.files.length > 1 ? 's' : ''} sélectionné{formData.files.length > 1 ? 's' : ''} :</p>
                  <ul className="list-disc list-inside space-y-1">
                    {formData.files.map((file, index) => (
                      <li key={index}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <Button type="submit" disabled={uploading} className="w-full md:w-auto">
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? 'Upload en cours...' : 'Uploader le cours'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cours disponibles</CardTitle>
          <CardDescription>Gérez tous les cours uploadés</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground">Chargement...</p>
          ) : materials.length === 0 ? (
            <p className="text-center text-muted-foreground">Aucun cours disponible</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Groupe</TableHead>
                  <TableHead>Fichier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">{material.title}</TableCell>
                    <TableCell>{material.classes.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">{material.file_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(material.created_at).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(material.file_url, material.file_name)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(material)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(material.id, material.file_url)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-destructive/10 border-destructive/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Supprimer ce cours ?</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/80">
              Cette action est irréversible. Le cours et tous ses fichiers seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-background hover:bg-muted">Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Course Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Modifier le cours</DialogTitle>
            <DialogDescription>
              Modifiez les informations du cours ci-dessous
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
                <p className="text-sm text-muted-foreground">
                  {editFormData.image.name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                placeholder="Description du cours"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEditSave} className="bg-primary hover:bg-primary/90">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
