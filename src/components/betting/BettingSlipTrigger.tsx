import { Receipt } from 'lucide-react';
import { useBetting } from '@/contexts/BettingContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function BettingSlipTrigger() {
  const { selections, totalPotentialWin, openSlip } = useBetting();

  if (selections.length === 0) return null;

  return (
    <Button
      onClick={openSlip}
      className={cn(
        "fixed bottom-6 right-6 z-50",
        "h-14 px-6 rounded-full",
        "font-display font-bold uppercase tracking-wide",
        "bg-primary text-primary-foreground hover:bg-primary/90",
        "glow-primary shadow-2xl",
        "animate-fade-in"
      )}
    >
      <Receipt className="h-5 w-5 mr-2" />
      <span>{selections.length}</span>
      <span className="mx-2 h-4 w-px bg-primary-foreground/30" />
      <span>{totalPotentialWin.toFixed(0)} LPT</span>
    </Button>
  );
}
