import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  targetTime: Date;
  onComplete?: () => void;
  className?: string;
}

export function CountdownTimer({ targetTime, onComplete, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, targetTime.getTime() - now);
      setTimeLeft(remaining);

      if (remaining === 0 && onComplete) {
        onComplete();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);
    return () => clearInterval(interval);
  }, [targetTime, onComplete]);

  const formatTime = (ms: number) => {
    if (ms <= 0) return '0:00';
    
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isUrgent = timeLeft > 0 && timeLeft < 30000;
  const isExpired = timeLeft === 0;

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1.5 rounded-lg font-display font-bold',
      isExpired 
        ? 'bg-muted text-muted-foreground'
        : isUrgent 
          ? 'bg-destructive/20 text-destructive countdown-urgent'
          : 'bg-primary/20 text-primary',
      className
    )}>
      <Clock className="h-4 w-4" />
      <span>{isExpired ? 'CLOSED' : formatTime(timeLeft)}</span>
    </div>
  );
}
