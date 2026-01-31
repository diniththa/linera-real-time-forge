import { Trophy, TrendingUp, Target, Medal } from 'lucide-react';
import { mockLeaderboard } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function Leaderboard() {
  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/50';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/50';
      case 3:
        return 'bg-gradient-to-r from-orange-600/20 to-orange-700/10 border-orange-600/50';
      default:
        return 'bg-card border-border';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-orange-600" />;
      default:
        return <span className="font-display text-lg font-bold text-muted-foreground">{rank}</span>;
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Top Predictors</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Leaderboard
          </h1>
          <p className="text-muted-foreground">
            The best predictors on LivePredict. Updated in real-time.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <p className="font-display text-2xl font-bold text-primary">
              {mockLeaderboard.reduce((acc, e) => acc + e.profit, 0).toLocaleString()} LPT
            </p>
            <p className="text-sm text-muted-foreground">Total Profits (Top 10)</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-3">
              <Target className="h-6 w-6 text-success" />
            </div>
            <p className="font-display text-2xl font-bold text-success">
              {(mockLeaderboard.reduce((acc, e) => acc + e.winRate, 0) / mockLeaderboard.length).toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground">Average Win Rate</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center mx-auto mb-3">
              <Trophy className="h-6 w-6 text-secondary" />
            </div>
            <p className="font-display text-2xl font-bold text-secondary">
              {mockLeaderboard.reduce((acc, e) => acc + e.totalBets, 0).toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Total Predictions</p>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-muted/50 border-b border-border text-sm font-semibold text-muted-foreground">
            <div className="col-span-1">Rank</div>
            <div className="col-span-5">Predictor</div>
            <div className="col-span-2 text-right">Profit</div>
            <div className="col-span-2 text-right">Win Rate</div>
            <div className="col-span-2 text-right">Predictions</div>
          </div>

          {/* Rows */}
          {mockLeaderboard.map((entry) => (
            <div
              key={entry.rank}
              className={cn(
                'grid grid-cols-12 gap-4 px-6 py-4 border-b border-border last:border-0 items-center transition-colors hover:bg-muted/30',
                getRankStyle(entry.rank)
              )}
            >
              {/* Rank */}
              <div className="col-span-1 flex items-center justify-center">
                {getRankIcon(entry.rank)}
              </div>

              {/* User */}
              <div className="col-span-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <span className="font-display text-sm font-bold text-primary-foreground">
                      {(entry.displayName || entry.address)[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">
                      {entry.displayName || 'Anonymous'}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {entry.address}
                    </p>
                  </div>
                </div>
              </div>

              {/* Profit */}
              <div className="col-span-2 text-right">
                <span className={cn(
                  'font-display font-bold',
                  entry.profit > 0 ? 'text-success' : 'text-destructive'
                )}>
                  {entry.profit > 0 ? '+' : ''}{entry.profit.toLocaleString()} LPT
                </span>
              </div>

              {/* Win Rate */}
              <div className="col-span-2 text-right">
                <span className="font-semibold">{entry.winRate.toFixed(1)}%</span>
              </div>

              {/* Total Bets */}
              <div className="col-span-2 text-right text-muted-foreground">
                {entry.totalBets}
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Rankings are updated in real-time based on profit/loss performance.
          Only users with at least 50 predictions are eligible.
        </p>
      </div>
    </div>
  );
}
