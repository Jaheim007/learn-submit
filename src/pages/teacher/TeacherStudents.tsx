import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Search, Users, Mail, Phone, MessageCircle, Github, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Student {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  whatsapp: string;
  github_profile: string;
  avatar_url: string | null;
  className: string;
  classCode: string;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

export default function TeacherStudents() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [classes, setClasses] = useState<{ id: number; code: string; title: string }[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (user) loadStudents();
  }, [user]);

  const loadStudents = async () => {
    try {
      const { data: assignments } = await supabase
        .from('supervisor_class_assignments')
        .select('class_id')
        .eq('supervisor_user_id', user?.id);

      const classIds = assignments?.map(a => a.class_id) || [];
      if (classIds.length === 0) { setLoading(false); return; }

      const { data: classData } = await supabase.from('classes').select('id, code, title').in('id', classIds);
      setClasses(classData || []);
      const classMap = new Map((classData || []).map(c => [c.id, c]));

      const { data: enrollments } = await supabase.from('enrollments').select('class_id, student_id').in('class_id', classIds);
      if (!enrollments || enrollments.length === 0) { setLoading(false); return; }

      const studentIds = [...new Set(enrollments.map(e => e.student_id))];
      const { data: studentData } = await supabase
        .from('students')
        .select('id, full_name, email, phone, whatsapp, github_profile, avatar_url')
        .in('id', studentIds);

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
          avatar_url: s.avatar_url || null,
          className: cls?.title || '',
          classCode: cls?.code || '',
        };
      }).filter(Boolean) as Student[];

      // Deduplicate by student id + class
      const seen = new Set<string>();
      const unique = studentList.filter(s => {
        const key = `${s.id}-${s.classCode}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setStudents(unique);
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
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5 max-w-[1400px] mx-auto">
      <motion.div variants={item}>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground font-heading">Mes Étudiants</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {filtered.length} étudiant{filtered.length !== 1 ? 's' : ''} dans vos classes
        </p>
      </motion.div>

      <motion.div variants={item} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher par nom ou email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11 rounded-xl" />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-full sm:w-[200px] h-11 rounded-xl">
            <SelectValue placeholder="Filtrer par classe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les classes</SelectItem>
            {classes.map(c => (
              <SelectItem key={c.id} value={c.code}>{c.code} - {c.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Student List */}
      {filtered.length === 0 ? (
        <motion.div variants={item} className="rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm p-10 text-center">
          <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Aucun étudiant trouvé</p>
        </motion.div>
      ) : (
        <motion.div variants={item} className="space-y-2">
          {filtered.map((student) => (
            <motion.button
              key={`${student.id}-${student.classCode}`}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedStudent(student)}
              className="w-full text-left rounded-2xl border border-border/30 bg-card/60 backdrop-blur-sm p-4 hover:bg-card/80 transition-all touch-manipulation group flex items-center gap-4"
            >
              <ProfileAvatar
                avatarUrl={student.avatar_url}
                fullName={student.full_name}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground truncate">{student.full_name}</p>
                  <Badge variant="secondary" className="text-[10px] shrink-0 rounded-full px-2">{student.classCode}</Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{student.email}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Student Detail Modal */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="sr-only">Profil étudiant</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex flex-col items-center text-center">
                <ProfileAvatar avatarUrl={selectedStudent.avatar_url} fullName={selectedStudent.full_name} size="lg" />
                <h3 className="text-lg font-bold text-foreground mt-3 font-heading">{selectedStudent.full_name}</h3>
                <Badge variant="secondary" className="mt-1.5 rounded-full text-xs">{selectedStudent.classCode} — {selectedStudent.className}</Badge>
              </div>

              {/* Contact Info */}
              <div className="space-y-1">
                <ContactRow icon={Mail} label="Email" value={selectedStudent.email} href={`mailto:${selectedStudent.email}`} />
                {selectedStudent.phone && <ContactRow icon={Phone} label="Téléphone" value={selectedStudent.phone} href={`tel:${selectedStudent.phone}`} />}
                {selectedStudent.whatsapp && <ContactRow icon={MessageCircle} label="WhatsApp" value={selectedStudent.whatsapp} href={`https://wa.me/${selectedStudent.whatsapp.replace(/\D/g, '')}`} />}
                {selectedStudent.github_profile && <ContactRow icon={Github} label="GitHub" value={selectedStudent.github_profile} href={selectedStudent.github_profile.startsWith('http') ? selectedStudent.github_profile : `https://github.com/${selectedStudent.github_profile}`} />}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function ContactRow({ icon: Icon, label, value, href }: { icon: any; label: string; value: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl p-3 hover:bg-muted/50 transition-colors touch-manipulation group"
    >
      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground truncate">{value}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
    </a>
  );
}
