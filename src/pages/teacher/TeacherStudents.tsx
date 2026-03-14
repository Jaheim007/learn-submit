import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Search, Users } from 'lucide-react';

interface Student {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  whatsapp: string;
  github_profile: string;
  className: string;
  classCode: string;
}

export default function TeacherStudents() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [classes, setClasses] = useState<{ id: number; code: string; title: string }[]>([]);

  useEffect(() => {
    if (user) loadStudents();
  }, [user]);

  const loadStudents = async () => {
    try {
      // Step 1: Get supervisor's assigned classes
      const { data: assignments, error: assignError } = await supabase
        .from('supervisor_class_assignments')
        .select('class_id')
        .eq('supervisor_user_id', user?.id);

      if (assignError) { console.error('Assignments error:', assignError); }

      const classIds = assignments?.map(a => a.class_id) || [];
      if (classIds.length === 0) { setLoading(false); return; }

      // Step 2: Get class details (public read)
      const { data: classData } = await supabase
        .from('classes')
        .select('id, code, title')
        .in('id', classIds);
      
      setClasses(classData || []);
      const classMap = new Map((classData || []).map(c => [c.id, c]));

      // Step 3: Get enrollments for those classes
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('class_id, student_id')
        .in('class_id', classIds);

      if (enrollError) { console.error('Enrollments error:', enrollError); }
      if (!enrollments || enrollments.length === 0) { setLoading(false); return; }

      // Step 4: Get student details separately
      const studentIds = [...new Set(enrollments.map(e => e.student_id))];
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, full_name, email, phone, whatsapp, github_profile')
        .in('id', studentIds);

      if (studentError) { console.error('Students error:', studentError); }

      const studentMap = new Map((studentData || []).map(s => [s.id, s]));

      const studentList: Student[] = enrollments.map(e => {
        const s = studentMap.get(e.student_id);
        const cls = classMap.get(e.class_id);
        if (!s) return null;
        return {
          id: s.id,
          full_name: s.full_name || 'Sans nom',
          email: s.email || '',
          phone: s.phone || '',
          whatsapp: s.whatsapp || '',
          github_profile: s.github_profile || '',
          className: cls?.title || '',
          classCode: cls?.code || '',
        };
      }).filter(Boolean) as Student[];

      setStudents(studentList);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = students.filter(s => {
    const matchesSearch = s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchesClass = classFilter === 'all' || s.classCode === classFilter;
    return matchesSearch && matchesClass;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mes Étudiants</h1>
        <p className="text-muted-foreground mt-1">Étudiants inscrits dans vos classes assignées</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un étudiant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrer par classe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les classes</SelectItem>
            {classes.map(c => (
              <SelectItem key={c.id} value={c.code}>{c.code} - {c.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {filtered.length} étudiant{filtered.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Aucun étudiant trouvé
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden md:table-cell">Téléphone</TableHead>
                    <TableHead className="hidden lg:table-cell">WhatsApp</TableHead>
                    <TableHead>Classe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((student, idx) => (
                    <TableRow key={`${student.id}-${idx}`}>
                      <TableCell className="font-medium">{student.full_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{student.email}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{student.phone || '—'}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{student.whatsapp || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{student.classCode}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
