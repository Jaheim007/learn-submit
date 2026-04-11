import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { StudentDashboardLayout } from '@/components/StudentDashboardLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Medal, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { StatusBadge } from '@/components/StatusBadge';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations';

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

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoadingClasses(true);
      const { data: student } = await supabase.from('students').select('id').eq('user_id', user.id).single();
      if (!student) { setLoadingClasses(false); return; }
      const { data: enrollments } = await supabase.from('enrollments').select('class_id, classes(id, code, title)').eq('student_id', student.id);
      const cls = (enrollments || []).map((e: any) => e.classes).filter(Boolean);
      setClasses(cls);
      if (cls.length > 0) setSelectedClass(cls[0].id.toString());
      setLoadingClasses(false);
    };
    fetch();
  }, [user]);

  useEffect(() => {
    if (!selectedClass) return;
    const fetch = async () => {
      const { data } = await supabase.from('class_projects').select('project_id, projects(id, code, title, is_active)').eq('class_id', parseInt(selectedClass));
      const prjs = (data || []).map((cp: any) => cp.projects).filter((p: any) => p?.is_active);
      setProjects(prjs);
      if (prjs.length > 0) setSelectedProject(prjs[0].id.toString());
      else { setSelectedProject(''); setLeaderboard([]); }
    };
    fetch();
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass || !selectedProject) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const { data: submissions, error } = await supabase
          .from('submissions')
          .select('id, student_id, version, submitted_at, status, grade, students!inner(full_name, email), classes!inner(code)')
          .eq('project_id', parseInt(selectedProject))
          .eq('class_id', parseInt(selectedClass));
        if (error) throw error;
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
      } finally { setLoading(false); }
    };
    fetch();
  }, [selectedClass, selectedProject]);

  const getRankIcon = (rank: number | null) => {
    if (!rank) return null;
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return null;
  };

  const getRankBg = (rank: number | null) => {
    if (rank === 1) return 'bg-yellow-500/10 border-yellow-500/20';
    if (rank === 2) return 'bg-gray-400/10 border-gray-400/20';
    if (rank === 3) return 'bg-amber-600/10 border-amber-600/20';
    return 'bg-card border-border/50';
  };

  return (
    <StudentDashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground tracking-tight font-heading">Classement</h1>
          <p className="text-sm text-muted-foreground mt-1">Classement par projet</p>
        </motion.div>

        {/* Filters — native pill style */}
        <div className="grid grid-cols-2 gap-3">
          <Select value={selectedClass} onValueChange={setSelectedClass} disabled={loadingClasses}>
            <SelectTrigger className="h-11 rounded-xl text-sm">
              <SelectValue placeholder="Groupe" />
            </SelectTrigger>
            <SelectContent>
              {classes.map(c => (
                <SelectItem key={c.id} value={c.id.toString()}>{c.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedProject} onValueChange={setSelectedProject} disabled={projects.length === 0}>
            <SelectTrigger className="h-11 rounded-xl text-sm">
              <SelectValue placeholder="Projet" />
            </SelectTrigger>
            <SelectContent>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id.toString()}>{p.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results — native card list */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Chargement…</span>
          </div>
        ) : leaderboard.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-16">
            <div className="h-20 w-20 rounded-[22px] bg-muted/60 flex items-center justify-center mb-5">
              <Trophy className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">Aucune soumission</h3>
            <p className="text-sm text-muted-foreground">Le classement apparaîtra ici</p>
          </motion.div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-2">
            {leaderboard.map((entry, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className={`rounded-2xl border p-4 transition-all touch-manipulation active:scale-[0.98] ${getRankBg(entry.rank)}`}
              >
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-background/80 flex items-center justify-center">
                    {getRankIcon(entry.rank) || (
                      <span className="text-sm font-bold text-muted-foreground">
                        {entry.rank || '—'}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">{entry.student_name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted-foreground">v{entry.version}</span>
                      <span className="text-[11px] text-muted-foreground">·</span>
                      <span className="text-[11px] text-muted-foreground">
                        {format(new Date(entry.submitted_at), 'dd/MM/yy')}
                      </span>
                    </div>
                  </div>

                  {/* Grade + Status */}
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={entry.status as any} />
                    {entry.grade !== null ? (
                      <span className={`text-base font-bold ${
                        entry.grade >= 14 ? 'text-success' : entry.grade >= 10 ? 'text-warning' : 'text-destructive'
                      }`}>
                        {entry.grade}<span className="text-xs font-normal text-muted-foreground">/20</span>
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </StudentDashboardLayout>
  );
}