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
          file_urls,
          description,
          grade,
          feedback,
          projects (code, title, image_url),
          classes (code)
        `)
        .eq('student_id', studentData.id)
        .order('submitted_at', { ascending: false });

      const mapped = data?.map((s: any) => ({
        ...s,
        project_code: s.projects?.code,
        project_title: s.projects?.title,
        project_image_url: s.projects?.image_url,
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
        // It's a storage path - create a signed URL for private bucket
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('submissions')
          .createSignedUrl(filePath, 60); // 60 seconds expiry
        
        if (signedUrlError) {
          console.error('Signed URL error:', signedUrlError);
          throw signedUrlError;
        }
        
        if (!signedUrlData?.signedUrl) {
          throw new Error('No signed URL generated');
        }
        
        // Download using the signed URL
        const response = await fetch(signedUrlData.signedUrl);
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
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

  const withProtocol = (url?: string | null) => {
    if (!url) return '';
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
  };

  if (loading || authLoading) return <LoadingScreen />;

  return (
    <StudentDashboardLayout>
      <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
        <div>
          <h1 className="text-2xl lg:text-4xl font-bold mb-1">Mes Soumissions</h1>
          <p className="text-sm text-muted-foreground">Historique de vos soumissions</p>
        </div>

        <div className="grid gap-6">
          {submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune soumission</h3>
              <p className="text-sm text-muted-foreground">Vous n'avez pas encore soumis de projet</p>
            </div>
          ) : (
            submissions.map((sub) => (
              <div key={sub.id} className="premium-card overflow-hidden">
                {/* Project Image Hero */}
                {sub.project_image_url ? (
                  <div className="relative h-32 lg:h-48 w-full overflow-hidden">
                    <img
                      src={sub.project_image_url}
                      alt={sub.project_title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <Badge variant="outline" className="bg-background/90 backdrop-blur-sm border-border/50 text-xs">
                        {sub.project_code}
                      </Badge>
                    </div>
                    <div className="absolute top-3 right-3">
                      <StatusBadge status={sub.status} />
                    </div>
                  </div>
                ) : (
                  <div className="relative h-20 lg:h-32 w-full bg-gradient-to-br from-primary/10 via-background to-accent/10">
                    <div className="absolute top-3 left-3">
                      <Badge variant="outline" className="bg-background/90 backdrop-blur-sm border-border/50 text-xs">
                        {sub.project_code}
                      </Badge>
                    </div>
                    <div className="absolute top-3 right-3">
                      <StatusBadge status={sub.status} />
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="p-4 lg:p-6">
                  <h3 className="text-base lg:text-xl font-bold mb-2">{sub.project_title}</h3>

                  <div className="flex items-center gap-2 text-xs lg:text-sm text-muted-foreground mb-3">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {new Date(sub.submitted_at).toLocaleDateString('fr-FR')} à{' '}
                      {new Date(sub.submitted_at).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  {sub.description && (
                    <p className="text-sm text-muted-foreground mb-4 pb-4 border-b border-border">
                      {sub.description}
                    </p>
                  )}

                  <div className="grid gap-2">
                    {[sub.link1, sub.link2, sub.link3].filter(Boolean).map((link, idx) => (
                      <a key={idx} href={withProtocol(link!)} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                        Lien {idx + 1}
                      </a>
                    ))}

                    {/* Show all files from file_urls array (unlimited), or fallback to legacy columns */}
                    {(sub.file_urls && sub.file_urls.length > 0
                      ? sub.file_urls
                      : [sub.file1_url, sub.file2_url, sub.file3_url].filter(Boolean) as string[]
                    ).map((file, idx) => (
                      <button key={idx} onClick={() => downloadFile(file)} className="text-sm text-primary hover:underline flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        {file.split('/').pop()?.replace(/^\d+_/, '') || `Fichier ${idx + 1}`}
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
              </div>
            ))
          )}
        </div>
      </div>
    </StudentDashboardLayout>
  );
}
