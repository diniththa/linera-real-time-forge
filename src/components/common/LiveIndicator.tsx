import { cn } from '@/lib/utils';

interface LiveIndicatorProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LiveIndicator({ className, size = 'md' }: LiveIndicatorProps) {
  const sizeClasses = {
    sm: 'h-1.5 w-1.5 text-[10px]',
    md: 'h-2 w-2 text-xs',
    lg: 'h-2.5 w-2.5 text-sm',
  };

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span className={cn(
        'rounded-full bg-destructive animate-pulse',
        sizeClasses[size].split(' ').slice(0, 2).join(' ')
      )} />
      <span className={cn(
        'font-bold uppercase text-destructive',
        sizeClasses[size].split(' ').slice(2).join(' ')
      )}>
        LIVE
      </span>
    </div>
  );
}
