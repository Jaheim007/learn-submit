import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { UserCheck, UserX, Clock, Mail, GraduationCap, BookOpen, Building2, Search, Users, ShieldX, PowerOff, Power } from 'lucide-react';
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
  status: 'pending' | 'rejected' | 'deactivated';
  roles: string[];
  student_id?: string;
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
      const [overviewRes, classesRes, profilesRes, rolesRes] = await Promise.all([
        supabase.functions.invoke('admin-students-overview'),
        supabase.from('classes').select('id, code, title').eq('is_active', true).order('code'),
        supabase.from('profiles').select('id, full_name, email, created_at').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('user_id, role'),
      ]);

      const profiles = profilesRes.data || [];
      const roles = rolesRes.data || [];
      const studentsList = overviewRes.data?.students || [];

      // Build role map
      const rolesByUser = new Map<string, string[]>();
      roles.forEach((r: any) => {
        const existing = rolesByUser.get(r.user_id) || [];
        existing.push(r.role);
        rolesByUser.set(r.user_id, existing);
      });

      // Build student status map from edge function data (bypasses RLS)
      const studentStatusMap = new Map<string, { id: string; status: string; is_active: boolean; full_name: string; email: string; created_at: string }>();
      studentsList.forEach((s: any) => {
        studentStatusMap.set(s.user_id, { id: s.id, status: s.status || 'active', is_active: s.is_active, full_name: s.full_name, email: s.email, created_at: s.created_at });
      });

      // Build profile map for quick lookup
      const profileMap = new Map<string, { full_name: string; email: string; created_at: string }>();
      profiles.forEach(p => profileMap.set(p.id, { full_name: p.full_name || '', email: p.email, created_at: p.created_at }));

      const managed: ManagedUser[] = [];
      const processedUserIds = new Set<string>();

      // First pass: iterate profiles (covers pending users without student records)
      profiles.forEach(p => {
        processedUserIds.add(p.id);
        const userRoles = rolesByUser.get(p.id) || [];
        const studentInfo = studentStatusMap.get(p.id);

        let status: 'pending' | 'rejected' | 'deactivated' | 'active';

        if (studentInfo?.status === 'rejected') {
          status = 'rejected';
        } else if (studentInfo && !studentInfo.is_active && studentInfo.status !== 'rejected') {
          status = 'deactivated';
        } else if (userRoles.length === 0) {
          status = 'pending';
        } else if (studentInfo?.status === 'pending') {
          status = 'pending';
        } else {
          status = 'active';
        }

        if (status === 'pending' || status === 'rejected' || status === 'deactivated') {
          managed.push({
            id: p.id,
            full_name: p.full_name || '',
            email: p.email,
            created_at: p.created_at,
            status,
            roles: userRoles,
            student_id: studentInfo?.id,
          });
        }
      });

      // Second pass: students from edge function who have NO profile (catches inactive/rejected students without profiles)
      studentsList.forEach((s: any) => {
        if (processedUserIds.has(s.user_id)) return;
        const userRoles = rolesByUser.get(s.user_id) || [];

        let status: 'pending' | 'rejected' | 'deactivated' | 'active';
        if (s.status === 'rejected') {
          status = 'rejected';
        } else if (!s.is_active) {
          status = 'deactivated';
        } else {
          status = 'active';
        }

        if (status === 'rejected' || status === 'deactivated') {
          managed.push({
            id: s.user_id,
            full_name: s.full_name || '',
            email: s.email || '',
            created_at: s.created_at,
            status,
            roles: userRoles,
            student_id: s.id,
          });
        }
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
    rejected: allUsers.filter(u => u.status === 'rejected').length,
    deactivated: allUsers.filter(u => u.status === 'deactivated').length,
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
    if (!user.student_id) return;
    setProcessing(true);
    try {
      // Directly reactivate by setting is_active back to true
      const { error } = await supabase
        .from('students')
        .update({ is_active: true })
        .eq('id', user.student_id);

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
                <Clock className="h-3 w-3 mr-1" />Nouveau
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

          {user.status === 'rejected' && (
            <>
              <Badge variant="outline" className="self-start sm:self-center bg-destructive/10 text-destructive border-destructive/20 whitespace-nowrap">
                <ShieldX className="h-3 w-3 mr-1" />Refusé
              </Badge>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => openApproval(user)} className="native-btn touch-manipulation">
                  <UserCheck className="h-4 w-4 mr-1" /> Approuver
                </Button>
              </div>
            </>
          )}

          {user.status === 'deactivated' && (
            <>
              <Badge variant="outline" className="self-start sm:self-center bg-muted text-muted-foreground border-border whitespace-nowrap">
                <PowerOff className="h-3 w-3 mr-1" />Désactivé
              </Badge>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleReactivate(user)} disabled={processing} className="native-btn touch-manipulation">
                  <Power className="h-4 w-4 mr-1" /> Réactiver
                </Button>
              </div>
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
          Gestion des accès
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Approuver les nouveaux utilisateurs, gérer les refus et les comptes désactivés
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

      {/* Tabs — pending, rejected, deactivated */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-12">
          <TabsTrigger value="pending" className="gap-1 touch-manipulation text-xs sm:text-sm">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Nouveaux</span>
            <span className="sm:hidden">Nouv.</span>
            <Badge variant="secondary" className="ml-0.5 text-[10px] px-1.5 py-0">{counts.pending}</Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-1 touch-manipulation text-xs sm:text-sm">
            <ShieldX className="h-4 w-4" />
            <span className="hidden sm:inline">Refusés</span>
            <span className="sm:hidden">Ref.</span>
            <Badge variant="secondary" className="ml-0.5 text-[10px] px-1.5 py-0">{counts.rejected}</Badge>
          </TabsTrigger>
          <TabsTrigger value="deactivated" className="gap-1 touch-manipulation text-xs sm:text-sm">
            <PowerOff className="h-4 w-4" />
            <span className="hidden sm:inline">Désactivés</span>
            <span className="sm:hidden">Désact.</span>
            <Badge variant="secondary" className="ml-0.5 text-[10px] px-1.5 py-0">{counts.deactivated}</Badge>
          </TabsTrigger>
        </TabsList>

        {['pending', 'rejected', 'deactivated'].map(tab => (
          <TabsContent key={tab} value={tab} className="mt-4">
            {filtered.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
                  <p className="text-muted-foreground font-medium">
                    {searchTerm 
                      ? 'Aucun résultat trouvé' 
                      : `Aucun utilisateur ${tab === 'pending' ? 'en attente' : tab === 'rejected' ? 'refusé' : 'désactivé'}`
                    }
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
