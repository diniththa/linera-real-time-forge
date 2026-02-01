import { useState } from 'react';
import { ArrowDownLeft, Loader2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDeposit } from '@/lib/linera/hooks';
import { useWallet } from '@/contexts/WalletContext';

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DepositModal({ open, onOpenChange }: DepositModalProps) {
  const [amount, setAmount] = useState('');
  const { wallet } = useWallet();
  const depositMutation = useDeposit();

  const handleDeposit = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    try {
      await depositMutation.mutateAsync(numAmount);
      setAmount('');
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation's onError
      console.error('Deposit failed:', error);
    }
  };

  const availableTlinera = wallet.balance.available;
  const isValidAmount = parseFloat(amount) > 0 && parseFloat(amount) <= availableTlinera;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <ArrowDownLeft className="h-5 w-5 text-primary" />
            Deposit TLINERA
          </DialogTitle>
          <DialogDescription>
            Convert your TLINERA tokens to LPT (Live-Predict Tokens) to start placing predictions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Available Balance */}
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Available TLINERA</span>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-1 font-display text-2xl font-bold text-foreground">
              {availableTlinera.toLocaleString()} TLINERA
            </p>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount to deposit</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-20"
                min={0}
                max={availableTlinera}
                step="0.01"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-sm text-muted-foreground">TLINERA</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount((availableTlinera * 0.25).toFixed(2))}
              >
                25%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount((availableTlinera * 0.5).toFixed(2))}
              >
                50%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount((availableTlinera * 0.75).toFixed(2))}
              >
                75%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(availableTlinera.toString())}
              >
                Max
              </Button>
            </div>
          </div>

          {/* Conversion Info */}
          {parseFloat(amount) > 0 && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">You will receive</span>
                <span className="font-display text-lg font-bold text-primary">
                  {parseFloat(amount).toLocaleString()} LPT
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                1 TLINERA = 1 LPT (no conversion fee)
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDeposit}
            disabled={!isValidAmount || depositMutation.isPending}
            className="bg-primary text-primary-foreground"
          >
            {depositMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Depositing...
              </>
            ) : (
              <>
                <ArrowDownLeft className="mr-2 h-4 w-4" />
                Deposit
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
