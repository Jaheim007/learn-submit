import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LoadingScreen } from '@/components/LoadingScreen';
import { StudentDashboardLayout } from '@/components/StudentDashboardLayout';
import { FileText, Download, Calendar } from 'lucide-react';
import { RichTextRenderer } from '@/components/ui/rich-text-editor';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations';

interface Submission {
  id: number;
  project_code: string;
  project_title: string;
  project_image_url: string | null;
  class_code: string;
  submitted_at: string;
  status: 'Reçu' | 'En révision' | 'Validé' | 'Refusé';
  link1: string | null;
  link2: string | null;
  link3: string | null;
  file1_url: string | null;
  file2_url: string | null;
  file3_url: string | null;
  file_urls: string[] | null;
  description: string | null;
  grade: number | null;
  feedback: string | null;
}

export default function StudentSubmissions() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    if (user) fetchSubmissions();
  }, [user]);

  const fetchSubmissions = async () => {
    try {
      const { data: studentData } = await supabase.from('students').select('id').eq('user_id', user?.id).single();
      if (!studentData) return;
      const { data } = await supabase.from('submissions').select(`id, submitted_at, status, link1, link2, link3, file1_url, file2_url, file3_url, file_urls, description, grade, feedback, projects (code, title, image_url), classes (code)`).eq('student_id', studentData.id).order('submitted_at', { ascending: false });
      const mapped = data?.map((s: any) => ({ ...s, project_code: s.projects?.code, project_title: s.projects?.title, project_image_url: s.projects?.image_url, class_code: s.classes?.code })) || [];
      setSubmissions(mapped);
    } catch (error) { toast.error('Erreur lors du chargement'); } finally { setLoading(false); }
  };

  const downloadFile = async (filePath: string) => {
    try {
      const fileName = filePath.split('/').pop() || 'file';
      if (filePath.startsWith('http')) {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = fileName; link.click();
      } else {
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage.from('submissions').createSignedUrl(filePath, 60);
        if (signedUrlError) throw signedUrlError;
        if (!signedUrlData?.signedUrl) throw new Error('No signed URL generated');
        const response = await fetch(signedUrlData.signedUrl);
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = fileName; link.click();
      }
      toast.success('Téléchargement réussi');
    } catch (error: any) { toast.error('Erreur: ' + (error.message || 'Téléchargement impossible')); }
  };

  const withProtocol = (url?: string | null) => {
    if (!url) return '';
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
  };

  if (loading || authLoading) return <LoadingScreen />;

  return (
    <StudentDashboardLayout>
      <div className="max-w-7xl mx-auto space-y-5">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight font-heading">Mes Soumissions</h1>
          <p className="text-sm text-muted-foreground mt-1">{submissions.length} soumission{submissions.length !== 1 ? 's' : ''}</p>
        </motion.div>

        {submissions.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-16">
            <div className="h-20 w-20 rounded-[22px] bg-muted/60 flex items-center justify-center mb-5">
              <FileText className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">Aucune soumission</h3>
            <p className="text-sm text-muted-foreground">Vous n'avez pas encore soumis de projet</p>
          </motion.div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid gap-4">
            {submissions.map((sub) => (
              <motion.div key={sub.id} variants={staggerItem} className="bg-card rounded-2xl border border-border/50 overflow-hidden native-press touch-manipulation">
                {/* Image hero */}
                {sub.project_image_url ? (
                  <div className="relative h-32 lg:h-44 w-full overflow-hidden">
                    <img src={sub.project_image_url} alt={sub.project_title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <Badge variant="outline" className="bg-card/90 backdrop-blur-sm border-border/30 text-xs font-semibold rounded-lg">{sub.project_code}</Badge>
                    </div>
                    <div className="absolute top-3 right-3"><StatusBadge status={sub.status} /></div>
                  </div>
                ) : (
                  <div className="relative h-20 lg:h-28 w-full bg-gradient-to-br from-primary/8 via-card to-accent/5">
                    <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-primary/5" />
                    <div className="absolute top-3 left-3">
                      <Badge variant="outline" className="bg-card/90 backdrop-blur-sm border-border/30 text-xs font-semibold rounded-lg">{sub.project_code}</Badge>
                    </div>
                    <div className="absolute top-3 right-3"><StatusBadge status={sub.status} /></div>
                  </div>
                )}

                <div className="p-4 lg:p-5 space-y-3">
                  <h3 className="text-base lg:text-lg font-bold text-foreground">{sub.project_title}</h3>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>{new Date(sub.submitted_at).toLocaleDateString('fr-FR')} à {new Date(sub.submitted_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {sub.description && (
                    <div className="text-sm text-muted-foreground border-t border-border/40 pt-3">
                      <RichTextRenderer content={sub.description} />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {[sub.link1, sub.link2, sub.link3].filter(Boolean).map((link, idx) => (
                      <a key={idx} href={withProtocol(link!)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors native-btn">
                        Lien {idx + 1}
                      </a>
                    ))}
                    {(sub.file_urls && sub.file_urls.length > 0
                      ? sub.file_urls
                      : [sub.file1_url, sub.file2_url, sub.file3_url].filter(Boolean) as string[]
                    ).map((file, idx) => (
                      <button key={idx} onClick={() => downloadFile(file)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted text-foreground text-xs font-semibold hover:bg-muted/80 transition-colors native-btn">
                        <Download className="h-3 w-3" />
                        {file.split('/').pop()?.replace(/^\d+_/, '') || `Fichier ${idx + 1}`}
                      </button>
                    ))}
                  </div>

                  {sub.grade !== null && (
                    <div className="border-t border-border/40 pt-3 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-foreground">Note:</span>
                        <span className={`text-lg font-bold ${sub.grade >= 14 ? 'text-success' : sub.grade >= 10 ? 'text-warning' : 'text-destructive'}`}>{sub.grade}/20</span>
                      </div>
                      {sub.feedback && <div className="text-sm text-muted-foreground"><RichTextRenderer content={sub.feedback} /></div>}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </StudentDashboardLayout>
  );
}
