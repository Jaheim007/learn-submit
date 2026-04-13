import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { UserCheck, UserX, Clock, Mail, GraduationCap, BookOpen, Building2, Search, Users, ShieldX, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface ManagedUser {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  status: 'pending' | 'active' | 'rejected';
  roles: string[];
}

interface ClassInfo {
  id: number;
  code: string;
  title: string;
}

export default function AdminPendingStudents() {
  const [allUsers, setAllUsers] = useState<ManagedUser[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  // Approval dialog state
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [selected, setSelected] = useState<ManagedUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profilesRes, rolesRes, studentsRes, classesRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, created_at').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('user_id, role'),
        supabase.from('students').select('user_id, status'),
        supabase.from('classes').select('id, code, title').eq('is_active', true).order('code'),
      ]);

      const profiles = profilesRes.data || [];
      const roles = rolesRes.data || [];
      const students = studentsRes.data || [];

      const rolesByUser = new Map<string, string[]>();
      roles.forEach(r => {
        const existing = rolesByUser.get(r.user_id) || [];
        existing.push(r.role);
        rolesByUser.set(r.user_id, existing);
      });

      const studentStatusMap = new Map<string, string>();
      students.forEach(s => studentStatusMap.set(s.user_id, s.status));

      const managed: ManagedUser[] = profiles.map(p => {
        const userRoles = rolesByUser.get(p.id) || [];
        const studentStatus = studentStatusMap.get(p.id);

        let status: 'pending' | 'active' | 'rejected';
        if (studentStatus === 'rejected') {
          status = 'rejected';
        } else if (userRoles.length === 0) {
          status = 'pending';
        } else if (studentStatus === 'pending') {
          status = 'pending';
        } else {
          status = 'active';
        }

        return {
          id: p.id,
          full_name: p.full_name || '',
          email: p.email,
          created_at: p.created_at,
          status,
          roles: userRoles,
        };
      });

      setAllUsers(managed);
      if (classesRes.data) setClasses(classesRes.data);
    } catch (error) {
      console.error('Error loading:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return allUsers
      .filter(u => u.status === activeTab)
      .filter(u => {
        if (!term) return true;
        return u.full_name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
      });
  }, [allUsers, activeTab, searchTerm]);

  const counts = useMemo(() => ({
    pending: allUsers.filter(u => u.status === 'pending').length,
    active: allUsers.filter(u => u.status === 'active').length,
    rejected: allUsers.filter(u => u.status === 'rejected').length,
  }), [allUsers]);

  const openApproval = (user: ManagedUser) => {
    setSelected(user);
    setSelectedRole('');
    setSelectedClassIds([]);
    setApprovalOpen(true);
  };

  const handleApprove = async () => {
    if (!selected || !selectedRole) {
      toast.error('Veuillez sélectionner un rôle');
      return;
    }
    if ((selectedRole === 'student' || selectedRole === 'teacher') && selectedClassIds.length === 0) {
      toast.error('Veuillez sélectionner au moins une classe');
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('approve-pending-user', {
        body: { user_id: selected.id, action: 'approve', role: selectedRole, class_ids: selectedClassIds },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const roleLabel = selectedRole === 'student' ? 'Étudiant' : selectedRole === 'teacher' ? 'Formateur' : 'Academy';
      toast.success(`${selected.full_name || selected.email} approuvé comme ${roleLabel}`);
      setApprovalOpen(false);
      setSelected(null);
      loadData();
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de l'approbation");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('approve-pending-user', {
        body: { user_id: selected.id, action: 'reject' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`${selected.full_name || selected.email} a été rejeté`);
      setRejectOpen(false);
      setSelected(null);
      loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors du rejet');
    } finally {
      setProcessing(false);
    }
  };

  const handleReactivate = async (user: ManagedUser) => {
    setProcessing(true);
    try {
      // Reactivate: set student status back to active
      const { error } = await supabase
        .from('students')
        .update({ status: 'active', is_active: true })
        .eq('user_id', user.id);
      if (error) throw error;

      toast.success(`${user.full_name || user.email} a été réactivé`);
      loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de la réactivation');
    } finally {
      setProcessing(false);
    }
  };

  const toggleClass = (classId: number) => {
    setSelectedClassIds(prev =>
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderUserCard = (user: ManagedUser) => (
    <Card key={user.id} className="touch-manipulation">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{user.full_name || 'Sans nom'}</p>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Inscrit {formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: fr })}
            </p>
            {user.roles.length > 0 && (
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {user.roles.map(r => (
                  <Badge key={r} variant="secondary" className="text-[10px] px-1.5 py-0">{r}</Badge>
                ))}
              </div>
            )}
          </div>

          {user.status === 'pending' && (
            <>
              <Badge variant="outline" className="self-start sm:self-center bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/20 whitespace-nowrap">
                <Clock className="h-3 w-3 mr-1" />En attente
              </Badge>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => openApproval(user)} className="flex-1 sm:flex-none native-btn touch-manipulation">
                  <UserCheck className="h-4 w-4 mr-1" /> Approuver
                </Button>
                <Button size="sm" variant="destructive" onClick={() => { setSelected(user); setRejectOpen(true); }} className="flex-1 sm:flex-none native-btn touch-manipulation">
                  <UserX className="h-4 w-4 mr-1" /> Rejeter
                </Button>
              </div>
            </>
          )}

          {user.status === 'active' && (
            <Badge variant="outline" className="self-start sm:self-center bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20 whitespace-nowrap">
              <CheckCircle2 className="h-3 w-3 mr-1" />Actif
            </Badge>
          )}

          {user.status === 'rejected' && (
            <>
              <Badge variant="outline" className="self-start sm:self-center bg-destructive/10 text-destructive border-destructive/20 whitespace-nowrap">
                <ShieldX className="h-3 w-3 mr-1" />Refusé
              </Badge>
              <Button size="sm" variant="outline" onClick={() => handleReactivate(user)} disabled={processing} className="native-btn touch-manipulation">
                <UserCheck className="h-4 w-4 mr-1" /> Réactiver
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-heading text-foreground flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Gestion des utilisateurs
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Approuver, rechercher et gérer tous les utilisateurs de la plateforme
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom ou email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10 h-11 touch-manipulation"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-12">
          <TabsTrigger value="pending" className="gap-1.5 touch-manipulation text-sm">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">En attente</span>
            <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{counts.pending}</Badge>
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-1.5 touch-manipulation text-sm">
            <CheckCircle2 className="h-4 w-4" />
            <span className="hidden sm:inline">Actifs</span>
            <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{counts.active}</Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-1.5 touch-manipulation text-sm">
            <ShieldX className="h-4 w-4" />
            <span className="hidden sm:inline">Refusés</span>
            <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{counts.rejected}</Badge>
          </TabsTrigger>
        </TabsList>

        {['pending', 'active', 'rejected'].map(tab => (
          <TabsContent key={tab} value={tab} className="mt-4">
            {filtered.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
                  <p className="text-muted-foreground font-medium">
                    {searchTerm ? 'Aucun résultat trouvé' : `Aucun utilisateur ${tab === 'pending' ? 'en attente' : tab === 'active' ? 'actif' : 'refusé'}`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filtered.map(renderUserCard)}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Approval Dialog */}
      <Dialog open={approvalOpen} onOpenChange={setApprovalOpen}>
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Approuver et assigner un rôle</DialogTitle>
            <DialogDescription>{selected?.full_name || selected?.email}</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label className="font-medium">Rôle</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'student', label: 'Étudiant', icon: GraduationCap, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
                  { value: 'teacher', label: 'Formateur', icon: BookOpen, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
                  { value: 'academy', label: 'Academy', icon: Building2, color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
                ].map(({ value, label, icon: Icon, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setSelectedRole(value); setSelectedClassIds([]); }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all native-btn touch-manipulation ${
                      selectedRole === value
                        ? `${color} border-current shadow-sm`
                        : 'border-border/50 hover:border-border text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {(selectedRole === 'student' || selectedRole === 'teacher') && (
              <div className="space-y-2">
                <Label className="font-medium">
                  {selectedRole === 'student' ? "Classes d'inscription" : 'Classes assignées'}
                </Label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto border rounded-xl p-3">
                  {classes.map((cls) => (
                    <label key={cls.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 cursor-pointer touch-manipulation">
                      <Checkbox checked={selectedClassIds.includes(cls.id)} onCheckedChange={() => toggleClass(cls.id)} />
                      <span className="text-sm">{cls.code} — {cls.title}</span>
                    </label>
                  ))}
                </div>
                {selectedClassIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">{selectedClassIds.length} classe(s) sélectionnée(s)</p>
                )}
              </div>
            )}

            {selectedRole === 'academy' && (
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                Le rôle Academy donne accès au tableau de bord de suivi (lecture seule).
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalOpen(false)} disabled={processing}>Annuler</Button>
            <Button onClick={handleApprove} disabled={!selectedRole || processing}>
              {processing ? 'Traitement...' : <><UserCheck className="h-4 w-4 mr-2" />Approuver</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeter cet utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-foreground">{selected?.full_name || selected?.email}</span> ne pourra pas accéder à la plateforme.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} className="bg-destructive hover:bg-destructive/90" disabled={processing}>
              {processing ? 'Traitement...' : <><UserX className="h-4 w-4 mr-2" />Rejeter</>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
