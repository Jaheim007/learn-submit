import { AlertTriangle, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface DeadlineWarningProps {
  deadline: string;
  className?: string;
}

export const DeadlineWarning = ({ deadline, className = "" }: DeadlineWarningProps) => {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const timeUntilDeadline = deadlineDate.getTime() - now.getTime();
  const hoursUntilDeadline = timeUntilDeadline / (1000 * 60 * 60);
  
  const isOverdue = timeUntilDeadline < 0;
  const isUrgent = hoursUntilDeadline <= 24 && hoursUntilDeadline > 0;
  
  if (isOverdue) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center gap-2">
            <Badge variant="destructive">Échéance dépassée</Badge>
            <span>depuis {formatDistanceToNow(deadlineDate, { addSuffix: false })}</span>
          </div>
        </AlertDescription>
      </Alert>
    );
  }
  
  if (isUrgent) {
    return (
      <Alert variant="destructive" className={className}>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center gap-2">
            <Badge variant="destructive">Urgent</Badge>
            <span>Échéance dans {formatDistanceToNow(deadlineDate)}</span>
          </div>
        </AlertDescription>
      </Alert>
    );
  }
  
  if (hoursUntilDeadline <= 72) {
    return (
      <Alert className={className}>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Échéance proche</Badge>
            <span>Échéance dans {formatDistanceToNow(deadlineDate)}</span>
          </div>
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className={`text-sm text-muted-foreground ${className}`}>
      Échéance: {formatDistanceToNow(deadlineDate, { addSuffix: true })}
    </div>
  );
};