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
      <Card className={`bg-gradient-to-br from-destructive/20 via-destructive/10 to-destructive/20 border-destructive/50 p-6 animate-pulse ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-bold text-destructive mb-4 uppercase tracking-wider animate-bounce">
            ⚠️ Délai Expiré ⚠️
          </h3>
          <p className="text-destructive/80 font-semibold">Le temps de soumission est écoulé</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-to-br from-success/20 via-success/10 to-success/20 border-success/50 p-6 ${className}`}>
      <div className="text-center mb-4">
        <h3 className="text-sm font-medium text-success uppercase tracking-wider">
          ⏰ Temps restant
        </h3>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          { val: timeLeft.days, label: 'Jours' },
          { val: timeLeft.hours, label: 'Heures' },
          { val: timeLeft.minutes, label: 'Minutes' },
          { val: timeLeft.seconds, label: 'Secondes' },
        ].map((unit) => (
          <div key={unit.label} className="text-center">
            <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 border border-success/30 shadow-lg shadow-success/20">
              <div className="text-3xl font-bold text-success">
                {unit.val}
              </div>
              <div className="text-xs text-success/70 mt-1 uppercase tracking-wide font-semibold">
                {unit.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
