import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

interface DeadlineCountdownProps {
  deadline: string;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function DeadlineCountdown({ deadline, className }: DeadlineCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(deadline).getTime() - new Date().getTime();

      if (difference <= 0) {
        setIsExpired(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  if (isExpired) {
    return (
      <Card className={`bg-destructive/10 border-destructive p-6 ${className}`}>
        <div className="text-center">
          <p className="text-destructive font-semibold text-lg">Délai expiré</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/20 p-6 ${className}`}>
      <div className="text-center mb-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Temps restant
        </h3>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center">
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 border border-border shadow-sm">
            <div className="text-3xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
              {timeLeft.days}
            </div>
            <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">
              Jours
            </div>
          </div>
        </div>
        <div className="text-center">
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 border border-border shadow-sm">
            <div className="text-3xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
              {timeLeft.hours}
            </div>
            <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">
              Heures
            </div>
          </div>
        </div>
        <div className="text-center">
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 border border-border shadow-sm">
            <div className="text-3xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
              {timeLeft.minutes}
            </div>
            <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">
              Minutes
            </div>
          </div>
        </div>
        <div className="text-center">
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 border border-border shadow-sm">
            <div className="text-3xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
              {timeLeft.seconds}
            </div>
            <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">
              Secondes
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
