import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, UserX, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Supervisor {
  user_id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  classes: { id: number; code: string; title: string }[];
}

interface Class {
  id: number;
  code: string;
  title: string;
}

interface SupervisorFormData {
  email: string;
  full_name: string;
  class_ids: number[];
}

export default function AdminUsers() {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState<Supervisor | null>(null);
  const [formData, setFormData] = useState<SupervisorFormData>({
    email: '',
    full_name: '',
    class_ids: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [supervisorsResponse, classesResponse] = await Promise.all([
        supabase
          .from('supervisors')
          .select(`
            user_id,
            full_name,
            email,
            is_active,
            created_at,
            supervisor_class_assignments!inner(
              classes!inner(id, code, title)
            )
          `)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('classes')
          .select('id, code, title')
          .eq('is_active', true)
          .order('code')
      ]);

      if (classesResponse.data) {
        setClasses(classesResponse.data);
      }

      if (supervisorsResponse.data) {
        // Format supervisors data
        const formattedSupervisors = supervisorsResponse.data.map((supervisor: any) => ({
          user_id: supervisor.user_id,
          full_name: supervisor.full_name,
          email: supervisor.email,
          is_active: supervisor.is_active,
          created_at: supervisor.created_at,
          classes: supervisor.supervisor_class_assignments.map((sca: any) => sca.classes),
        }));

        setSupervisors(formattedSupervisors);
      }
    } catch (error) {
      console.error('Error loading supervisors:', error);
      toast.error('Erreur lors du chargement des formateurs');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      full_name: '',
      class_ids: [],
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (supervisor: Supervisor) => {
    setEditingSupervisor(supervisor);
    setFormData({
      email: supervisor.email,
      full_name: supervisor.full_name,
      class_ids: supervisor.classes.map(c => c.id),
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.email.trim() || !formData.full_name.trim()) {
        toast.error('L\'email et le nom complet sont requis');
        return;
      }

      if (formData.class_ids.length === 0) {
        toast.error('Au moins une classe doit être assignée');
        return;
      }

      if (editingSupervisor) {
        // Update existing supervisor
        const { error } = await supabase.functions.invoke('update-supervisor', {
          body: {
            supervisor_user_id: editingSupervisor.user_id,
            full_name: formData.full_name.trim(),
            class_ids: formData.class_ids,
          }
        });

        if (error) throw error;

        toast.success('Formateur mis à jour avec succès');
      } else {
        // Create new supervisor
        const { error } = await supabase.functions.invoke('create-supervisor', {
          body: {
            email: formData.email.trim(),
            full_name: formData.full_name.trim(),
            class_ids: formData.class_ids,
          }
        });

        if (error) throw error;

        toast.success('Formateur créé avec succès');
      }

      setIsCreateDialogOpen(false);
      setIsEditDialogOpen(false);
      setEditingSupervisor(null);
      loadData();

    } catch (error) {
      console.error('Error saving supervisor:', error);
      toast.error('Erreur lors de l\'enregistrement du superviseur');
    }
  };

  const toggleSupervisorStatus = async (supervisorUserId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.functions.invoke('update-supervisor', {
        body: {
          supervisor_user_id: supervisorUserId,
          is_active: !currentStatus
        }
      });

      if (error) throw error;

      setSupervisors(prev => 
        prev.map(supervisor => 
          supervisor.user_id === supervisorUserId 
            ? { ...supervisor, is_active: !currentStatus }
            : supervisor
        )
      );

      toast.success(
        !currentStatus 
          ? 'Formateur réactivé avec succès' 
          : 'Formateur désactivé avec succès'
      );
    } catch (error) {
      console.error('Error updating supervisor status:', error);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des formateurs</h1>
          <p className="text-muted-foreground">
            {supervisors.length} formateur{supervisors.length > 1 ? 's' : ''}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un formateur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Créer un nouveau formateur</DialogTitle>
            </DialogHeader>
            <SupervisorForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Supervisors Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Classes assignées</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supervisors.map((supervisor) => (
                <TableRow key={supervisor.user_id}>
                  <TableCell className="font-medium">{supervisor.full_name}</TableCell>
                  <TableCell>{supervisor.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {supervisor.classes.map((classe) => (
                        <Badge key={classe.id} variant="secondary" className="text-xs">
                          {classe.code}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={supervisor.is_active ? "default" : "secondary"}>
                      {supervisor.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openEditDialog(supervisor)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className={supervisor.is_active ? "text-red-600" : "text-green-600"}
                          >
                            {supervisor.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {supervisor.is_active ? 'Désactiver' : 'Réactiver'} le superviseur
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {supervisor.is_active 
                                ? 'Désactiver le superviseur ? Il ne pourra plus accéder aux données des étudiants.'
                                : 'Réactiver le superviseur ? Il pourra à nouveau accéder aux données des étudiants assignés.'
                              }
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => toggleSupervisorStatus(supervisor.user_id, supervisor.is_active)}
                            >
                              {supervisor.is_active ? 'Désactiver' : 'Réactiver'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {supervisors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucun superviseur trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Modifier le formateur</DialogTitle>
          </DialogHeader>
          <SupervisorForm />
        </DialogContent>
      </Dialog>
    </div>
  );

  function SupervisorForm() {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="email@exemple.com"
            disabled={!!editingSupervisor} // Can't change email for existing supervisor
          />
        </div>

        <div>
          <Label htmlFor="full_name">Nom complet *</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
            placeholder="Nom et prénom"
          />
        </div>

        <div>
          <Label>Classes assignées *</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {classes.map((classe) => (
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

        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            variant="outline" 
            onClick={() => {
              setIsCreateDialogOpen(false);
              setIsEditDialogOpen(false);
              setEditingSupervisor(null);
            }}
          >
            Annuler
          </Button>
          <Button onClick={handleSubmit}>
            {editingSupervisor ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </div>
    );
  }
}