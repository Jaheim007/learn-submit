import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { UserCheck, UserX, Clock, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { sendNotificationToUsers } from '@/lib/pushNotifications';

interface PendingStudent {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  created_at: string;
  status: string;
}

interface Class {
  id: number;
  code: string;
  title: string;
}

export default function AdminPendingStudents() {
  const [pendingStudents, setPendingStudents] = useState<PendingStudent[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<PendingStudent | null>(null);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentsRes, classesRes] = await Promise.all([
        supabase
          .from('students')
          .select('id, user_id, full_name, email, created_at, status')
          .eq('status', 'pending')
          .order('created_at', { ascending: true }),
        
        supabase
          .from('classes')
          .select('id, code, title')
          .eq('is_active', true)
          .order('code')
      ]);

      if (studentsRes.data) setPendingStudents(studentsRes.data);
      if (classesRes.data) setClasses(classesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const openApprovalDialog = (student: PendingStudent) => {
    setSelectedStudent(student);
    setSelectedClassIds([]);
    setApprovalDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedStudent || selectedClassIds.length === 0) {
      toast.error('Veuillez sélectionner au moins une classe');
      return;
    }

    try {
      // First, get the student to ensure we have the right ID
      const { data: studentData, error: fetchError } = await supabase
        .from('students')
        .select('id, user_id')
        .eq('id', selectedStudent.id)
        .single();

      if (fetchError || !studentData) {
        console.error('Fetch error:', fetchError);
        throw new Error('Impossible de trouver l\'étudiant');
      }

      // Update student status to active AND set primary class to first selected class
      const { error: updateError } = await supabase
        .from('students')
        .update({ 
          status: 'active',
          is_active: true,
          primary_class_id: parseInt(selectedClassIds[0]) // Set first class as primary
        })
        .eq('id', studentData.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      // Enroll student in selected classes
      const enrollments = selectedClassIds.map(classId => ({
        student_id: studentData.id,
        class_id: parseInt(classId)
      }));

      const { error: enrollError } = await supabase
        .from('enrollments')
        .insert(enrollments);

      if (enrollError) {
        console.error('Enrollment error:', enrollError);
        throw enrollError;
      }

      // Send push notification
      await sendNotificationToUsers(
        [studentData.user_id],
        'Compte approuvé ✅',
        `Bienvenue ${selectedStudent.full_name}! Votre compte a été approuvé. Vous pouvez maintenant accéder aux cours.`,
        { type: 'account_approved' }
      );

      toast.success(`${selectedStudent.full_name} a été approuvé et inscrit à ${selectedClassIds.length} classe(s)`);
      setApprovalDialogOpen(false);
      setSelectedStudent(null);
      setSelectedClassIds([]);
      loadData();
    } catch (error: any) {
      console.error('Error approving student:', error);
      const errorMessage = error?.message || "Erreur lors de l'approbation";
      toast.error(errorMessage);
    }
  };

  const handleReject = async (student: PendingStudent) => {
    if (!confirm(`Êtes-vous sûr de vouloir rejeter ${student.full_name}? Le compte sera supprimé définitivement.`)) {
      return;
    }

    try {
      // Delete student record (cascades to delete auth user via RLS)
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', student.id);

      if (error) throw error;

      toast.success('Étudiant rejeté et compte supprimé');
      loadData();
    } catch (error) {
      console.error('Error rejecting student:', error);
      toast.error('Erreur lors du rejet');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Étudiants en attente d'approbation ({pendingStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Aucun étudiant en attente</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom complet</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Inscrit depuis</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.full_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {student.email}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(student.created_at), {
                        addSuffix: true,
                        locale: fr
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                        <Clock className="h-3 w-3 mr-1" />
                        En attente
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => openApprovalDialog(student)}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Approuver
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(student)}
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Rejeter
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Approuver et assigner aux classes</DialogTitle>
            <DialogDescription>
              Sélectionnez les classes pour {selectedStudent?.full_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Classes disponibles</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                {classes.map((cls) => (
                  <div key={cls.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`class-${cls.id}`}
                      checked={selectedClassIds.includes(cls.id.toString())}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedClassIds([...selectedClassIds, cls.id.toString()]);
                        } else {
                          setSelectedClassIds(selectedClassIds.filter(id => id !== cls.id.toString()));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor={`class-${cls.id}`} className="text-sm cursor-pointer">
                      {cls.code} - {cls.title}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {selectedClassIds.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {selectedClassIds.length} classe(s) sélectionnée(s)
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleApprove} disabled={selectedClassIds.length === 0}>
              <UserCheck className="h-4 w-4 mr-2" />
              Approuver et inscrire
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
