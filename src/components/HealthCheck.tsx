import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Check, X, Loader2, Activity } from 'lucide-react';

interface HealthStatus {
  database: 'ok' | 'error' | 'checking';
  auth: 'ok' | 'error' | 'checking';
  storage: 'ok' | 'error' | 'checking';
}

export function HealthCheck() {
  const [health, setHealth] = useState<HealthStatus>({
    database: 'checking',
    auth: 'checking',
    storage: 'checking'
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = async () => {
    setIsChecking(true);
    setHealth({
      database: 'checking',
      auth: 'checking',
      storage: 'checking'
    });

    // Check database
    try {
      const { error } = await supabase.from('students').select('count').limit(1);
      setHealth(prev => ({ ...prev, database: error ? 'error' : 'ok' }));
    } catch {
      setHealth(prev => ({ ...prev, database: 'error' }));
    }

    // Check auth
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setHealth(prev => ({ ...prev, auth: session ? 'ok' : 'error' }));
    } catch {
      setHealth(prev => ({ ...prev, auth: 'error' }));
    }

    // Check storage
    try {
      const { data, error } = await supabase.storage.from('submissions').list('', { limit: 1 });
      setHealth(prev => ({ ...prev, storage: error ? 'error' : 'ok' }));
    } catch {
      setHealth(prev => ({ ...prev, storage: 'error' }));
    }

    setIsChecking(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'error':
        return <X className="w-4 h-4 text-red-600" />;
      case 'checking':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ok':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Opérationnel</Badge>;
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>;
      case 'checking':
        return <Badge variant="secondary">Vérification...</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          État du système
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(health.database)}
              <span className="text-sm font-medium">Base de données</span>
            </div>
            {getStatusBadge(health.database)}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(health.auth)}
              <span className="text-sm font-medium">Authentification</span>
            </div>
            {getStatusBadge(health.auth)}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(health.storage)}
              <span className="text-sm font-medium">Stockage de fichiers</span>
            </div>
            {getStatusBadge(health.storage)}
          </div>
        </div>

        <Button 
          onClick={checkHealth} 
          disabled={isChecking} 
          variant="outline" 
          size="sm"
          className="w-full"
        >
          {isChecking ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Vérification en cours...
            </>
          ) : (
            <>
              <Activity className="w-4 h-4 mr-2" />
              Vérifier l'état
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}