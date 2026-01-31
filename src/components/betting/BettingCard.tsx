import { useState, useEffect } from 'react';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { Market, MarketOption } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BettingCardProps {
  market: Market;
  onPlaceBet: (marketId: string, optionId: string, amount: number) => void;
}

export function BettingCard({ market, onPlaceBet }: BettingCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, market.closesAt.getTime() - now);
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [market.closesAt]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isUrgent = timeLeft < 30000; // Less than 30 seconds
  const isClosed = timeLeft === 0 || market.status !== 'open';

  const getOddsChange = (option: MarketOption) => {
    if (!option.previousOdds) return null;
    const diff = option.odds - option.previousOdds;
    if (Math.abs(diff) < 0.01) return null;
    return diff > 0 ? 'up' : 'down';
  };

  return (
    <div className={cn(
      'rounded-xl border bg-card p-4 transition-all',
      isClosed ? 'opacity-60 border-border' : 'border-primary/30'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">
            {market.title}
          </h3>
          <p className="text-sm text-muted-foreground">{market.description}</p>
        </div>
        
        {/* Timer */}
        <div className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-display font-bold',
          isClosed 
            ? 'bg-muted text-muted-foreground' 
            : isUrgent 
              ? 'bg-destructive/20 text-destructive countdown-urgent'
              : 'bg-primary/20 text-primary'
        )}>
          <Clock className="h-4 w-4" />
          <span>{isClosed ? 'CLOSED' : formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {market.options.map((option) => {
          const oddsChange = getOddsChange(option);
          const isSelected = selectedOption === option.id;

          return (
            <button
              key={option.id}
              onClick={() => !isClosed && setSelectedOption(option.id)}
              disabled={isClosed}
              className={cn(
                'relative p-4 rounded-lg border-2 transition-all text-left',
                isClosed
                  ? 'border-border bg-muted cursor-not-allowed'
                  : isSelected
                    ? 'border-primary bg-primary/10 glow-primary'
                    : 'border-border bg-muted/50 hover:border-primary/50'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-display font-bold text-foreground">
                  {option.label}
                </span>
                {oddsChange && (
                  <span className={cn(
                    'flex items-center text-xs',
                    oddsChange === 'up' ? 'text-success' : 'text-destructive'
                  )}>
                    {oddsChange === 'up' 
                      ? <TrendingUp className="h-3 w-3" />
                      : <TrendingDown className="h-3 w-3" />
                    }
                  </span>
                )}
              </div>
              
              <div className={cn(
                'font-display text-2xl font-black',
                isSelected ? 'text-primary' : 'text-foreground'
              )}>
                {option.odds.toFixed(2)}x
              </div>
              
              <div className="text-xs text-muted-foreground mt-1">
                Pool: {option.poolAmount.toLocaleString()} LPT
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 h-3 w-3 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Total Pool */}
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
        <span>Total Pool</span>
        <span className="font-semibold text-foreground">
          {market.totalPool.toLocaleString()} LPT
        </span>
      </div>

      {/* Place Bet Button */}
      <div className="flex gap-2">
        {[10, 25, 50, 100].map((amount) => (
          <Button
            key={amount}
            variant="outline"
            size="sm"
            disabled={!selectedOption || isClosed}
            onClick={() => selectedOption && onPlaceBet(market.id, selectedOption, amount)}
            className="flex-1 font-body font-semibold"
          >
            {amount}
          </Button>
        ))}
      </div>

      {selectedOption && !isClosed && (
        <Button
          className="w-full mt-3 font-display font-bold uppercase tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
          onClick={() => onPlaceBet(market.id, selectedOption, 100)}
        >
          Place Bet
        </Button>
      )}
    </div>
  );
}
