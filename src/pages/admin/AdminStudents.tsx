import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search, Download, UserX, UserCheck, Eye, ArrowRightLeft } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRefreshInterval } from '@/hooks/useRefreshInterval';
import { RefreshHeader } from '@/components/admin/RefreshHeader';
import { StudentProfileModal } from '@/components/admin/StudentProfileModal';
import { ChangeClassDialog } from '@/components/admin/ChangeClassDialog';

interface Student {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  telegram: string | null;
  github_profile: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  last_activity?: string;
  classes: { code: string; title: string }[];
  submissions_count: number;
}

interface Class {
  id: number;
  code: string;
  title: string;
}

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [changeClassOpen, setChangeClassOpen] = useState(false);
  const [studentToChangeClass, setStudentToChangeClass] = useState<Student | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-students-overview');

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setStudents(data?.students || []);
      setClasses(data?.classes || []);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Erreur lors du chargement des étudiants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const { lastRefreshTime, refresh } = useRefreshInterval(loadData);

  const toggleStudentStatus = async (studentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ is_active: !currentStatus })
        .eq('id', studentId);

      if (error) throw error;

      setStudents(prev => 
        prev.map(student => 
          student.id === studentId 
            ? { ...student, is_active: !currentStatus }
            : student
        )
      );

      toast.success(
        !currentStatus 
          ? 'Étudiant réactivé avec succès' 
          : 'Étudiant désactivé avec succès'
      );
    } catch (error) {
      console.error('Error updating student status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const exportToCSV = () => {
    const filteredStudents = getFilteredStudents;
    const csvData = [
      ['Nom', 'Email', 'Classes', 'Soumissions', 'Statut', 'Date d\'inscription'],
      ...filteredStudents.map(student => [
        student.full_name,
        student.email,
        student.classes.map(c => c.code).join(', '),
        student.submissions_count.toString(),
        student.is_active ? 'Actif' : 'Inactif',
        new Date(student.created_at).toLocaleDateString('fr-FR')
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `etudiants_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getFilteredStudents = useMemo(() => {
    return students.filter(student => {
      // Status filter
      if (!showInactive && !student.is_active) return false;
      
      // Search filter
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        if (!student.full_name.toLowerCase().includes(searchLower) &&
            !student.email.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // Class filter
      if (selectedClass !== 'all') {
        if (!student.classes.some(c => c.code === selectedClass)) {
          return false;
        }
      }
      
      return true;
    });
  }, [students, debouncedSearchTerm, selectedClass, showInactive]);

  // Paginate
  const totalPages = Math.ceil(getFilteredStudents.length / PAGE_SIZE);
  const paginatedStudents = getFilteredStudents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [debouncedSearchTerm, selectedClass, showInactive]);

  const filteredStudents = paginatedStudents;

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Gestion des étudiants</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {getFilteredStudents.length} étudiant{getFilteredStudents.length > 1 ? 's' : ''} trouvé{getFilteredStudents.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <RefreshHeader 
            lastRefreshTime={lastRefreshTime} 
            onRefresh={refresh}
            isRefreshing={loading}
          />
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Exporter CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Toutes les classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les classes</SelectItem>
                {classes.map((classe) => (
                  <SelectItem key={classe.id} value={classe.code}>
                    {classe.code} - {classe.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2 col-span-1 sm:col-span-2 lg:col-span-2">
              <input
                type="checkbox"
                id="showInactive"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="showInactive" className="text-sm">
                Inclure les inactifs
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students — Desktop Table, Mobile Cards */}
      {/* Desktop */}
      <Card className="hidden lg:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Classes</TableHead>
                <TableHead>Soumissions</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Inscription</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.full_name}</TableCell>
                  <TableCell className="text-sm">{student.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {student.classes.map((classe) => (
                        <Badge key={classe.code} variant="secondary" className="text-xs">
                          {classe.code}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{student.submissions_count}</TableCell>
                  <TableCell>
                    <Badge variant={student.is_active ? "default" : "secondary"}>
                      {student.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(student.created_at), { addSuffix: true, locale: fr })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedStudent(student); setProfileModalOpen(true); }} title="Voir profil">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setStudentToChangeClass(student); setChangeClassOpen(true); }} title="Changer de classe">
                        <ArrowRightLeft className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className={student.is_active ? "text-destructive" : "text-[hsl(var(--success))]"}>
                            {student.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{student.is_active ? 'Désactiver' : 'Réactiver'} l'étudiant</AlertDialogTitle>
                            <AlertDialogDescription>
                              {student.is_active ? "Désactiver l'étudiant ? Cette action est réversible." : "Réactiver l'étudiant ?"}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => toggleStudentStatus(student.id, student.is_active)}>
                              {student.is_active ? 'Désactiver' : 'Réactiver'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucun étudiant trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filteredStudents.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Aucun étudiant trouvé</CardContent></Card>
        ) : (
          filteredStudents.map((student) => (
            <Card key={student.id} className="touch-manipulation active:scale-[0.99] transition-transform">
              <CardContent className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{student.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                  </div>
                  <Badge variant={student.is_active ? "default" : "secondary"} className="text-[10px] shrink-0">
                    {student.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {student.classes.map((classe) => (
                    <Badge key={classe.code} variant="secondary" className="text-[10px] px-1.5 py-0">{classe.code}</Badge>
                  ))}
                  <span className="text-[10px] text-muted-foreground ml-auto">{student.submissions_count} soum.</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border/40">
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(student.created_at), { addSuffix: true, locale: fr })}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedStudent(student); setProfileModalOpen(true); }}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setStudentToChangeClass(student); setChangeClassOpen(true); }}>
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${student.is_active ? "text-destructive" : "text-[hsl(var(--success))]"}`}
                      onClick={() => toggleStudentStatus(student.id, student.is_active)}
                    >
                      {student.is_active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} / {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      {/* Student Profile Modal */}
      <StudentProfileModal 
        student={selectedStudent}
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
      />

      {/* Change Class Dialog */}
      <ChangeClassDialog
        open={changeClassOpen}
        onOpenChange={setChangeClassOpen}
        student={studentToChangeClass}
        onSuccess={loadData}
      />
    </div>
  );
}