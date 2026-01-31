import { X, Trash2, Receipt, Zap } from 'lucide-react';
import { useBetting } from '@/contexts/BettingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/hooks/use-toast';

export function BettingSlip() {
  const {
    selections,
    isSlipOpen,
    totalStake,
    totalPotentialWin,
    removeSelection,
    updateAmount,
    clearSelections,
    closeSlip,
  } = useBetting();

  const { wallet } = useWallet();

  const handlePlaceBets = () => {
    if (!wallet.connected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to place bets",
        variant: "destructive",
      });
      return;
    }

    if (totalStake > wallet.balance.available) {
      toast({
        title: "Insufficient balance",
        description: `You need ${totalStake} LPT but only have ${wallet.balance.available} LPT available`,
        variant: "destructive",
      });
      return;
    }

    // TODO: Integrate with Linera contract
    toast({
      title: "Bets placed!",
      description: `${selections.length} bet(s) placed for ${totalStake} LPT`,
    });
    clearSelections();
    closeSlip();
  };

  return (
    <Sheet open={isSlipOpen} onOpenChange={(open) => !open && closeSlip()}>
      <SheetContent className="w-full sm:max-w-md bg-card border-l border-border flex flex-col">
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-display text-xl flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Betting Slip
              {selections.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-sm">
                  {selections.length}
                </span>
              )}
            </SheetTitle>
            {selections.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelections}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Selections List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {selections.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground font-display">
                No selections yet
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Click on odds to add bets to your slip
              </p>
            </div>
          ) : (
            selections.map((selection) => (
              <div
                key={selection.id}
                className="rounded-lg border border-border bg-muted/30 p-3"
              >
                {/* Market Info */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {selection.market.title}
                    </p>
                    <p className="font-display font-bold text-foreground">
                      {selection.option.label}
                    </p>
                  </div>
                  <button
                    onClick={() => removeSelection(selection.id)}
                    className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Odds & Amount */}
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <span className="font-display text-lg font-black text-primary">
                      {selection.option.odds.toFixed(2)}x
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="relative">
                      <Input
                        type="number"
                        min={1}
                        value={selection.amount}
                        onChange={(e) => updateAmount(selection.id, Math.max(1, Number(e.target.value)))}
                        className="pr-12 font-display font-bold"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        LPT
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">Win</p>
                    <p className="font-display font-bold text-success">
                      {selection.potentialWin.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Totals */}
        {selections.length > 0 && (
          <SheetFooter className="border-t border-border pt-4 flex-col gap-4">
            <div className="w-full space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Stake</span>
                <span className="font-display font-bold">{totalStake.toFixed(2)} LPT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Potential Winnings</span>
                <span className="font-display font-bold text-lg text-success">
                  {totalPotentialWin.toFixed(2)} LPT
                </span>
              </div>
            </div>

            <Button
              onClick={handlePlaceBets}
              className={cn(
                "w-full font-display font-bold uppercase tracking-wide",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "glow-primary h-12 text-lg"
              )}
            >
              <Zap className="h-5 w-5 mr-2" />
              Place {selections.length} Bet{selections.length > 1 ? 's' : ''}
            </Button>

            {!wallet.connected && (
              <p className="text-xs text-center text-muted-foreground">
                Connect your wallet to place bets
              </p>
            )}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
