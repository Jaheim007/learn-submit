import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { StudentDashboardLayout } from '@/components/StudentDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Medal, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { StatusBadge } from '@/components/StatusBadge';

interface LeaderboardEntry {
  rank: number | null;
  student_name: string;
  project_code: string;
  version: number;
  submitted_at: string;
  status: string;
  grade: number | null;
}

export default function StudentLeaderboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(true);

  // Fetch student's enrolled classes
  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoadingClasses(true);
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (!student) { setLoadingClasses(false); return; }

      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('class_id, classes(id, code, title)')
        .eq('student_id', student.id);

      const cls = (enrollments || []).map((e: any) => e.classes).filter(Boolean);
      setClasses(cls);
      if (cls.length > 0) setSelectedClass(cls[0].id.toString());
      setLoadingClasses(false);
    };
    fetch();
  }, [user]);

  // Fetch projects for selected class
  useEffect(() => {
    if (!selectedClass) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('class_projects')
        .select('project_id, projects(id, code, title, is_active)')
        .eq('class_id', parseInt(selectedClass));

      const prjs = (data || []).map((cp: any) => cp.projects).filter((p: any) => p?.is_active);
      setProjects(prjs);
      if (prjs.length > 0) setSelectedProject(prjs[0].id.toString());
      else { setSelectedProject(''); setLeaderboard([]); }
    };
    fetch();
  }, [selectedClass]);

  // Fetch leaderboard for selected class + project
  useEffect(() => {
    if (!selectedClass || !selectedProject) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const { data: submissions, error } = await supabase
          .from('submissions')
          .select(`
            id, student_id, version, submitted_at, status, grade,
            students!inner(full_name, email),
            classes!inner(code)
          `)
          .eq('project_id', parseInt(selectedProject))
          .eq('class_id', parseInt(selectedClass));

        if (error) throw error;

        // Keep only latest version per student
        const latest = new Map<string, any>();
        (submissions || []).forEach((s: any) => {
          const existing = latest.get(s.student_id);
          if (!existing || s.version > existing.version) latest.set(s.student_id, s);
        });

        const sorted = Array.from(latest.values()).sort((a, b) => {
          if (a.grade === null && b.grade === null) return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
          if (a.grade === null) return 1;
          if (b.grade === null) return -1;
          if (b.grade !== a.grade) return b.grade - a.grade;
          return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
        });

        let rank = 0, prevGrade: number | null | undefined;
        const ranked: LeaderboardEntry[] = sorted.map(s => {
          if (s.grade !== prevGrade) { rank++; prevGrade = s.grade; }
          return {
            rank: s.grade !== null ? rank : null,
            student_name: s.students.full_name || s.students.email,
            project_code: s.classes.code,
            version: s.version,
            submitted_at: s.submitted_at,
            status: s.status,
            grade: s.grade,
          };
        });
        setLeaderboard(ranked);
      } catch {
        toast.error('Erreur lors du chargement du classement');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [selectedClass, selectedProject]);

  const getRankDisplay = (rank: number | null) => {
    if (!rank) return <span className="text-muted-foreground">—</span>;
    if (rank === 1) return <div className="flex items-center gap-1.5"><Trophy className="h-4 w-4 text-yellow-500" /><span className="font-bold">{rank}</span></div>;
    if (rank === 2) return <div className="flex items-center gap-1.5"><Medal className="h-4 w-4 text-gray-400" /><span className="font-bold">{rank}</span></div>;
    if (rank === 3) return <div className="flex items-center gap-1.5"><Medal className="h-4 w-4 text-amber-600" /><span className="font-bold">{rank}</span></div>;
    return <span className="font-medium">{rank}</span>;
  };

  return (
    <StudentDashboardLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Classement</h1>
          <p className="text-sm text-muted-foreground mt-1">Classement par projet dans vos groupes</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Groupe</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass} disabled={loadingClasses}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Sélectionner un groupe" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.code} — {c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Projet</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject} disabled={projects.length === 0}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Sélectionner un projet" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Résultats
              <span className="text-xs font-normal text-muted-foreground ml-2">
                {leaderboard.length} étudiant{leaderboard.length !== 1 ? 's' : ''}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement…
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Aucune soumission trouvée.
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rang</TableHead>
                      <TableHead>Étudiant</TableHead>
                      <TableHead className="hidden sm:table-cell">Version</TableHead>
                      <TableHead className="hidden md:table-cell">Soumis le</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="w-20 text-right">Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((entry, i) => (
                      <TableRow key={i}>
                        <TableCell>{getRankDisplay(entry.rank)}</TableCell>
                        <TableCell className="font-medium text-sm">{entry.student_name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">v{entry.version}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                          {format(new Date(entry.submitted_at), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                        <TableCell><StatusBadge status={entry.status as any} /></TableCell>
                        <TableCell className="text-right">
                          {entry.grade !== null ? (
                            <span className="font-semibold">{entry.grade}/20</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
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
    </StudentDashboardLayout>
  );
}
