import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RichTextRenderer } from '@/components/ui/rich-text-editor';
import { supabase } from '@/integrations/supabase/client';
import { Search, Eye, FileText, ExternalLink, Download } from 'lucide-react';
import { toast } from 'sonner';
import { RefreshHeader } from '@/components/admin/RefreshHeader';

interface Submission {
  id: string;
  submitted_at: string;
  status: string;
  grade?: number;
  feedback?: string;
  version: number;
  links: string[];
  files: string[];
  description?: string;
  student: { id: string; full_name: string; email: string };
  project: { id: number; title: string };
  class: { id: number; code: string; title: string };
}

const reverseStatusMap: Record<string, string> = {
  received: 'Reçu',
  in_review: 'En révision',
  approved: 'Validé',
  rejected: 'Refusé',
};

const statusMap: Record<string, string> = {
  'Reçu': 'received',
  'En révision': 'in_review',
  'Validé': 'approved',
  'Refusé': 'rejected',
};

export default function AcademySubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [classes, setClasses] = useState<{ id: number; code: string; title: string }[]>([]);
  const [projects, setProjects] = useState<{ id: number; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());

  const loadData = async () => {
    try {
      let query = supabase
        .from('submissions')
        .select(`
          id, submitted_at, status, grade, feedback, version,
          link1, link2, link3, file1_url, file2_url, file3_url, file_urls, description, is_latest,
          students!inner(id, full_name, email),
          projects!inner(id, title),
          classes!inner(id, code, title)
        `, { count: 'exact' })
        .eq('is_latest', true);

      if (selectedClass !== 'all') query = query.eq('class_id', parseInt(selectedClass));
      if (selectedProject !== 'all') query = query.eq('project_id', parseInt(selectedProject));
      if (selectedStatus !== 'all') {
        const dbStatus = statusMap[selectedStatus];
        if (dbStatus) query = query.eq('status', dbStatus as any);
      }

      const [submissionsRes, classesRes, projectsRes] = await Promise.all([
        query.order('submitted_at', { ascending: false }).limit(200),
        supabase.from('classes').select('id, code, title').eq('is_active', true).order('code'),
        supabase.from('projects').select('id, title').eq('is_active', true).order('title'),
      ]);

      if (classesRes.data) setClasses(classesRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);

      if (submissionsRes.data) {
        setSubmissions(submissionsRes.data.map((sub: any) => ({
          id: sub.id,
          submitted_at: sub.submitted_at,
          status: reverseStatusMap[sub.status] || sub.status,
          grade: sub.grade,
          feedback: sub.feedback,
          version: sub.version,
          links: [sub.link1, sub.link2, sub.link3].filter(Boolean),
          files: (sub.file_urls?.length > 0) ? sub.file_urls : [sub.file1_url, sub.file2_url, sub.file3_url].filter(Boolean),
          description: sub.description,
          student: sub.students,
          project: sub.projects,
          class: sub.classes,
        })));
      }
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [selectedClass, selectedProject, selectedStatus]);

  const filteredSubmissions = useMemo(() => {
    if (!searchTerm) return submissions;
    const term = searchTerm.toLowerCase();
    return submissions.filter(s =>
      s.student.full_name?.toLowerCase().includes(term) ||
      s.student.email?.toLowerCase().includes(term) ||
      s.project.title?.toLowerCase().includes(term)
    );
  }, [submissions, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Reçu': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200';
      case 'En révision': return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200';
      case 'Validé': return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200';
      case 'Refusé': return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200';
      default: return '';
    }
  };

  const downloadFile = async (filePath: string, submissionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('download-submission-file', {
        body: { submissionId, filePath }
      });
      if (error || !data?.signedUrl) { toast.error('Erreur téléchargement'); return; }
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = data.fileName || filePath.split('/').pop() || 'file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch { toast.error('Erreur téléchargement'); }
  };

  if (loading) {
    return <div className="space-y-6"><div className="animate-pulse"><div className="h-8 bg-muted rounded w-1/4 mb-4" /><div className="h-64 bg-muted rounded" /></div></div>;
  }

  return (
    <div className="space-y-5">
      <RefreshHeader lastRefreshTime={lastRefreshTime} onRefresh={loadData} />

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Soumissions</h1>
        <p className="text-sm text-muted-foreground">Consultation des soumissions étudiantes (lecture seule)</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger><SelectValue placeholder="Classe" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les classes</SelectItem>
            {classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.code}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger><SelectValue placeholder="Projet" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les projets</SelectItem>
            {projects.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="Reçu">Reçu</SelectItem>
            <SelectItem value="En révision">En révision</SelectItem>
            <SelectItem value="Validé">Validé</SelectItem>
            <SelectItem value="Refusé">Refusé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Étudiant</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Projet</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Détails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucune soumission trouvée</TableCell>
                  </TableRow>
                ) : filteredSubmissions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.student.full_name || sub.student.email}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{sub.class.code}</Badge></TableCell>
                    <TableCell className="max-w-[200px] truncate">{sub.project.title}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(sub.submitted_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </TableCell>
                    <TableCell><Badge className={getStatusColor(sub.status)}>{sub.status}</Badge></TableCell>
                    <TableCell>{sub.grade != null ? `${sub.grade}/20` : '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedSubmission(sub)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Read-only detail modal */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la soumission</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><Label className="text-muted-foreground">Étudiant</Label><p className="font-medium">{selectedSubmission.student.full_name}</p></div>
                <div><Label className="text-muted-foreground">Email</Label><p>{selectedSubmission.student.email}</p></div>
                <div><Label className="text-muted-foreground">Classe</Label><p>{selectedSubmission.class.code} — {selectedSubmission.class.title}</p></div>
                <div><Label className="text-muted-foreground">Projet</Label><p>{selectedSubmission.project.title}</p></div>
                <div><Label className="text-muted-foreground">Statut</Label><Badge className={getStatusColor(selectedSubmission.status)}>{selectedSubmission.status}</Badge></div>
                <div><Label className="text-muted-foreground">Note</Label><p>{selectedSubmission.grade != null ? `${selectedSubmission.grade}/20` : 'Non noté'}</p></div>
              </div>

              {selectedSubmission.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <div className="p-3 bg-muted/50 rounded-lg border text-sm mt-1">
                    <RichTextRenderer content={selectedSubmission.description} />
                  </div>
                </div>
              )}

              {selectedSubmission.feedback && (
                <div>
                  <Label className="text-muted-foreground">Feedback</Label>
                  <div className="p-3 bg-muted/50 rounded-lg border text-sm mt-1">
                    <RichTextRenderer content={selectedSubmission.feedback} />
                  </div>
                </div>
              )}

              {selectedSubmission.links.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Liens</Label>
                  <div className="space-y-2 mt-1">
                    {selectedSubmission.links.map((link, i) => (
                      <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-muted/40 rounded border hover:bg-muted/70 text-sm text-primary">
                        <ExternalLink className="h-3.5 w-3.5" />{link}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedSubmission.files.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Fichiers</Label>
                  <div className="space-y-2 mt-1">
                    {selectedSubmission.files.map((file, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-muted/40 rounded border">
                        <span className="flex items-center gap-2 text-sm"><FileText className="h-3.5 w-3.5" />{file.split('/').pop()}</span>
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => downloadFile(file, selectedSubmission.id)}>
                          <Download className="h-3.5 w-3.5" />Télécharger
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
