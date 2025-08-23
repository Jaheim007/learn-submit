import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Supervisor {
  user_id: string;
  full_name: string;
  email: string;
  assignedClasses: Array<{
    id: number;
    code: string;
    title: string;
  }>;
}

interface Class {
  id: number;
  code: string;
  title: string;
}

export default function AdminUsers() {
  const { isAdmin, loading } = useAuth();
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    selectedClassIds: [] as number[]
  });

  useEffect(() => {
    if (!loading && isAdmin) {
      loadData();
    }
  }, [loading, isAdmin]);

  const loadData = async () => {
    try {
      // Load classes
      const { data: classesData } = await supabase
        .from('classes')
        .select('*')
        .eq('is_active', true)
        .order('code');

      // Load supervisors with their assigned classes
      const { data: supervisorRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'supervisor');

      if (supervisorRoles && supervisorRoles.length > 0) {
        const supervisorIds = supervisorRoles.map(r => r.user_id);
        
        const { data: students } = await supabase
          .from('students')
          .select('user_id, full_name, email')
          .in('user_id', supervisorIds);

        const { data: assignments } = await supabase
          .from('supervisor_class_assignments')
          .select(`
            supervisor_user_id,
            class_id,
            classes (id, code, title)
          `)
          .in('supervisor_user_id', supervisorIds);

        const supervisorsData: Supervisor[] = students?.map(student => ({
          user_id: student.user_id,
          full_name: student.full_name || '',
          email: student.email || '',
          assignedClasses: assignments?.filter(a => a.supervisor_user_id === student.user_id)
            .map(a => a.classes as Class) || []
        })) || [];

        setSupervisors(supervisorsData);
      }

      setClasses(classesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoadingData(false);
    }
  };

  const handleCreateSupervisor = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-supervisor', {
        body: {
          email: formData.email,
          full_name: formData.full_name,
          class_ids: formData.selectedClassIds
        }
      });

      if (error) throw error;

      toast.success('Superviseur créé avec succès');
      setCreateDialogOpen(false);
      setFormData({ email: '', full_name: '', selectedClassIds: [] });
      loadData();
    } catch (error: any) {
      console.error('Error creating supervisor:', error);
      toast.error(error.message || 'Erreur lors de la création du superviseur');
    }
  };

  const handleUpdateSupervisor = async () => {
    if (!selectedSupervisor) return;

    try {
      const { data, error } = await supabase.functions.invoke('update-supervisor', {
        body: {
          supervisor_user_id: selectedSupervisor.user_id,
          class_ids: formData.selectedClassIds
        }
      });

      if (error) throw error;

      toast.success('Classes du superviseur mises à jour');
      setEditDialogOpen(false);
      setSelectedSupervisor(null);
      setFormData({ email: '', full_name: '', selectedClassIds: [] });
      loadData();
    } catch (error: any) {
      console.error('Error updating supervisor:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour');
    }
  };

  const openEditDialog = (supervisor: Supervisor) => {
    setSelectedSupervisor(supervisor);
    setFormData({
      email: supervisor.email,
      full_name: supervisor.full_name,
      selectedClassIds: supervisor.assignedClasses.map(c => c.id)
    });
    setEditDialogOpen(true);
  };

  const handleClassToggle = (classId: number, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        selectedClassIds: [...prev.selectedClassIds, classId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        selectedClassIds: prev.selectedClassIds.filter(id => id !== classId)
      }));
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground mt-2">
            Gérer les superviseurs et leurs accès aux classes
          </p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Créer un Superviseur
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Créer un Superviseur</DialogTitle>
              <DialogDescription>
                Créer un nouveau compte superviseur avec accès aux classes sélectionnées.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="superviseur@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="full_name">Nom complet</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Nom Prénom"
                />
              </div>
              <div className="grid gap-2">
                <Label>Classes assignées</Label>
                <div className="grid grid-cols-2 gap-2">
                  {classes.map((cls) => (
                    <div key={cls.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`class-${cls.id}`}
                        checked={formData.selectedClassIds.includes(cls.id)}
                        onCheckedChange={(checked) => handleClassToggle(cls.id, checked as boolean)}
                      />
                      <Label htmlFor={`class-${cls.id}`} className="text-sm">
                        {cls.code}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateSupervisor}>
                Créer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loadingData ? (
        <div className="flex items-center justify-center h-64">
          Chargement des superviseurs...
        </div>
      ) : (
        <div className="grid gap-4">
          {supervisors.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Aucun superviseur créé</p>
              </CardContent>
            </Card>
          ) : (
            supervisors.map((supervisor) => (
              <Card key={supervisor.user_id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{supervisor.full_name}</CardTitle>
                      <CardDescription>{supervisor.email}</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditDialog(supervisor)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label className="text-sm font-medium">Classes assignées:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {supervisor.assignedClasses.length === 0 ? (
                        <Badge variant="secondary">Aucune classe assignée</Badge>
                      ) : (
                        supervisor.assignedClasses.map((cls) => (
                          <Badge key={cls.id} variant="outline">
                            {cls.code} - {cls.title}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier les Classes du Superviseur</DialogTitle>
            <DialogDescription>
              Modifier les classes assignées à {selectedSupervisor?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Classes assignées</Label>
              <div className="grid grid-cols-2 gap-2">
                {classes.map((cls) => (
                  <div key={cls.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-class-${cls.id}`}
                      checked={formData.selectedClassIds.includes(cls.id)}
                      onCheckedChange={(checked) => handleClassToggle(cls.id, checked as boolean)}
                    />
                    <Label htmlFor={`edit-class-${cls.id}`} className="text-sm">
                      {cls.code}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateSupervisor}>
              Mettre à jour
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}