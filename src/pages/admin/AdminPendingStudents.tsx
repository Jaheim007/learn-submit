import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { UserCheck, UserX, Clock, Mail, GraduationCap, BookOpen, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface PendingUser {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

interface ClassInfo {
  id: number;
  code: string;
  title: string;
}

export default function AdminPendingStudents() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [selected, setSelected] = useState<PendingUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get all profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at')
        .order('created_at', { ascending: true });

      // Get all user_roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      // Get pending students (old flow)
      const { data: pendingStudents } = await supabase
        .from('students')
        .select('user_id')
        .eq('status', 'pending');

      const pendingStudentIds = new Set((pendingStudents || []).map(s => s.user_id));
      const usersWithRoles = new Set((roles || []).map(r => r.user_id));

      // Pending = profiles with no role OR students with status=pending
      const pending = (profiles || []).filter(p => 
        !usersWithRoles.has(p.id) || pendingStudentIds.has(p.id)
      );

      setPendingUsers(pending);

      const { data: classesData } = await supabase
        .from('classes')
        .select('id, code, title')
        .eq('is_active', true)
        .order('code');

      if (classesData) setClasses(classesData);
    } catch (error) {
      console.error('Error loading:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const openApproval = (user: PendingUser) => {
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
        body: {
          user_id: selected.id,
          action: 'approve',
          role: selectedRole,
          class_ids: selectedClassIds,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const roleLabel = selectedRole === 'student' ? 'Étudiant' : selectedRole === 'teacher' ? 'Formateur' : 'Academy';
      toast.success(`${selected.full_name} approuvé comme ${roleLabel}`);
      setApprovalOpen(false);
      setSelected(null);
      loadData();
    } catch (error: any) {
      console.error('Approve error:', error);
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

      toast.success(`${selected.full_name} a été rejeté`);
      setRejectOpen(false);
      setSelected(null);
      loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors du rejet');
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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <Clock className="h-5 w-5 text-[hsl(var(--warning))]" />
          En attente ({pendingUsers.length})
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Utilisateurs en attente d'approbation et d'assignation de rôle
        </p>
      </div>

      {pendingUsers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UserCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
            <p className="text-muted-foreground font-medium">Aucun utilisateur en attente</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pendingUsers.map((user) => (
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
                  </div>
                  <Badge variant="outline" className="self-start sm:self-center bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/20 whitespace-nowrap">
                    <Clock className="h-3 w-3 mr-1" />
                    En attente
                  </Badge>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => openApproval(user)} className="flex-1 sm:flex-none native-btn touch-manipulation">
                      <UserCheck className="h-4 w-4 mr-1" /> Approuver
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => { setSelected(user); setRejectOpen(true); }} className="flex-1 sm:flex-none native-btn touch-manipulation">
                      <UserX className="h-4 w-4 mr-1" /> Rejeter
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approval Dialog with Role Selection */}
      <Dialog open={approvalOpen} onOpenChange={setApprovalOpen}>
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Approuver et assigner un rôle</DialogTitle>
            <DialogDescription>
              {selected?.full_name} — {selected?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Role selection */}
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

            {/* Class selection (for student and teacher) */}
            {(selectedRole === 'student' || selectedRole === 'teacher') && (
              <div className="space-y-2">
                <Label className="font-medium">
                  {selectedRole === 'student' ? 'Classes d\'inscription' : 'Classes assignées'}
                </Label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto border rounded-xl p-3">
                  {classes.map((cls) => (
                    <label
                      key={cls.id}
                      className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 cursor-pointer touch-manipulation"
                    >
                      <Checkbox
                        checked={selectedClassIds.includes(cls.id)}
                        onCheckedChange={() => toggleClass(cls.id)}
                      />
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
                Le rôle Academy donne accès au tableau de bord de suivi (lecture seule pour les projets, cours et soumissions).
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalOpen(false)} disabled={processing}>
              Annuler
            </Button>
            <Button onClick={handleApprove} disabled={!selectedRole || processing}>
              {processing ? 'Traitement...' : (
                <><UserCheck className="h-4 w-4 mr-2" />Approuver</>
              )}
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
              <span className="font-semibold text-foreground">{selected?.full_name}</span> ne pourra pas accéder à la plateforme.
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
