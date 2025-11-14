import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Eye, Calendar, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRefreshInterval } from '@/hooks/useRefreshInterval';
import { RefreshHeader } from '@/components/admin/RefreshHeader';

interface Project {
  id: number;
  title: string;
  description?: string;
  deadline_at: string;
  allow_resubmit: boolean;
  max_resubmits?: number;
  is_active: boolean;
  created_at: string;
  image_url?: string;
  classes: { id: number; code: string; title: string }[];
  submissions_count: number;
}

interface Class {
  id: number;
  code: string;
  title: string;
  session_name?: string;
}

interface ProjectFormData {
  title: string;
  description: string;
  deadline_at: string;
  allow_resubmit: boolean;
  max_resubmits: string;
  class_ids: number[];
  image_url: string;
}

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    deadline_at: '',
    allow_resubmit: false,
    max_resubmits: '3',
    class_ids: [],
    image_url: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());

  const loadData = async () => {
    try {
      const [projectsResponse, classesResponse] = await Promise.all([
        supabase
          .from('projects')
          .select(`
            id,
            title,
            description,
            deadline_at,
            allow_resubmit,
            max_resubmits,
            is_active,
            created_at,
            image_url,
            class_projects!inner(
              classes!inner(id, code, title)
            )
          `)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('classes')
          .select('id, code, title, session_name')
          .eq('is_active', true)
          .order('session_name', { ascending: true })
          .order('code', { ascending: true })
      ]);

      if (classesResponse.data) {
        setClasses(classesResponse.data);
      }

      if (projectsResponse.data) {
        // Get submission counts for each project
        const projectIds = projectsResponse.data.map(p => p.id);
        const submissionsResponse = await supabase
          .from('submissions')
          .select('project_id')
          .in('project_id', projectIds);

        const submissionCounts = submissionsResponse.data?.reduce((acc, sub) => {
          acc[sub.project_id] = (acc[sub.project_id] || 0) + 1;
          return acc;
        }, {} as Record<number, number>) || {};

        // Transform the data to group classes
        const transformedProjects = projectsResponse.data.reduce((acc, item: any) => {
          const existingProject = acc.find(p => p.id === item.id);
          const classData = Array.isArray(item.class_projects) 
            ? item.class_projects[0]?.classes 
            : item.class_projects?.classes;
          
          if (existingProject && classData) {
            existingProject.classes.push(classData);
          } else if (classData) {
            acc.push({
              id: item.id,
              title: item.title,
              description: item.description,
              deadline_at: item.deadline_at,
              allow_resubmit: item.allow_resubmit,
              max_resubmits: item.max_resubmits,
              is_active: item.is_active,
              created_at: item.created_at,
              image_url: item.image_url,
              classes: [classData],
              submissions_count: submissionCounts[item.id] || 0
            });
          }
          
          return acc;
        }, [] as Project[]);

        setProjects(transformedProjects);
      }
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openEditDialog = async (project: Project) => {
    setEditingProject(project);
    
    // Format deadline_at for datetime-local input
    const deadlineDate = new Date(project.deadline_at);
    const formattedDeadline = new Date(deadlineDate.getTime() - (deadlineDate.getTimezoneOffset() * 60000))
      .toISOString()
      .slice(0, 16);
    
    setFormData({
      title: project.title,
      description: project.description || '',
      deadline_at: formattedDeadline,
      allow_resubmit: project.allow_resubmit,
      max_resubmits: String(project.max_resubmits || 3),
      class_ids: project.classes.map(c => c.id),
      image_url: project.image_url || '',
    });
    
    if (project.image_url) {
      setImagePreview(project.image_url);
    }
    
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      deadline_at: '',
      allow_resubmit: false,
      max_resubmits: '3',
      class_ids: [],
      image_url: '',
    });
    setSelectedImage(null);
    setImagePreview('');
    setEditingProject(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.deadline_at || formData.class_ids.length === 0) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      let imageUrl = formData.image_url;

      // Upload image if selected
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `project-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('submissions')
          .upload(filePath, selectedImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('submissions')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      if (editingProject) {
        // Update existing project
        const projectData = {
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          deadline_at: new Date(formData.deadline_at).toISOString(),
          allow_resubmit: formData.allow_resubmit,
          max_resubmits: formData.allow_resubmit ? parseInt(formData.max_resubmits) || 3 : null,
          image_url: imageUrl || null,
        };

        const { data, error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', editingProject.id)
          .select()
          .single();

        if (error) throw error;

        // Delete existing class assignments
        await supabase
          .from('class_projects')
          .delete()
          .eq('project_id', editingProject.id);

        // Create new class assignments
        const classAssignments = formData.class_ids.map(classId => ({
          project_id: editingProject.id,
          class_id: classId,
        }));

        const { error: assignmentError } = await supabase
          .from('class_projects')
          .insert(classAssignments);

        if (assignmentError) throw assignmentError;

        toast.success('Projet mis à jour avec succès');
      } else {
        // Create new project via edge function
        const payload = {
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          deadline_at: new Date(formData.deadline_at).toISOString(),
          allow_resubmit: formData.allow_resubmit,
          max_resubmits: formData.allow_resubmit ? parseInt(formData.max_resubmits) || 1 : 1,
          is_active: true,
          class_ids: formData.class_ids,
          image_url: imageUrl || null
        };

        console.log('Calling create-project with payload:', payload);

        const { data, error } = await supabase.functions.invoke('create-project', {
          body: payload
        });

        if (error) {
          console.error('Edge function error:', error);
          throw new Error(error.message || 'Erreur lors de la création du projet');
        }

        if (data?.error) {
          console.error('Server error:', data.error);
          throw new Error(data.error);
        }

        console.log('Project created successfully:', data);
        toast.success('Projet créé avec succès');
      }

      setIsCreateDialogOpen(false);
      setIsEditDialogOpen(false);
      resetForm();
      loadData();

    } catch (error) {
      console.error('Error saving project:', error);
      toast.error(error.message || 'Erreur lors de l\'enregistrement du projet');
    }
  };

  const toggleProjectStatus = async (projectId: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ is_active: !currentStatus })
        .eq('id', projectId);

      if (error) throw error;

      setProjects(prev => 
        prev.map(project => 
          project.id === projectId 
            ? { ...project, is_active: !currentStatus }
            : project
        )
      );

      toast.success(
        !currentStatus 
          ? 'Projet activé avec succès' 
          : 'Projet désactivé avec succès'
      );
    } catch (error) {
      console.error('Error updating project status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const handleClassToggle = (classId: number) => {
    setFormData(prev => ({
      ...prev,
      class_ids: prev.class_ids.includes(classId)
        ? prev.class_ids.filter(id => id !== classId)
        : [...prev.class_ids, classId]
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  // ProjectForm Component
  const ProjectForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="title">Titre du projet *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Titre du projet"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Description du projet (optionnel)"
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="deadline">Date limite *</Label>
        <Input
          id="deadline"
          type="datetime-local"
          value={formData.deadline_at}
          onChange={(e) => setFormData(prev => ({ ...prev, deadline_at: e.target.value }))}
        />
      </div>

      <div>
        <Label>Classes cibles *</Label>
        <div className="space-y-4 mt-2">
          {/* Group classes by session */}
          {Array.from(new Set(classes.map(c => c.session_name).filter(Boolean))).map(sessionName => (
            <div key={sessionName} className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">{sessionName}</h4>
              <div className="grid grid-cols-2 gap-2 pl-4">
                {classes.filter(c => c.session_name === sessionName).map((classe) => (
                  <div key={classe.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`class-${classe.id}`}
                      checked={formData.class_ids.includes(classe.id)}
                      onChange={() => handleClassToggle(classe.id)}
                      className="rounded"
                    />
                    <label htmlFor={`class-${classe.id}`} className="text-sm">
                      {classe.code} - {classe.title}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* Show classes without session */}
          {classes.filter(c => !c.session_name).length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Autres classes</h4>
              <div className="grid grid-cols-2 gap-2 pl-4">
                {classes.filter(c => !c.session_name).map((classe) => (
                  <div key={classe.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`class-${classe.id}`}
                      checked={formData.class_ids.includes(classe.id)}
                      onChange={() => handleClassToggle(classe.id)}
                      className="rounded"
                    />
                    <label htmlFor={`class-${classe.id}`} className="text-sm">
                      {classe.code} - {classe.title}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="image-upload">Image du projet (optionnel)</Label>
        <div className="space-y-4">
          {imagePreview && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview('');
                  setFormData(prev => ({ ...prev, image_url: '' }));
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('image-upload')?.click()}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {imagePreview ? 'Changer l\'image' : 'Choisir une image'}
            </Button>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Validate file size (max 5MB)
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error('L\'image ne doit pas dépasser 5 MB');
                    return;
                  }
                  setSelectedImage(file);
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setImagePreview(reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Ajouter une image pour rendre le projet plus attrayant (max 5 MB)
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="allow-resubmit"
          checked={formData.allow_resubmit}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allow_resubmit: checked }))}
        />
        <Label htmlFor="allow-resubmit">Autoriser les resoumissions</Label>
      </div>

      {formData.allow_resubmit && (
        <div>
          <Label htmlFor="max-resubmits">Nombre maximum de resoumissions</Label>
          <Input
            id="max-resubmits"
            type="number"
            min="1"
            max="10"
            value={formData.max_resubmits}
            onChange={(e) => setFormData(prev => ({ ...prev, max_resubmits: e.target.value }))}
          />
        </div>
      )}

      <div className="flex justify-end gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            resetForm();
          }}
        >
          Annuler
        </Button>
        <Button type="submit">
          {editingProject ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <RefreshHeader lastRefreshTime={lastRefreshTime} onRefresh={loadData} />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Projets</h1>
          <p className="text-muted-foreground">Gérer les projets et leurs échéances</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau projet
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Projects Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Classes</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead>Soumissions</TableHead>
                <TableHead>Resoumission</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{project.title}</div>
                      {project.description && (
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {project.classes.map((classe) => (
                        <Badge key={classe.id} variant="secondary" className="text-xs">
                          {classe.code}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {formatDistanceToNow(new Date(project.deadline_at), { 
                          addSuffix: true, 
                          locale: fr 
                        })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{project.submissions_count}</TableCell>
                  <TableCell>
                    {project.allow_resubmit ? (
                      <Badge variant="outline">
                        Max {project.max_resubmits || 3}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Non</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={project.is_active ? "default" : "secondary"}>
                      {project.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openEditDialog(project)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleProjectStatus(project.id, project.is_active)}
                        className={project.is_active ? "text-red-600" : "text-green-600"}
                      >
                        {project.is_active ? <Trash2 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {projects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucun projet trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Créer un projet</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-2">
            <ProjectForm />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Modifier le projet</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-2">
            <ProjectForm />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
