import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, FileText, BookOpen, ChevronRight, Clock, FolderOpen, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

interface ClassInfo {
  id: number;
  code: string;
  title: string;
  studentCount: number;
  submissionCount: number;
  pendingCount: number;
}

interface Stats {
  myClasses: ClassInfo[];
  myStudents: number;
  pendingSubmissions: number;
  totalSubmissions: number;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } } };

export default function TeacherHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ myClasses: [], myStudents: 0, pendingSubmissions: 0, totalSubmissions: 0 });
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);

  useEffect(() => {
    if (user) {
      loadStats();
      supabase.from('profiles').select('full_name').eq('id', user.id).single()
        .then(({ data }) => { if (data) setProfile(data); });
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const { data: assignments } = await supabase
        .from('supervisor_class_assignments')
        .select('class_id, classes(id, code, title)')
        .eq('supervisor_user_id', user?.id);

      const classIds = assignments?.map(a => a.class_id) || [];
      if (classIds.length === 0) {
        setStats({ myClasses: [], myStudents: 0, pendingSubmissions: 0, totalSubmissions: 0 });
        setLoading(false);
        return;
      }

      const [{ data: enrollments }, { data: submissions }] = await Promise.all([
        supabase.from('enrollments').select('class_id, student_id').in('class_id', classIds),
        supabase.from('submissions').select('class_id, status').in('class_id', classIds),
      ]);

      const myClasses: ClassInfo[] = (assignments || []).map(a => {
        const cls = a.classes as any;
        const classEnrollments = enrollments?.filter(e => e.class_id === a.class_id) || [];
        const classSubs = submissions?.filter(s => s.class_id === a.class_id) || [];
        const pending = classSubs.filter(s => s.status === 'Reçu' || s.status === 'En révision').length;
        return { id: cls.id, code: cls.code, title: cls.title, studentCount: classEnrollments.length, submissionCount: classSubs.length, pendingCount: pending };
      });

      setStats({
        myClasses,
        myStudents: enrollments?.length || 0,
        pendingSubmissions: submissions?.filter(s => s.status === 'Reçu' || s.status === 'En révision').length || 0,
        totalSubmissions: submissions?.length || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statCards = [
    { label: 'Mes Classes', value: stats.myClasses.length, icon: BookOpen, color: 'from-indigo-500/20 to-indigo-600/5', iconColor: 'text-indigo-400' },
    { label: 'Étudiants', value: stats.myStudents, icon: Users, color: 'from-emerald-500/20 to-emerald-600/5', iconColor: 'text-emerald-400' },
    { label: 'À réviser', value: stats.pendingSubmissions, icon: Clock, color: 'from-amber-500/20 to-amber-600/5', iconColor: 'text-amber-400', highlight: stats.pendingSubmissions > 0 },
    { label: 'Soumissions', value: stats.totalSubmissions, icon: FileText, color: 'from-violet-500/20 to-violet-600/5', iconColor: 'text-violet-400' },
  ];

  const quickActions = [
    { label: 'Réviser', sub: `${stats.pendingSubmissions} en attente`, icon: FileText, path: '/teacher/submissions', gradient: 'from-primary/10 to-primary/5' },
    { label: 'Étudiants', sub: `${stats.myStudents} actifs`, icon: Users, path: '/teacher/students', gradient: 'from-emerald-500/10 to-emerald-600/5' },
    { label: 'Projets', sub: 'Gérer', icon: FolderOpen, path: '/teacher/projects', gradient: 'from-violet-500/10 to-violet-600/5' },
    { label: 'Cours', sub: 'Contenu', icon: BookOpen, path: '/teacher/courses', gradient: 'from-amber-500/10 to-amber-600/5' },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1400px] mx-auto">
      {/* Hero Greeting */}
      <motion.div variants={item} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/10 p-6 lg:p-8">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-primary uppercase tracking-wider">Espace Formateur</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground font-heading">
            {greeting()}, {profile?.full_name?.split(' ')[0] || 'Formateur'} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {stats.pendingSubmissions > 0
              ? `Vous avez ${stats.pendingSubmissions} soumission${stats.pendingSubmissions > 1 ? 's' : ''} en attente de révision`
              : 'Tout est à jour. Votre tableau de bord est clean ✨'}
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              whileTap={{ scale: 0.97 }}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.color} border border-border/30 p-4 lg:p-5 touch-manipulation ${card.highlight ? 'ring-1 ring-amber-500/30' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`h-10 w-10 rounded-xl bg-background/60 backdrop-blur-sm flex items-center justify-center ${card.iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                {card.highlight && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                )}
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-foreground font-heading">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Classes Section */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground font-heading flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Mes Classes
          </h2>
        </div>
        {stats.myClasses.length === 0 ? (
          <div className="rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm p-8 text-center">
            <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Aucune classe assignée</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {stats.myClasses.map((cls) => (
              <motion.button
                key={cls.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/teacher/submissions')}
                className="w-full text-left rounded-2xl border border-border/30 bg-card/60 backdrop-blur-sm p-5 hover:bg-card/80 transition-all touch-manipulation group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-foreground font-heading text-base">{cls.code}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{cls.title}</p>
                  </div>
                  {cls.pendingCount > 0 && (
                    <Badge variant="destructive" className="text-[10px] px-2 py-0.5 rounded-full">
                      {cls.pendingCount} en attente
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {cls.studentCount}</span>
                    <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {cls.submissionCount}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item}>
        <h2 className="text-lg font-bold text-foreground font-heading mb-4">Accès rapide</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.label}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(action.path)}
                className={`rounded-2xl bg-gradient-to-br ${action.gradient} border border-border/20 p-4 lg:p-5 text-center hover:border-primary/30 transition-all touch-manipulation group`}
              >
                <div className="h-10 w-10 rounded-xl bg-background/50 backdrop-blur-sm flex items-center justify-center mx-auto mb-2.5 group-hover:bg-primary/10 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">{action.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{action.sub}</p>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
