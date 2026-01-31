import { Link } from 'react-router-dom';
import { Wallet, ArrowUpRight, ArrowDownLeft, History, TrendingUp, Target, Trophy, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { CheCkoInstallModal } from '@/components/wallet/CheCkoInstallModal';
import { cn } from '@/lib/utils';

export default function WalletDashboard() {
  const { wallet, connect, isConnecting, isCheCkoAvailable, showInstallGuide, setShowInstallGuide, error } = useWallet();

  // Mock transaction history
  const transactions = [
    { id: '1', type: 'win', amount: 85, description: 'Won: NAVI Round 22 Winner', time: '2 min ago' },
    { id: '2', type: 'bet', amount: -50, description: 'Bet: FaZe First Blood', time: '5 min ago' },
    { id: '3', type: 'bet', amount: -25, description: 'Bet: Over 6.5 Kills', time: '8 min ago' },
    { id: '4', type: 'win', amount: 120, description: 'Won: Bomb Plant Yes', time: '15 min ago' },
    { id: '5', type: 'bet', amount: -100, description: 'Bet: G2 Map Winner', time: '1 hour ago' },
    { id: '6', type: 'deposit', amount: 500, description: 'Deposited from wallet', time: '2 hours ago' },
  ];

  // Mock stats
  const stats = {
    totalBets: 47,
    wonBets: 28,
    lostBets: 19,
    totalWagered: 2350,
    totalWon: 2890,
    winRate: 59.6,
    profitLoss: 540,
  };

  const handleConnect = () => {
    if (!isCheCkoAvailable) {
      setShowInstallGuide(true);
    } else {
      connect();
    }
  };

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
                ? 'Connect your CheCko wallet to view your balance, betting history, and statistics on the Linera blockchain.'
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
            <p className="text-sm text-muted-foreground">LPT Tokens</p>
          </div>

          {/* Locked in Bets */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Locked in Bets</span>
              <Target className="h-5 w-5 text-warning" />
            </div>
            <p className="font-display text-4xl font-black text-warning">
              {wallet.balance.locked.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">LPT Tokens</p>
          </div>

          {/* Total Profit/Loss */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Total Profit/Loss</span>
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <p className={cn(
              'font-display text-4xl font-black',
              stats.profitLoss >= 0 ? 'text-success' : 'text-destructive'
            )}>
              {stats.profitLoss >= 0 ? '+' : ''}{stats.profitLoss.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">LPT Tokens</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4 mb-8">
          <Button className="flex-1 font-body font-semibold" variant="outline">
            <ArrowDownLeft className="mr-2 h-4 w-4" />
            Deposit
          </Button>
          <Button className="flex-1 font-body font-semibold" variant="outline">
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Withdraw
          </Button>
          <Button asChild className="flex-1 font-body font-semibold bg-primary text-primary-foreground">
            <Link to="/matches">
              <Trophy className="mr-2 h-4 w-4" />
              Start Betting
            </Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Stats */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-display text-lg font-bold mb-6">Your Statistics</h2>
              
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
                  <span className="font-bold text-primary">{stats.winRate}%</span>
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
            </div>
          </div>

          {/* Transaction History */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg font-bold">Recent Activity</h2>
                <Button variant="ghost" size="sm" className="text-primary">
                  <History className="mr-2 h-4 w-4" />
                  View All
                </Button>
              </div>

              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-3 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'h-10 w-10 rounded-lg flex items-center justify-center',
                        tx.type === 'win' ? 'bg-success/10' :
                        tx.type === 'deposit' ? 'bg-primary/10' : 'bg-muted'
                      )}>
                        {tx.type === 'win' ? (
                          <TrendingUp className="h-5 w-5 text-success" />
                        ) : tx.type === 'deposit' ? (
                          <ArrowDownLeft className="h-5 w-5 text-primary" />
                        ) : (
                          <Target className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">{tx.time}</p>
                      </div>
                    </div>
                    <span className={cn(
                      'font-display font-bold',
                      tx.amount >= 0 ? 'text-success' : 'text-muted-foreground'
                    )}>
                      {tx.amount >= 0 ? '+' : ''}{tx.amount} LPT
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
