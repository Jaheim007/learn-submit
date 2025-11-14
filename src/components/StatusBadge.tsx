import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'Reçu' | 'En révision' | 'Validé' | 'Refusé' | 'received' | 'in_review' | 'approved' | 'rejected';
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  // Map English status to French
  const statusMap: Record<string, 'Reçu' | 'En révision' | 'Validé' | 'Refusé'> = {
    'received': 'Reçu',
    'in_review': 'En révision',
    'approved': 'Validé',
    'rejected': 'Refusé',
    'Reçu': 'Reçu',
    'En révision': 'En révision',
    'Validé': 'Validé',
    'Refusé': 'Refusé'
  };

  const frenchStatus = statusMap[status] || status;

  const variants: Record<string, string> = {
    'Reçu': 'badge-received',
    'En révision': 'badge-reviewing', 
    'Validé': 'badge-validated',
    'Refusé': 'badge-rejected'
  };

  return (
    <span className={cn('badge-status', variants[frenchStatus], className)}>
      {frenchStatus}
    </span>
  );
}