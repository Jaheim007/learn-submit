import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Eye, Calendar, Upload, X, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { RichTextEditor, RichTextRenderer } from '@/components/ui/rich-text-editor';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRefreshInterval } from '@/hooks/useRefreshInterval';
import { RefreshHeader } from '@/components/admin/RefreshHeader';
import ImageCropper from '@/components/ImageCropper';

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
  const [projectImage, setProjectImage] = useState<File | null>(null);
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

        // Transform the data to extract classes from nested class_projects
        const transformedProjects = projectsResponse.data.map((item: any) => {
          const classesArray = Array.isArray(item.class_projects)
            ? item.class_projects
                .map((cp: any) => cp.classes)
                .filter(Boolean)
            : item.class_projects?.classes
              ? [item.class_projects.classes]
              : [];

          return {
            id: item.id,
            title: item.title,
            description: item.description,
            deadline_at: item.deadline_at,
            allow_resubmit: item.allow_resubmit,
            max_resubmits: item.max_resubmits,
            is_active: item.is_active,
            created_at: item.created_at,
            image_url: item.image_url,
            classes: classesArray,
            submissions_count: submissionCounts[item.id] || 0
          };
        });

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
    setProjectImage(null);
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

      // Upload image if selected using edge function
      if (projectImage) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', projectImage);

        const { data: uploadData, error: uploadError } = await supabase.functions.invoke(
          'upload-project-image',
          {
            body: formDataUpload
          }
        );

        if (uploadError || !uploadData?.success) {
          console.error('Upload error:', uploadError || uploadData);
          throw new Error(uploadData?.error || 'Erreur lors de l\'upload de l\'image');
        }

        imageUrl = uploadData.url;
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

  const projectFormContent = (
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
        <Label>Description</Label>
        <RichTextEditor
          value={formData.description}
          onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
          placeholder="Description du projet (optionnel)"
          minHeight="120px"
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

      <ImageCropper
        label="Image du projet (optionnel)"
        currentImageUrl={formData.image_url}
        onImageReady={setProjectImage}
        aspectRatio={16 / 9}
      />

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

      {/* Projects List */}
      <div className="space-y-4">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Eye className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-1">Aucun projet trouvé</p>
              <p className="text-sm text-muted-foreground">Créez votre premier projet pour commencer</p>
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => (
            <Card key={project.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex gap-0">
                  {/* Project image or color bar */}
                  {project.image_url ? (
                    <div className="w-40 min-h-full hidden lg:block flex-shrink-0">
                      <img src={project.image_url} alt={project.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-1.5 min-h-full flex-shrink-0 bg-primary rounded-l-xl" />
                  )}

                  <div className="flex-1 p-5 space-y-3">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-base truncate">{project.title}</h3>
                          <Badge variant={project.is_active ? "default" : "secondary"} className="flex-shrink-0">
                            {project.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                        {project.description && (
                          <div className="line-clamp-2">
                            <RichTextRenderer content={project.description} className="text-muted-foreground [&_p]:!mb-0" />
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(project)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${project.is_active ? "text-destructive hover:text-destructive" : "text-green-600 hover:text-green-700"}`}
                          onClick={() => toggleProjectStatus(project.id, project.is_active)}
                        >
                          {project.is_active ? <Trash2 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDistanceToNow(new Date(project.deadline_at), { addSuffix: true, locale: fr })}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        <span>{project.submissions_count} soumission{project.submissions_count !== 1 ? 's' : ''}</span>
                      </div>
                      {project.allow_resubmit && (
                        <Badge variant="outline" className="text-xs font-normal">
                          Max {project.max_resubmits || 3} resoumissions
                        </Badge>
                      )}
                    </div>

                    {/* Classes */}
                    {project.classes.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Classes :</span>
                        <div className="flex flex-wrap gap-1.5">
                          {project.classes.slice(0, 6).map((classe) => (
                            <Badge key={classe.id} variant="secondary" className="text-xs px-2 py-0.5 rounded-full">
                              {classe.code}
                            </Badge>
                          ))}
                          {project.classes.length > 6 && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-full">
                              +{project.classes.length - 6} autres
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Créer un projet</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-2">
            {projectFormContent}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Modifier le projet</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-2">
            {projectFormContent}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
