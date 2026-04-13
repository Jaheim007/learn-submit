import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit2, Loader2, Users, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Class {
  id: number;
  code: string;
  title: string;
  description: string | null;
  session_name: string | null;
  is_active: boolean;
  created_at: string;
  student_count?: number;
}

export default function AdminClasses() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classToDelete, setClassToDelete] = useState<Class | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    session_name: '',
    is_active: true,
  });

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .order('created_at', { ascending: false });

      if (classesError) throw classesError;

      // Use edge function to bypass RLS for enrollment counts
      let studentCounts: Record<number, number> = {};
      const { data: overviewData } = await supabase.functions.invoke('admin-students-overview');
      if (overviewData?.students) {
        for (const s of overviewData.students) {
          if (s.class_ids) {
            for (const cid of s.class_ids) {
              studentCounts[cid] = (studentCounts[cid] || 0) + 1;
            }
          }
        }
      }

      const formattedClasses = (classesData || []).map(c => ({
        ...c,
        student_count: studentCounts[c.id] || 0
      }));

      setClasses(formattedClasses);
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error('Erreur lors du chargement des classes');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      title: '',
      description: '',
      session_name: '',
      is_active: true,
    });
  };

  const handleCreateClass = async () => {
    if (!formData.code.trim() || !formData.title.trim()) {
      toast.error('Le code et le titre sont requis');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('classes')
        .insert({
          code: formData.code.trim().toUpperCase(),
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          session_name: formData.session_name.trim() || null,
          is_active: formData.is_active,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Classe "${data.title}" créée avec succès`);
      setIsCreateOpen(false);
      resetForm();
      loadClasses();
    } catch (error: any) {
      console.error('Error creating class:', error);
      if (error.code === '23505') {
        toast.error('Une classe avec ce code existe déjà');
      } else {
        toast.error('Erreur lors de la création de la classe');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClass = async () => {
    if (!selectedClass) return;
    if (!formData.code.trim() || !formData.title.trim()) {
      toast.error('Le code et le titre sont requis');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('classes')
        .update({
          code: formData.code.trim().toUpperCase(),
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          session_name: formData.session_name.trim() || null,
          is_active: formData.is_active,
        })
        .eq('id', selectedClass.id);

      if (error) throw error;

      toast.success('Classe mise à jour avec succès');
      setIsEditOpen(false);
      setSelectedClass(null);
      resetForm();
      loadClasses();
    } catch (error: any) {
      console.error('Error updating class:', error);
      if (error.code === '23505') {
        toast.error('Une classe avec ce code existe déjà');
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!classToDelete) return;

    setIsDeleting(true);
    try {
      // Delete enrollments first (foreign key constraint)
      await supabase
        .from('enrollments')
        .delete()
        .eq('class_id', classToDelete.id);

      // Delete class_projects
      await supabase
        .from('class_projects')
        .delete()
        .eq('class_id', classToDelete.id);

      // Delete class_enrollments
      await supabase
        .from('class_enrollments')
        .delete()
        .eq('class_id', classToDelete.id);

      // Delete the class
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classToDelete.id);

      if (error) throw error;

      toast.success(`Classe "${classToDelete.title}" supprimée`);
      setClassToDelete(null);
      loadClasses();
    } catch (error: any) {
      console.error('Error deleting class:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditDialog = (classItem: Class) => {
    setSelectedClass(classItem);
    setFormData({
      code: classItem.code,
      title: classItem.title,
      description: classItem.description || '',
      session_name: classItem.session_name || '',
      is_active: classItem.is_active,
    });
    setIsEditOpen(true);
  };

  const toggleActiveStatus = async (classItem: Class) => {
    try {
      const { error } = await supabase
        .from('classes')
        .update({ is_active: !classItem.is_active })
        .eq('id', classItem.id);

      if (error) throw error;

      setClasses(prev =>
        prev.map(c =>
          c.id === classItem.id
            ? { ...c, is_active: !c.is_active }
            : c
        )
      );

      toast.success(
        !classItem.is_active
          ? 'Classe activée'
          : 'Classe désactivée'
      );
    } catch (error) {
      console.error('Error toggling active status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
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

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Gestion des classes</h1>
          <p className="text-sm text-muted-foreground">
            {classes.length} classe{classes.length > 1 ? 's' : ''} au total
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle classe
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle classe</DialogTitle>
              <DialogDescription>
                Remplissez les informations pour créer une nouvelle classe
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-code">Code *</Label>
                  <Input
                    id="create-code"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="VCP"
                    className="uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-session_name">Nom de session</Label>
                  <Input
                    id="create-session_name"
                    value={formData.session_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, session_name: e.target.value }))}
                    placeholder="VibeCoder PRO"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-title">Titre *</Label>
                <Input
                  id="create-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="VibeCoder PRO"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-description">Description</Label>
                <Textarea
                  id="create-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description de la classe..."
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="create-is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="create-is_active">Classe active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateClass} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Desktop Table */}
      <Card className="hidden lg:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Étudiants</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Créée</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((classItem) => (
                <TableRow key={classItem.id}>
                  <TableCell className="font-mono font-medium">{classItem.code}</TableCell>
                  <TableCell>{classItem.title}</TableCell>
                  <TableCell>{classItem.session_name || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {classItem.student_count}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch checked={classItem.is_active} onCheckedChange={() => toggleActiveStatus(classItem)} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(classItem.created_at), { addSuffix: true, locale: fr })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(classItem)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setClassToDelete(classItem)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {classes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucune classe trouvée
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {classes.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Aucune classe trouvée</CardContent></Card>
        ) : (
          classes.map((classItem) => (
            <Card key={classItem.id} className="touch-manipulation active:scale-[0.99] transition-transform">
              <CardContent className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-primary">{classItem.code}</span>
                      <span className={`h-2 w-2 rounded-full ${classItem.is_active ? 'bg-[hsl(var(--success))]' : 'bg-muted-foreground/30'}`} />
                    </div>
                    <p className="text-sm font-medium text-foreground mt-0.5">{classItem.title}</p>
                    {classItem.session_name && (
                      <p className="text-xs text-muted-foreground">{classItem.session_name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(classItem)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setClassToDelete(classItem)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{classItem.student_count} étudiants</span>
                  </div>
                  <span>{formatDistanceToNow(new Date(classItem.created_at), { addSuffix: true, locale: fr })}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => {
        setIsEditOpen(open);
        if (!open) {
          setSelectedClass(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier la classe</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la classe
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-code">Code *</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="VCP"
                  className="uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-session_name">Nom de session</Label>
                <Input
                  id="edit-session_name"
                  value={formData.session_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, session_name: e.target.value }))}
                  placeholder="VibeCoder PRO"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-title">Titre *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="VibeCoder PRO"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description de la classe..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="edit-is_active">Classe active</Label>
            </div>
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="destructive"
              onClick={() => {
                setIsEditOpen(false);
                if (selectedClass) setClassToDelete(selectedClass);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleEditClass} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enregistrer
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!classToDelete} onOpenChange={(open) => !open && setClassToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la classe ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La classe « {classToDelete?.title} » sera supprimée avec toutes ses inscriptions et affectations de projets.
              {(classToDelete?.student_count ?? 0) > 0 && (
                <span className="block mt-2 font-semibold text-destructive">
                  ⚠️ {classToDelete?.student_count} étudiant{(classToDelete?.student_count ?? 0) > 1 ? 's' : ''} sont inscrits dans cette classe.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClass}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
