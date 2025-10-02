import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Trophy, Medal } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { StatusBadge } from '@/components/StatusBadge';

interface LeaderboardEntry {
  rank: number | null;
  student_id: string;
  student_name: string;
  class_code: string;
  class_title: string;
  project_code: string;
  project_title: string;
  version: number;
  submitted_at: string;
  status: 'Reçu' | 'En révision' | 'Validé' | 'Refusé';
  grade: number | null;
  submission_id: number;
}

export default function StudentLeaderboard() {
  const { user } = useAuth();
  const [cohort, setCohort] = useState<string>('phase1');
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [lastVersionsOnly, setLastVersionsOnly] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch active projects
  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, code, title')
        .eq('is_active', true)
        .order('code');

      if (error) {
        console.error('Error fetching projects:', error);
        toast.error('Erreur lors du chargement des projets');
        return;
      }

      setProjects(data || []);
      if (data && data.length > 0) {
        setSelectedProject(data[0].id.toString());
      }
    };

    fetchProjects();
  }, []);

  // Fetch leaderboard when filters change
  useEffect(() => {
    if (!selectedProject) return;

    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-leaderboard', {
          body: {
            cohort,
            projectId: parseInt(selectedProject),
            statusFilter,
            lastVersionsOnly
          }
        });

        if (error) throw error;

        setLeaderboard(data.data || []);
      } catch (error: any) {
        console.error('Error fetching leaderboard:', error);
        toast.error('Erreur lors du chargement du classement');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [cohort, selectedProject, statusFilter, lastVersionsOnly]);

  const exportToCSV = () => {
    if (leaderboard.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    const headers = ['Rang', 'Étudiant', 'Groupe', 'Projet', 'Version', 'Soumis le', 'Statut', 'Note'];
    const rows = leaderboard.map(entry => [
      entry.rank || '—',
      entry.student_name,
      entry.class_code,
      entry.project_code,
      entry.version,
      format(new Date(entry.submitted_at), 'dd/MM/yyyy HH:mm'),
      entry.status,
      entry.grade !== null ? entry.grade : '—'
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leaderboard-${cohort}-${selectedProject}-${Date.now()}.csv`;
    link.click();

    toast.success('Export CSV réussi');
  };

  const cohortLabels: Record<string, string> = {
    phase1: 'Phase 1 (G1-G5)',
    phase2: 'Phase 2 (G6-G12)',
    advanced: 'Advanced Hacking'
  };

  const getRankIcon = (rank: number | null) => {
    if (!rank) return null;
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return null;
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Classement</h1>
          <p className="text-muted-foreground">
            Comparez vos performances par projet et par cohorte
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtres</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Cohorte</Label>
                <Select value={cohort} onValueChange={setCohort}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phase1">Phase 1 (G1-G5)</SelectItem>
                    <SelectItem value="phase2">Phase 2 (G6-G12)</SelectItem>
                    <SelectItem value="advanced">Advanced Hacking</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Projet</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un projet" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.code} - {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="Reçu">Reçu</SelectItem>
                    <SelectItem value="En révision">En révision</SelectItem>
                    <SelectItem value="Validé">Validé</SelectItem>
                    <SelectItem value="Refusé">Refusé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="lastVersions"
                checked={lastVersionsOnly}
                onCheckedChange={(checked) => setLastVersionsOnly(checked as boolean)}
              />
              <Label htmlFor="lastVersions" className="cursor-pointer">
                Dernières versions uniquement
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Résultats</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {leaderboard.length} étudiant{leaderboard.length !== 1 ? 's' : ''} • {cohortLabels[cohort]}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={leaderboard.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement du classement...
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune soumission trouvée pour ce filtre.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Rang</TableHead>
                      <TableHead>Étudiant</TableHead>
                      <TableHead>Groupe</TableHead>
                      <TableHead>Projet</TableHead>
                      <TableHead className="w-24">Version</TableHead>
                      <TableHead>Soumis le</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="w-24">Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((entry, index) => (
                      <TableRow key={`${entry.submission_id}-${index}`}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {getRankIcon(entry.rank)}
                            {entry.rank || '—'}
                          </div>
                        </TableCell>
                        <TableCell>{entry.student_name}</TableCell>
                        <TableCell>{entry.class_code}</TableCell>
                        <TableCell>{entry.project_code}</TableCell>
                        <TableCell>v{entry.version}</TableCell>
                        <TableCell>
                          {format(new Date(entry.submitted_at), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={entry.status} />
                        </TableCell>
                        <TableCell>
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
    </Layout>
  );
}
