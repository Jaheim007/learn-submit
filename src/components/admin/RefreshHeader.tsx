import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RefreshHeaderProps {
  lastRefreshTime: Date;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function RefreshHeader({ lastRefreshTime, onRefresh, isRefreshing = false }: RefreshHeaderProps) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <span>
        Dernière mise à jour : {formatDistanceToNow(lastRefreshTime, { 
          addSuffix: true, 
          locale: fr 
        })}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="flex items-center gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        Actualiser
      </Button>
    </div>
  );
}
