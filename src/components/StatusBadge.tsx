import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'Reçu' | 'En révision' | 'Validé' | 'Refusé';
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants = {
    'Reçu': 'badge-received',
    'En révision': 'badge-reviewing', 
    'Validé': 'badge-validated',
    'Refusé': 'badge-rejected'
  };

  return (
    <span className={cn('badge-status', variants[status], className)}>
      {status}
    </span>
  );
}