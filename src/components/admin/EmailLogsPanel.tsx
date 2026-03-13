import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RefreshCcw, MailCheck, MailX, Inbox } from 'lucide-react';

interface EmailLog {
  id: string;
  recipient_email: string;
  email_type: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

const statusOptions = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'success', label: 'Succès' },
  { value: 'failed', label: 'Échecs' },
];

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' {
  if (status === 'success') return 'default';
  if (status === 'failed') return 'destructive';
  return 'secondary';
}

export default function EmailLogsPanel() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const loadLogs = async () => {
    setLoading(true);

    let query = supabase
      .from('email_send_logs')
      .select('id, recipient_email, email_type, status, error_message, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading email logs:', error);
    }

    setLogs(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, [statusFilter]);

  const summary = useMemo(() => {
    const success = logs.filter((log) => log.status === 'success').length;
    const failed = logs.filter((log) => log.status === 'failed').length;

    return {
      total: logs.length,
      success,
      failed,
    };
  }, [logs]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Historique des emails</h3>
          <p className="text-sm text-muted-foreground">Suivi des envois manuels, automatiques et connexions par email</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrer" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
            Actualiser
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 flex items-center gap-2">
            <Inbox className="h-4 w-4 text-muted-foreground" />
            <span className="text-2xl font-bold text-foreground">{summary.total}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Succès</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 flex items-center gap-2">
            <MailCheck className="h-4 w-4 text-muted-foreground" />
            <span className="text-2xl font-bold text-foreground">{summary.success}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Échecs</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 flex items-center gap-2">
            <MailX className="h-4 w-4 text-muted-foreground" />
            <span className="text-2xl font-bold text-foreground">{summary.failed}</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Destinataire</th>
                  <th className="text-left p-3 font-medium">Statut</th>
                  <th className="text-left p-3 font-medium">Erreur</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                      Chargement des logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      Aucun log d'email trouvé.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-border/60 align-top">
                      <td className="p-3 text-foreground whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('fr-FR')}
                      </td>
                      <td className="p-3 text-foreground whitespace-nowrap">{log.email_type}</td>
                      <td className="p-3 text-foreground">{log.recipient_email}</td>
                      <td className="p-3">
                        <Badge variant={getStatusVariant(log.status)}>{log.status}</Badge>
                      </td>
                      <td className="p-3 text-muted-foreground max-w-[260px] truncate">
                        {log.error_message || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
