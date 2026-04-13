import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RichTextEditor, RichTextRenderer } from '@/components/ui/rich-text-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import ImageCropper from '@/components/ImageCropper';
import { Plus, FolderOpen, Calendar, Users, FileText, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface ProjectInfo {
  id: number;
  code: string;
  title: string;
  description: string | null;
  deadline_at: string | null;
  is_active: boolean;
  allow_resubmit: boolean;
  max_resubmits: number;
  image_url: string | null;
  classNames: string[];
  submissionCount: number;
}

interface ClassInfo {
  id: number;
  code: string;
  title: string;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } } };

export default function TeacherProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editProject, setEditProject] = useState<ProjectInfo | null>(null);
  const [deleteProject, setDeleteProject] = useState<ProjectInfo | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', deadline_at: '', allow_resubmit: false, max_resubmits: 1, class_ids: [] as number[],
  });
  const [projectImage, setProjectImage] = useState<File | null>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const { data: assignments } = await supabase
        .from('supervisor_class_assignments')
        .select('class_id, classes(id, code, title)')
        .eq('supervisor_user_id', user?.id);

      const assignedClasses = (assignments || []).map(a => a.classes as any as ClassInfo);
      setClasses(assignedClasses);
      const classIds = assignedClasses.map(c => c.id);

      if (classIds.length === 0) { setProjects([]); setLoading(false); return; }

      const { data: classProjects } = await supabase.from('class_projects').select('class_id, project_id').in('class_id', classIds);
      if (!classProjects || classProjects.length === 0) { setProjects([]); setLoading(false); return; }

      const projectIds = [...new Set(classProjects.map(cp => cp.project_id))];
      const { data: projectData } = await supabase.from('projects').select('*').in('id', projectIds).order('created_at', { ascending: false });
      const { data: submissions } = await supabase.from('submissions').select('project_id').in('class_id', classIds);

      const classMap = new Map(assignedClasses.map(c => [c.id, c]));

      const projectList: ProjectInfo[] = (projectData || []).map(p => {
        const projectClassIds = classProjects.filter(cp => cp.project_id === p.id).map(cp => cp.class_id);
        const classNames = projectClassIds.map(cid => classMap.get(cid)?.code).filter(Boolean) as string[];
        const subCount = submissions?.filter(s => s.project_id === p.id).length || 0;
        return {
          id: p.id, code: p.code, title: p.title, description: p.description,
          deadline_at: p.deadline_at, is_active: p.is_active, allow_resubmit: p.allow_resubmit || false,
          max_resubmits: p.max_resubmits || 1, image_url: p.image_url, classNames, submissionCount: subCount,
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
    if (!form.title.trim()) { toast.error('Le titre est requis'); return; }
    if (form.class_ids.length === 0) { toast.error('Sélectionnez au moins une classe'); return; }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-project', {
        body: { title: form.title.trim(), description: form.description.trim() || null, deadline_at: form.deadline_at || null, allow_resubmit: form.allow_resubmit, max_resubmits: form.max_resubmits, class_ids: form.class_ids },
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

  const handleEdit = async () => {
    if (!editProject) return;
    try {
      const { error } = await supabase.from('projects').update({
        title: form.title.trim(),
        description: form.description.trim() || null,
        deadline_at: form.deadline_at || null,
        allow_resubmit: form.allow_resubmit,
        max_resubmits: form.max_resubmits,
      }).eq('id', editProject.id);
      if (error) throw error;
      toast.success('Projet mis à jour');
      setEditProject(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Erreur');
    }
  };

  const handleDelete = async () => {
    if (!deleteProject) return;
    try {
      await supabase.from('class_projects').delete().eq('project_id', deleteProject.id);
      const { error } = await supabase.from('projects').delete().eq('id', deleteProject.id);
      if (error) throw error;
      toast.success('Projet supprimé');
      setDeleteProject(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Erreur');
    }
  };

  const openEdit = (p: ProjectInfo) => {
    setForm({ title: p.title, description: p.description || '', deadline_at: p.deadline_at || '', allow_resubmit: p.allow_resubmit, max_resubmits: p.max_resubmits, class_ids: [] });
    setEditProject(p);
  };

  const toggleClassSelection = (classId: number) => {
    setForm(prev => ({ ...prev, class_ids: prev.class_ids.includes(classId) ? prev.class_ids.filter(id => id !== classId) : [...prev.class_ids, classId] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1400px] mx-auto">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground font-heading">Projets</h1>
          <p className="text-sm text-muted-foreground mt-1">{projects.length} projet{projects.length !== 1 ? 's' : ''} dans vos classes</p>
        </div>
        <Button onClick={() => { setForm({ title: '', description: '', deadline_at: '', allow_resubmit: false, max_resubmits: 1, class_ids: [] }); setShowCreate(true); }} className="rounded-xl h-10 touch-manipulation active:scale-95">
          <Plus className="h-4 w-4 mr-2" /> Nouveau
        </Button>
      </motion.div>

      {projects.length === 0 ? (
        <motion.div variants={item} className="rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm p-10 text-center">
          <FolderOpen className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Aucun projet pour vos classes</p>
        </motion.div>
      ) : (
        <motion.div variants={item} className="grid gap-4 md:grid-cols-2">
          {projects.map(project => (
            <motion.div
              key={project.id}
              whileTap={{ scale: 0.98 }}
              className="rounded-2xl border border-border/30 bg-card/60 backdrop-blur-sm overflow-hidden hover:bg-card/80 transition-all touch-manipulation group"
            >
              {/* Project Image */}
              {project.image_url ? (
                <div className="h-36 bg-muted/30 overflow-hidden">
                  <img src={project.image_url} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              ) : (
                <div className="h-20 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-primary/30" />
                </div>
              )}

              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-sm font-heading truncate">{project.title}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Code: {project.code}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <Badge variant={project.is_active ? 'default' : 'secondary'} className="text-[10px] rounded-full px-2">
                      {project.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                </div>

                {project.description && (
                  <div className="line-clamp-2 text-xs">
                    <RichTextRenderer content={project.description} className="text-muted-foreground [&_p]:!mb-0" />
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {project.classNames.map(cn => (
                    <Badge key={cn} variant="outline" className="text-[10px] rounded-full">{cn}</Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border/20">
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    {project.deadline_at && (
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(project.deadline_at).toLocaleDateString('fr-FR')}</span>
                    )}
                    <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {project.submissionCount} soumission{project.submissionCount !== 1 ? 's' : ''}</span>
                    {project.allow_resubmit && <span className="text-primary">Resoumission ✓</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(project)} className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors touch-manipulation active:scale-90">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteProject(project)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors touch-manipulation active:scale-90">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader><DialogTitle>Nouveau Projet</DialogTitle></DialogHeader>
          <ProjectForm form={form} setForm={setForm} classes={classes} toggleClassSelection={toggleClassSelection} setProjectImage={setProjectImage} showClasses />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="rounded-xl">Annuler</Button>
            <Button onClick={handleCreate} disabled={creating} className="rounded-xl">{creating ? 'Création...' : 'Créer le projet'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editProject} onOpenChange={() => setEditProject(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader><DialogTitle>Modifier le projet</DialogTitle></DialogHeader>
          <ProjectForm form={form} setForm={setForm} classes={classes} toggleClassSelection={toggleClassSelection} setProjectImage={setProjectImage} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProject(null)} className="rounded-xl">Annuler</Button>
            <Button onClick={handleEdit} className="rounded-xl">Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProject} onOpenChange={() => setDeleteProject(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce projet ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le projet "{deleteProject?.title}" sera supprimé définitivement. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

function ProjectForm({ form, setForm, classes, toggleClassSelection, setProjectImage, showClasses }: any) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Titre *</Label>
        <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Titre du projet" className="rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <RichTextEditor value={form.description} onChange={(val: string) => setForm((prev: any) => ({ ...prev, description: val }))} placeholder="Description du projet..." minHeight="100px" />
      </div>
      <div className="space-y-2">
        <Label>Date limite</Label>
        <Input type="datetime-local" value={form.deadline_at} onChange={e => setForm({ ...form, deadline_at: e.target.value })} className="rounded-xl" />
      </div>
      {showClasses && (
        <>
          <ImageCropper label="Image du projet (optionnel)" onImageReady={setProjectImage} aspectRatio={16 / 9} />
          <div className="space-y-2">
            <Label>Classes assignées *</Label>
            <div className="flex flex-wrap gap-2">
              {classes.map((c: any) => (
                <Badge key={c.id} variant={form.class_ids.includes(c.id) ? 'default' : 'outline'} className="cursor-pointer rounded-full touch-manipulation" onClick={() => toggleClassSelection(c.id)}>
                  {c.code}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}
      <div className="flex items-center justify-between">
        <Label>Autoriser la resoumission</Label>
        <Switch checked={form.allow_resubmit} onCheckedChange={(v: boolean) => setForm({ ...form, allow_resubmit: v })} />
      </div>
      {form.allow_resubmit && (
        <div className="space-y-2">
          <Label>Nombre max de resoumissions</Label>
          <Input type="number" min={1} value={form.max_resubmits} onChange={e => setForm({ ...form, max_resubmits: parseInt(e.target.value) || 1 })} className="rounded-xl" />
        </div>
      )}
    </div>
  );
}
