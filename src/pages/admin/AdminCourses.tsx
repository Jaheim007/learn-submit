import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, FileText, Trash2, Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface CourseMaterial {
  id: string;
  title: string;
  description: string;
  file_name: string;
  file_type: string;
  file_url: string;
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
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    class_id: '',
    files: [] as File[]
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
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      const invalidFiles = filesArray.filter(file => !allowedTypes.includes(file.type));
      if (invalidFiles.length > 0) {
        toast.error('Seuls les fichiers PDF et Word sont autorisés');
        return;
      }
      
      setFormData({ ...formData, files: filesArray });
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

      // Generate a single course_group_id for all files in this upload
      const courseGroupId = crypto.randomUUID();
      let successCount = 0;
      
      for (const file of formData.files) {
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = `${formData.class_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('course-materials')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

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
            course_group_id: courseGroupId
          });

        if (dbError) throw dbError;
        successCount++;
      }

      toast.success(`Cours "${formData.title}" uploadé avec ${successCount} fichier${successCount > 1 ? 's' : ''}`);
      setFormData({ title: '', description: '', class_id: '', files: [] });
      fetchMaterials();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, filePath: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) return;

    try {
      await supabase.storage.from('course-materials').remove([filePath]);
      await supabase.from('course_materials').delete().eq('id', id);
      
      toast.success('Cours supprimé');
      fetchMaterials();
    } catch (error: any) {
      toast.error(error.message);
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
          <CardDescription>Ajoutez des PDF ou documents Word pour vos étudiants</CardDescription>
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
              <Label htmlFor="file">Fichiers (PDF ou Word) *</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.doc,.docx"
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
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(material.id, material.file_url)}
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
    </div>
  );
}
