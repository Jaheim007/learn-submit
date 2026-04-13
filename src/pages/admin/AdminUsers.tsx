import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, UserCog, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface UserEntry {
  user_id: string;
  full_name: string;
  email: string;
  created_at: string;
  role: 'supervisor' | 'admin' | 'academy';
  platform?: string;
  platforms?: Record<string, string>;
  classes?: { id: number; code: string; title: string }[];
}

interface ClassItem {
  id: number;
  code: string;
  title: string;
}

export default function AdminUsers() {
  const [supervisors, setSupervisors] = useState<UserEntry[]>([]);
  const [admins, setAdmins] = useState<UserEntry[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('supervisors');

  // Supervisor form
  const [isSupervisorDialogOpen, setIsSupervisorDialogOpen] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState<UserEntry | null>(null);
  const [supervisorForm, setSupervisorForm] = useState({ email: '', full_name: '', class_ids: [] as number[] });

  // Admin form
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({ email: '', full_name: '', role: 'academy' as 'admin' | 'academy', platform: 'hacktualiz' as 'hacktualiz' | 'groupformation' | 'both' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-staff-overview');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setClasses(data.classes || []);
      setSupervisors((data.supervisors || []).map((s: any) => ({
        ...s,
        role: 'supervisor' as const,
      })));
      setAdmins((data.admins || []).map((a: any) => ({
        ...a,
        role: a.role as 'admin' | 'academy',
      })));
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  // --- Supervisor CRUD ---
  const openCreateSupervisor = () => {
    setEditingSupervisor(null);
    setSupervisorForm({ email: '', full_name: '', class_ids: [] });
    setIsSupervisorDialogOpen(true);
  };

  const openEditSupervisor = (s: UserEntry) => {
    setEditingSupervisor(s);
    setSupervisorForm({ email: s.email, full_name: s.full_name, class_ids: s.classes?.map(c => c.id) || [] });
    setIsSupervisorDialogOpen(true);
  };

  const handleSupervisorSubmit = async () => {
    if (!supervisorForm.email.trim() || !supervisorForm.full_name.trim()) {
      toast.error("L'email et le nom sont requis");
      return;
    }
    if (supervisorForm.class_ids.length === 0) {
      toast.error('Au moins une classe doit être assignée');
      return;
    }
    try {
      if (editingSupervisor) {
        const { error } = await supabase.functions.invoke('update-supervisor', {
          body: { supervisor_user_id: editingSupervisor.user_id, full_name: supervisorForm.full_name.trim(), class_ids: supervisorForm.class_ids }
        });
        if (error) throw error;
        toast.success('Formateur mis à jour');
      } else {
        const { data, error } = await supabase.functions.invoke('create-supervisor', {
          body: { email: supervisorForm.email.trim(), full_name: supervisorForm.full_name.trim(), class_ids: supervisorForm.class_ids }
        });
        if (error) throw error;
        if (data?.error) { toast.error(data.error); return; }
        toast.success('Formateur créé');
      }
      setIsSupervisorDialogOpen(false);
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleDeleteUser = async (userId: string, role: string, deleteAccount = false) => {
    try {
      const { data, error } = await supabase.functions.invoke('delete-user-role', {
        body: { target_user_id: userId, role, delete_account: deleteAccount }
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      toast.success(deleteAccount ? 'Compte supprimé définitivement' : 'Rôle supprimé avec succès');
      loadData();
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // --- Admin CRUD ---
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminForm.email.trim()) {
      toast.error("L'email est requis");
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke('assign-user-role', {
        body: { email: adminForm.email.trim(), full_name: adminForm.full_name.trim() || null, role: adminForm.role, platform: adminForm.platform }
      });
      if (error) { toast.error(error.message); return; }
      if (data?.error) { toast.error(data.error); return; }
      toast.success('Rôle assigné avec succès');
      setIsAdminDialogOpen(false);
      setAdminForm({ email: '', full_name: '', role: 'academy', platform: 'hacktualiz' });
      loadData();
    } catch (error) {
      console.error(error);
      toast.error('Erreur inattendue');
    }
  };

  const handleClassToggle = (classId: number) => {
    setSupervisorForm(prev => ({
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
          <div className="h-8 bg-muted rounded w-1/4 mb-4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Utilisateurs</h1>
        <p className="text-muted-foreground mt-1">
          Gérer les formateurs et le personnel administratif
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="supervisors" className="gap-2">
            <UserCog className="h-4 w-4" />
            Formateurs ({supervisors.length})
          </TabsTrigger>
          <TabsTrigger value="admins" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Administrateurs ({admins.length})
          </TabsTrigger>
        </TabsList>

        {/* Supervisors Tab */}
        <TabsContent value="supervisors" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateSupervisor}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un formateur
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Classes assignées</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supervisors.map((s) => (
                    <TableRow key={s.user_id}>
                      <TableCell className="font-medium">{s.full_name}</TableCell>
                      <TableCell>{s.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {s.classes?.map((c) => (
                            <Badge key={c.id} variant="secondary" className="text-xs">{c.code}</Badge>
                          ))}
                          {(!s.classes || s.classes.length === 0) && (
                            <span className="text-xs text-muted-foreground">Aucune</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditSupervisor(s)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer ce formateur ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Choisissez une action pour <strong>{s.full_name}</strong> ({s.email}).
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(s.user_id, 'supervisor', false)}
                                >
                                  Retirer le rôle
                                </AlertDialogAction>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleDeleteUser(s.user_id, 'supervisor', true)}
                                >
                                  Supprimer le compte
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
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Aucun formateur trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admins Tab */}
        <TabsContent value="admins" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setAdminForm({ email: '', full_name: '', role: 'academy', platform: 'hacktualiz' }); setIsAdminDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un administrateur
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Plateforme</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((a) => (
                    <TableRow key={a.user_id}>
                      <TableCell className="font-medium">{a.full_name}</TableCell>
                      <TableCell>{a.email}</TableCell>
                      <TableCell>
                        <Badge variant={a.role === 'admin' ? 'default' : 'secondary'}>
                          {a.role === 'admin' ? 'Admin' : 'Académique'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {a.platforms && Object.entries(a.platforms).map(([role, plat]) => (
                            <Badge key={role} variant="outline" className="text-xs">
                              {plat === 'both' ? '🌐 Toutes' : plat === 'hacktualiz' ? '🎓 Hacktualiz' : '📋 GroupFormation'}
                            </Badge>
                          ))}
                          {!a.platforms && (
                            <Badge variant="outline" className="text-xs">🌐 Toutes</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(a.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Choisissez une action pour <strong>{a.full_name}</strong> ({a.email}).
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(a.user_id, a.role, false)}
                              >
                                Retirer le rôle
                              </AlertDialogAction>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDeleteUser(a.user_id, a.role, true)}
                              >
                                Supprimer le compte
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                  {admins.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Aucun administrateur trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Supervisor Create/Edit Dialog */}
      <Dialog open={isSupervisorDialogOpen} onOpenChange={setIsSupervisorDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSupervisor ? 'Modifier le formateur' : 'Ajouter un formateur'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sup-email">Email *</Label>
              <Input
                id="sup-email"
                type="email"
                value={supervisorForm.email}
                onChange={(e) => setSupervisorForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemple.com"
                disabled={!!editingSupervisor}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Quand cette personne se connectera avec cet email, elle recevra automatiquement le rôle de formateur.
              </p>
            </div>
            <div>
              <Label htmlFor="sup-name">Nom complet *</Label>
              <Input
                id="sup-name"
                value={supervisorForm.full_name}
                onChange={(e) => setSupervisorForm(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Nom et prénom"
              />
            </div>
            <div>
              <Label>Classes assignées *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {classes.map((c) => (
                  <div key={c.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`sup-class-${c.id}`}
                      checked={supervisorForm.class_ids.includes(c.id)}
                      onChange={() => handleClassToggle(c.id)}
                      className="rounded"
                    />
                    <label htmlFor={`sup-class-${c.id}`} className="text-sm">
                      {c.code} - {c.title}
                    </label>
                  </div>
                ))}
                {classes.length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-2">Aucune classe disponible</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsSupervisorDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleSupervisorSubmit}>
                {editingSupervisor ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Create Dialog */}
      <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un administrateur</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div>
              <Label htmlFor="admin-email">Email *</Label>
              <Input
                id="admin-email"
                type="email"
                value={adminForm.email}
                onChange={(e) => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="jean@nys-africa.com"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Quand cette personne se connectera avec cet email, elle recevra automatiquement le rôle assigné.
              </p>
            </div>
            <div>
              <Label htmlFor="admin-name">Nom complet (optionnel)</Label>
              <Input
                id="admin-name"
                value={adminForm.full_name}
                onChange={(e) => setAdminForm(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Jean Dupont"
              />
            </div>
            <div>
              <Label>Rôle</Label>
              <div className="flex gap-3 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="admin-role"
                    checked={adminForm.role === 'academy'}
                    onChange={() => setAdminForm(prev => ({ ...prev, role: 'academy' }))}
                  />
                  <span className="text-sm">Académique</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="admin-role"
                    checked={adminForm.role === 'admin'}
                    onChange={() => setAdminForm(prev => ({ ...prev, role: 'admin' }))}
                  />
                  <span className="text-sm">Admin</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAdminDialogOpen(false)}>Annuler</Button>
              <Button type="submit">Assigner le rôle</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
