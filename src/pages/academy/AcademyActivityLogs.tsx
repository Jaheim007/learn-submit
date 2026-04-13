import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Search, Filter, Download, Clock } from 'lucide-react';

const ACTION_LABELS: Record<string, string> = {
  submission_created: '📝 Nouvelle soumission',
  submission_status_changed: '✅ Statut modifié',
  student_registered: '👤 Nouvel étudiant',
  student_status_changed: '🔄 Statut étudiant modifié',
  project_created: '📁 Nouveau projet',
};

const ENTITY_LABELS: Record<string, string> = {
  submission: 'Soumission',
  student: 'Étudiant',
  project: 'Projet',
};

export default function AcademyActivityLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  useEffect(() => { loadLogs(); }, [entityFilter, page]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter);
      }

      const { data } = await query;
      setLogs(data || []);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (log.user_name || '').toLowerCase().includes(s) ||
      (log.action || '').toLowerCase().includes(s) ||
      JSON.stringify(log.details || {}).toLowerCase().includes(s)
    );
  });

  const exportLogs = () => {
    const BOM = '\uFEFF';
    const headers = ['Date', 'Action', 'Utilisateur', 'Type', 'Détails'];
    const rows = filteredLogs.map(log => [
      new Date(log.created_at).toLocaleString('fr-FR'),
      ACTION_LABELS[log.action] || log.action,
      log.user_name || 'Système',
      ENTITY_LABELS[log.entity_type] || log.entity_type,
      JSON.stringify(log.details || {}),
    ]);
    const csv = BOM + [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `journal_activite_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Journal d'activité</h1>
          <p className="text-muted-foreground mt-1">Historique complet des actions sur la plateforme</p>
        </div>
        <Button onClick={exportLogs} variant="outline" className="self-start">
          <Download className="h-4 w-4 mr-2" /> Exporter CSV
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={entityFilter} onValueChange={v => { setEntityFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrer par type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="submission">Soumissions</SelectItem>
            <SelectItem value="student">Étudiants</SelectItem>
            <SelectItem value="project">Projets</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Événements ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">Aucune activité trouvée</p>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map(log => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{ACTION_LABELS[log.action] || log.action}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {ENTITY_LABELS[log.entity_type] || log.entity_type}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {log.user_name || 'Système'}
                      {log.details?.project && ` — Projet: ${log.details.project}`}
                      {log.details?.class && ` | Classe: ${log.details.class}`}
                      {log.details?.student && ` | Étudiant: ${log.details.student}`}
                      {log.details?.old_status && ` | ${log.details.old_status} → ${log.details.new_status}`}
                      {log.details?.grade != null && ` | Note: ${log.details.grade}/20`}
                      {log.details?.email && ` | ${log.details.email}`}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-border/50">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
              Précédent
            </Button>
            <span className="text-xs text-muted-foreground">Page {page + 1}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={logs.length < PAGE_SIZE}>
              Suivant
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
