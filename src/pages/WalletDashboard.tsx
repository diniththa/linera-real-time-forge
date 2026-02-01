import { Link } from 'react-router-dom';
import { Wallet, History, TrendingUp, Target, Download, ExternalLink, Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { useUserBets } from '@/lib/linera/hooks';
import { CheCkoInstallModal } from '@/components/wallet/CheCkoInstallModal';
import { cn } from '@/lib/utils';

const LINERA_FAUCET_URL = 'https://faucet.testnet-conway.linera.net';

export default function WalletDashboard() {
  const { wallet, connect, isConnecting, isCheCkoAvailable, showInstallGuide, setShowInstallGuide, error } = useWallet();
  const { data: userBets, isLoading: betsLoading } = useUserBets();

  const handleConnect = () => {
    if (!isCheCkoAvailable) {
      setShowInstallGuide(true);
    } else {
      connect();
    }
  };

  // Calculate real stats from user bets
  const stats = userBets ? {
    totalBets: userBets.length,
    wonBets: userBets.filter(b => b.settled && b.payout && parseFloat(b.payout) > 0).length,
    lostBets: userBets.filter(b => b.settled && (!b.payout || parseFloat(b.payout) === 0)).length,
    totalWagered: userBets.reduce((sum, b) => sum + parseFloat(b.amount), 0),
    totalWon: userBets.reduce((sum, b) => sum + parseFloat(b.payout || '0'), 0),
  } : null;

  const winRate = stats && stats.totalBets > 0 
    ? ((stats.wonBets / stats.totalBets) * 100).toFixed(1) 
    : '0';
  
  const profitLoss = stats ? stats.totalWon - stats.totalWagered : 0;

  if (!wallet.connected) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center py-8">
          <div className="text-center max-w-md">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Wallet className="h-10 w-10 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-2">
              {isCheCkoAvailable ? 'Connect Your Wallet' : 'Install CheCko Wallet'}
            </h1>
            <p className="text-muted-foreground mb-6">
              {isCheCkoAvailable 
                ? 'Connect your CheCko wallet to view your balance, prediction history, and statistics on the Linera blockchain.'
                : 'CheCko is a browser wallet for Linera blockchain. Install it to start making predictions.'
              }
            </p>
            
            <Button
              size="lg"
              onClick={handleConnect}
              disabled={isConnecting}
              className="font-display font-bold uppercase tracking-wide bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isConnecting ? (
                'Connecting...'
              ) : !isCheCkoAvailable ? (
                <>
                  <Download className="mr-2 h-5 w-5" />
                  Install CheCko Wallet
                </>
              ) : (
                'Connect CheCko'
              )}
            </Button>
            
            {error && (
              <p className="mt-4 text-sm text-destructive">{error}</p>
            )}
            
            {!isCheCkoAvailable && (
              <a 
                href="https://github.com/respeer-ai/linera-wallet"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-4 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Learn more about CheCko
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
        <CheCkoInstallModal open={showInstallGuide} onOpenChange={setShowInstallGuide} />
      </>
    );
  }

  const hasNoBalance = wallet.balance.available === 0;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Wallet Dashboard
          </h1>
          <p className="text-muted-foreground font-mono">
            {wallet.address}
          </p>
        </div>

        {/* Balance Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Available Balance */}
          <div className="bg-card border border-primary/30 rounded-xl p-6 glow-primary">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Available Balance</span>
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <p className="font-display text-4xl font-black text-primary">
              {wallet.balance.available.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">TLINERA (LPT)</p>
          </div>

          {/* Locked in Bets */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Locked in Predictions</span>
              <Target className="h-5 w-5 text-warning" />
            </div>
            <p className="font-display text-4xl font-black text-warning">
              {wallet.balance.locked.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">TLINERA (LPT)</p>
          </div>

          {/* Total Profit/Loss */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Total Profit/Loss</span>
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <p className={cn(
              'font-display text-4xl font-black',
              profitLoss >= 0 ? 'text-success' : 'text-destructive'
            )}>
              {profitLoss >= 0 ? '+' : ''}{profitLoss.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">TLINERA (LPT)</p>
          </div>
        </div>

        {/* No Balance Warning */}
        {hasNoBalance && (
          <div className="mb-8 p-4 rounded-xl border border-warning/30 bg-warning/5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/20 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">No TLINERA Balance</p>
                <p className="text-xs text-muted-foreground">
                  Get free testnet tokens from the Linera faucet to start making predictions.
                </p>
              </div>
              <Button asChild className="font-body font-semibold bg-warning text-warning-foreground hover:bg-warning/90">
                <a href={LINERA_FAUCET_URL} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Get Tokens
                </a>
              </Button>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Stats */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-display text-lg font-bold mb-6">Your Statistics</h2>
              
              {betsLoading ? (
                <p className="text-muted-foreground text-sm">Loading stats...</p>
              ) : stats && stats.totalBets > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Total Predictions</span>
                    <span className="font-bold">{stats.totalBets}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Won</span>
                    <span className="font-bold text-success">{stats.wonBets}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Lost</span>
                    <span className="font-bold text-destructive">{stats.lostBets}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Win Rate</span>
                    <span className="font-bold text-primary">{winRate}%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Total Wagered</span>
                    <span className="font-bold">{stats.totalWagered.toLocaleString()} LPT</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Total Won</span>
                    <span className="font-bold text-success">{stats.totalWon.toLocaleString()} LPT</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No predictions yet</p>
                  <Button asChild variant="link" className="mt-2 text-primary">
                    <Link to="/matches">
                      <Zap className="mr-1 h-4 w-4" />
                      Start Predicting
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Transaction History */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg font-bold">Recent Activity</h2>
                {userBets && userBets.length > 0 && (
                  <Button variant="ghost" size="sm" className="text-primary">
                    <History className="mr-2 h-4 w-4" />
                    View All
                  </Button>
                )}
              </div>

              {betsLoading ? (
                <p className="text-muted-foreground text-sm">Loading activity...</p>
              ) : userBets && userBets.length > 0 ? (
                <div className="space-y-4">
                  {userBets.slice(0, 10).map((bet) => {
                    const payoutNum = parseFloat(bet.payout || '0');
                    const amountNum = parseFloat(bet.amount);
                    const isWin = bet.settled && payoutNum > 0;
                    
                    return (
                      <div
                        key={bet.id}
                        className="flex items-center justify-between py-3 border-b border-border last:border-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            'h-10 w-10 rounded-lg flex items-center justify-center',
                            isWin ? 'bg-success/10' : 'bg-muted'
                          )}>
                            {isWin ? (
                              <TrendingUp className="h-5 w-5 text-success" />
                            ) : (
                              <Target className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">
                              {bet.settled 
                                ? isWin 
                                  ? `Won: Market #${bet.marketId}` 
                                  : `Lost: Market #${bet.marketId}`
                                : `Predicted: Market #${bet.marketId}`
                              }
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Option {bet.optionId} @ {(bet.odds / 1000).toFixed(2)}x
                            </p>
                          </div>
                        </div>
                        <span className={cn(
                          'font-display font-bold',
                          isWin ? 'text-success' : 'text-muted-foreground'
                        )}>
                          {isWin 
                            ? `+${payoutNum.toLocaleString()}` 
                            : `-${amountNum.toLocaleString()}`
                          } LPT
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm mb-2">No activity yet</p>
                  <p className="text-xs text-muted-foreground">
                    Your prediction history will appear here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
