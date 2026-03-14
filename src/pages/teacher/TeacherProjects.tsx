import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RichTextEditor, RichTextRenderer } from '@/components/ui/rich-text-editor';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, FolderOpen, Calendar, Users, FileText, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface ProjectInfo {
  id: number;
  code: string;
  title: string;
  description: string | null;
  deadline_at: string | null;
  is_active: boolean;
  allow_resubmit: boolean;
  max_resubmits: number;
  classNames: string[];
  submissionCount: number;
}

interface ClassInfo {
  id: number;
  code: string;
  title: string;
}

export default function TeacherProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    deadline_at: '',
    allow_resubmit: false,
    max_resubmits: 1,
    class_ids: [] as number[],
  });

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      // Get assigned classes
      const { data: assignments } = await supabase
        .from('supervisor_class_assignments')
        .select('class_id, classes(id, code, title)')
        .eq('supervisor_user_id', user?.id);

      const assignedClasses = (assignments || []).map(a => a.classes as any as ClassInfo);
      setClasses(assignedClasses);
      const classIds = assignedClasses.map(c => c.id);

      if (classIds.length === 0) {
        setProjects([]);
        setLoading(false);
        return;
      }

      // Get class_projects for those classes
      const { data: classProjects } = await supabase
        .from('class_projects')
        .select('class_id, project_id')
        .in('class_id', classIds);

      if (!classProjects || classProjects.length === 0) {
        setProjects([]);
        setLoading(false);
        return;
      }

      const projectIds = [...new Set(classProjects.map(cp => cp.project_id))];

      // Get project details
      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .in('id', projectIds)
        .order('created_at', { ascending: false });

      // Get submission counts
      const { data: submissions } = await supabase
        .from('submissions')
        .select('project_id')
        .in('class_id', classIds);

      const classMap = new Map(assignedClasses.map(c => [c.id, c]));

      const projectList: ProjectInfo[] = (projectData || []).map(p => {
        const projectClassIds = classProjects
          .filter(cp => cp.project_id === p.id)
          .map(cp => cp.class_id);
        const classNames = projectClassIds
          .map(cid => classMap.get(cid)?.code)
          .filter(Boolean) as string[];
        const subCount = submissions?.filter(s => s.project_id === p.id).length || 0;

        return {
          id: p.id,
          code: p.code,
          title: p.title,
          description: p.description,
          deadline_at: p.deadline_at,
          is_active: p.is_active,
          allow_resubmit: p.allow_resubmit || false,
          max_resubmits: p.max_resubmits || 1,
          classNames,
          submissionCount: subCount,
        };
      });

      setProjects(projectList);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.title.trim()) {
      toast.error('Le titre est requis');
      return;
    }
    if (form.class_ids.length === 0) {
      toast.error('Sélectionnez au moins une classe');
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-project', {
        body: {
          title: form.title.trim(),
          description: form.description.trim() || null,
          deadline_at: form.deadline_at || null,
          allow_resubmit: form.allow_resubmit,
          max_resubmits: form.max_resubmits,
          class_ids: form.class_ids,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Projet créé avec succès');
      setShowCreate(false);
      setForm({ title: '', description: '', deadline_at: '', allow_resubmit: false, max_resubmits: 1, class_ids: [] });
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const toggleClassSelection = (classId: number) => {
    setForm(prev => ({
      ...prev,
      class_ids: prev.class_ids.includes(classId)
        ? prev.class_ids.filter(id => id !== classId)
        : [...prev.class_ids, classId],
    }));
  };

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
          <h1 className="text-3xl font-bold text-foreground">Projets</h1>
          <p className="text-muted-foreground mt-1">Gérez les projets de vos classes</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau projet
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Aucun projet pour vos classes</p>
            <p className="text-sm text-muted-foreground mt-1">Créez un projet pour commencer à recevoir des soumissions.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map(project => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <CardDescription className="text-xs mt-1">Code: {project.code}</CardDescription>
                  </div>
                  <Badge variant={project.is_active ? 'default' : 'secondary'}>
                    {project.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {project.classNames.map(cn => (
                    <Badge key={cn} variant="outline" className="text-xs">{cn}</Badge>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                  {project.deadline_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(project.deadline_at).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {project.submissionCount} soumission{project.submissionCount !== 1 ? 's' : ''}
                  </span>
                  {project.allow_resubmit && (
                    <span className="text-primary">Resoumission autorisée</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau Projet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Titre du projet"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Description du projet..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Date limite</Label>
              <Input
                type="datetime-local"
                value={form.deadline_at}
                onChange={e => setForm({ ...form, deadline_at: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Classes assignées *</Label>
              <div className="flex flex-wrap gap-2">
                {classes.map(c => (
                  <Badge
                    key={c.id}
                    variant={form.class_ids.includes(c.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleClassSelection(c.id)}
                  >
                    {c.code}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Autoriser la resoumission</Label>
              <Switch
                checked={form.allow_resubmit}
                onCheckedChange={v => setForm({ ...form, allow_resubmit: v })}
              />
            </div>
            {form.allow_resubmit && (
              <div className="space-y-2">
                <Label>Nombre max de resoumissions</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.max_resubmits}
                  onChange={e => setForm({ ...form, max_resubmits: parseInt(e.target.value) || 1 })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? 'Création...' : 'Créer le projet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
