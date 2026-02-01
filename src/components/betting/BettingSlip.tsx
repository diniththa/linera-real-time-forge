import { useState } from 'react';
import { X, Trash2, Receipt, Zap, Loader2 } from 'lucide-react';
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
import { usePlaceBet } from '@/lib/linera';
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
  const placeBetMutation = usePlaceBet();
  const [isPlacing, setIsPlacing] = useState(false);

  const handlePlaceBets = async () => {
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

    setIsPlacing(true);

    try {
      // Check if we're using mock markets (mock IDs start with "market-" or "opt-")
      const hasMockMarkets = selections.some(s => 
        s.market.id.startsWith('market-') || s.option.id.startsWith('opt-')
      );

      if (hasMockMarkets) {
        // Demo mode - markets don't exist on-chain yet
        toast({
          title: "Demo Mode",
          description: "These are demo markets. Real on-chain markets coming soon! Your wallet balance won't be affected.",
          variant: "default",
        });
        
        // Simulate success for demo
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast({
          title: "Demo prediction recorded!",
          description: `${selections.length} prediction${selections.length > 1 ? 's' : ''} placed in demo mode.`,
        });
        
        clearSelections();
        closeSlip();
        return;
      }

      // Real on-chain bet placement
      const results: { success: boolean; marketId: string; error?: string }[] = [];
      
      for (const selection of selections) {
        try {
          await placeBetMutation.mutateAsync({
            marketId: selection.market.id,
            optionId: parseInt(selection.option.id, 10),
            amount: selection.amount,
          });
          results.push({ success: true, marketId: selection.market.id });
        } catch (error) {
          console.error('Bet placement error:', error);
          results.push({ 
            success: false, 
            marketId: selection.market.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        toast({
          title: `${successCount} prediction${successCount > 1 ? 's' : ''} placed!`,
          description: `Total stake: ${totalStake} LPT`,
        });
      }

      if (failCount > 0) {
        const errorMsg = results.find(r => !r.success)?.error || 'Market may not exist on-chain';
        toast({
          title: `${failCount} prediction${failCount > 1 ? 's' : ''} failed`,
          description: errorMsg,
          variant: "destructive",
        });
      }

      // Clear successful bets
      if (successCount === selections.length) {
        clearSelections();
        closeSlip();
      }
    } catch (error) {
      console.error('Failed to place bets:', error);
      toast({
        title: "Failed to place predictions",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsPlacing(false);
    }
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
              disabled={isPlacing || placeBetMutation.isPending}
              className={cn(
                "w-full font-display font-bold uppercase tracking-wide",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "glow-primary h-12 text-lg"
              )}
            >
              {isPlacing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Placing Bets...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  Place {selections.length} Bet{selections.length > 1 ? 's' : ''}
                </>
              )}
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
