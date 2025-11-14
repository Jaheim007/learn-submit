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
      <Card className={`bg-gradient-to-br from-red-500/20 via-red-600/10 to-red-700/20 border-red-500 p-6 animate-pulse ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-bold text-red-500 mb-4 uppercase tracking-wider animate-bounce">
            ⚠️ Délai Expiré ⚠️
          </h3>
          <p className="text-red-400 font-semibold">Le temps de soumission est écoulé</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-to-br from-green-500/20 via-green-600/10 to-emerald-700/20 border-green-500/50 p-6 ${className}`}>
      <div className="text-center mb-4">
        <h3 className="text-sm font-medium text-green-600 uppercase tracking-wider">
          ⏰ Temps restant
        </h3>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center">
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 border border-green-500/30 shadow-lg shadow-green-500/20">
            <div className="text-3xl font-bold text-green-600">
              {timeLeft.days}
            </div>
            <div className="text-xs text-green-700 mt-1 uppercase tracking-wide font-semibold">
              Jours
            </div>
          </div>
        </div>
        <div className="text-center">
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 border border-green-500/30 shadow-lg shadow-green-500/20">
            <div className="text-3xl font-bold text-green-600">
              {timeLeft.hours}
            </div>
            <div className="text-xs text-green-700 mt-1 uppercase tracking-wide font-semibold">
              Heures
            </div>
          </div>
        </div>
        <div className="text-center">
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 border border-green-500/30 shadow-lg shadow-green-500/20">
            <div className="text-3xl font-bold text-green-600">
              {timeLeft.minutes}
            </div>
            <div className="text-xs text-green-700 mt-1 uppercase tracking-wide font-semibold">
              Minutes
            </div>
          </div>
        </div>
        <div className="text-center">
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 border border-green-500/30 shadow-lg shadow-green-500/20">
            <div className="text-3xl font-bold text-green-600">
              {timeLeft.seconds}
            </div>
            <div className="text-xs text-green-700 mt-1 uppercase tracking-wide font-semibold">
              Secondes
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
