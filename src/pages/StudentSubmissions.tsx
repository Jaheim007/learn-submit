import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LoadingScreen } from '@/components/LoadingScreen';
import { StudentDashboardLayout } from '@/components/StudentDashboardLayout';
import { FileText, Download, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';

interface Submission {
  id: number;
  project_code: string;
  project_title: string;
  class_code: string;
  submitted_at: string;
  status: 'Reçu' | 'En révision' | 'Validé' | 'Refusé';
  link1: string | null;
  link2: string | null;
  link3: string | null;
  file1_url: string | null;
  file2_url: string | null;
  file3_url: string | null;
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
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!studentData) return;

      const { data } = await supabase
        .from('submissions')
        .select(`
          id,
          submitted_at,
          status,
          link1,
          link2,
          link3,
          file1_url,
          file2_url,
          file3_url,
          description,
          grade,
          feedback,
          projects (code, title),
          classes (code)
        `)
        .eq('student_id', studentData.id)
        .order('submitted_at', { ascending: false });

      const mapped = data?.map((s: any) => ({
        ...s,
        project_code: s.projects?.code,
        project_title: s.projects?.title,
        class_code: s.classes?.code
      })) || [];

      setSubmissions(mapped);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (filePath: string) => {
    try {
      const fileName = filePath.split('/').pop() || 'file';
      
      // Check if it's a full URL or a storage path
      if (filePath.startsWith('http')) {
        // It's a full URL - fetch directly
        const response = await fetch(filePath);
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
      } else {
        // It's a storage path - use Supabase storage
        const { data, error } = await supabase.storage
          .from('submissions')
          .download(filePath);
        
        if (error) {
          console.error('Storage download error:', error);
          throw error;
        }
        
        const blob = new Blob([data]);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
      }
      
      toast.success('Téléchargement réussi');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error('Erreur: ' + (error.message || 'Téléchargement impossible'));
    }
  };

  if (loading || authLoading) return <LoadingScreen />;

  return (
    <StudentDashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Mes Soumissions</h1>
          <p className="text-muted-foreground">Historique de vos soumissions</p>
        </div>

        <div className="grid gap-6">
          {submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucune soumission</h3>
              <p className="text-muted-foreground">Vous n'avez pas encore soumis de projet</p>
            </div>
          ) : (
            submissions.map((sub) => (
              <div key={sub.id} className="premium-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Badge variant="outline" className="mb-2">{sub.project_code}</Badge>
                    <h3 className="text-xl font-bold mb-1">{sub.project_title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(sub.submitted_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <StatusBadge status={sub.status} />
                </div>

                {sub.description && (
                  <p className="text-sm text-muted-foreground mb-4">{sub.description}</p>
                )}

                <div className="grid gap-2">
                  {[sub.link1, sub.link2, sub.link3].filter(Boolean).map((link, idx) => (
                    <a key={idx} href={link!} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      Lien {idx + 1}
                    </a>
                  ))}

                  {[sub.file1_url, sub.file2_url, sub.file3_url].filter(Boolean).map((file, idx) => (
                    <button key={idx} onClick={() => downloadFile(file!)} className="text-sm text-primary hover:underline flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Fichier {idx + 1}
                    </button>
                  ))}
                </div>

                {sub.grade !== null && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm font-semibold">Note: {sub.grade}/20</p>
                    {sub.feedback && <p className="text-sm text-muted-foreground mt-2">{sub.feedback}</p>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </StudentDashboardLayout>
  );
}
