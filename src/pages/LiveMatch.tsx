import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, TrendingUp, ExternalLink, Loader2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BettingCard } from '@/components/betting/BettingCard';
import { LiveIndicator } from '@/components/common/LiveIndicator';
import { useMatch } from '@/hooks/useMatches';
import { mockMarkets, gameLogos, gameNames } from '@/data/mockData';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function LiveMatch() {
  const { matchId } = useParams();
  const { wallet, connect } = useWallet();
  const { data: match, isLoading, isError } = useMatch(matchId || '');
  
  // For now, use mock markets (in production, these would come from the Linera contract)
  const markets = mockMarkets.filter((m) => m.matchId === 'match-1'); // Use demo markets

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <span className="ml-3 text-muted-foreground">Loading match...</span>
      </div>
    );
  }

  if (isError || !match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold mb-4">Match not found</h1>
          <p className="text-muted-foreground mb-4">
            This match may have ended or the ID is invalid.
          </p>
          <Button asChild variant="outline">
            <Link to="/matches">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Matches
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const handlePlaceBet = (marketId: string, optionId: string, amount: number) => {
    if (!wallet.connected) {
      connect();
      return;
    }

    const market = markets.find((m) => m.id === marketId);
    const option = market?.options.find((o) => o.id === optionId);

    if (market && option) {
      toast({
        title: 'Bet Placed!',
        description: `${amount} LPT on ${option.label} @ ${option.odds.toFixed(2)}x`,
      });
    }
  };

  const isLive = match.status === 'live';

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Button asChild variant="ghost" className="mb-6">
          <Link to="/matches">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Matches
          </Link>
        </Button>

        {/* Match Header */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          {/* Tournament & Game Info */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{gameLogos[match.game]}</span>
              <div>
                <p className="text-sm text-muted-foreground">{gameNames[match.game]}</p>
                <p className="font-semibold">{match.tournament}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isLive && <LiveIndicator size="lg" />}
              {match.id.startsWith('ps-') && (
                <span className="px-2 py-1 rounded bg-primary/20 text-primary text-xs font-semibold">
                  Real Data
                </span>
              )}
            </div>
          </div>

          {/* Team Logos */}
          <div className="flex items-center justify-center gap-8 md:gap-16 py-8">
            {/* Team A */}
            <div className="flex-1 text-center">
              {match.teamA.logo && (
                <img 
                  src={match.teamA.logo} 
                  alt={match.teamA.name}
                  className="h-16 w-16 mx-auto mb-3 object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
                {match.teamA.name}
              </h2>
              <p className="text-sm text-muted-foreground mb-3">{match.teamA.shortName}</p>
              <p className={cn(
                'font-display text-5xl md:text-7xl font-black',
                isLive && match.teamA.score > match.teamB.score ? 'text-success' : 'text-foreground'
              )}>
                {match.teamA.score}
              </p>
            </div>

            {/* Center Info */}
            <div className="flex flex-col items-center">
              {isLive ? (
                <>
                  <span className="font-display text-xl font-bold text-primary mb-2">
                    Round {match.currentRound}
                  </span>
                  <span className="px-4 py-2 rounded-lg bg-primary/10 text-primary font-semibold">
                    {match.currentMap}
                  </span>
                  <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                    <span>Map Score:</span>
                    <span className="font-semibold text-foreground">
                      {match.mapScore.teamA} - {match.mapScore.teamB}
                    </span>
                  </div>
                </>
              ) : (
                <span className="font-display text-4xl font-bold text-muted-foreground">VS</span>
              )}
            </div>

            {/* Team B */}
            <div className="flex-1 text-center">
              {match.teamB.logo && (
                <img 
                  src={match.teamB.logo} 
                  alt={match.teamB.name}
                  className="h-16 w-16 mx-auto mb-3 object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
                {match.teamB.name}
              </h2>
              <p className="text-sm text-muted-foreground mb-3">{match.teamB.shortName}</p>
              <p className={cn(
                'font-display text-5xl md:text-7xl font-black',
                isLive && match.teamB.score > match.teamA.score ? 'text-success' : 'text-foreground'
              )}>
                {match.teamB.score}
              </p>
            </div>
          </div>

          {/* Match Stats */}
          {isLive && (
            <div className="flex items-center justify-center gap-8 pt-6 border-t border-border">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Viewers:</span>
                <span className="font-semibold">{(match.viewers / 1000).toFixed(1)}K</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Betting Volume:</span>
                <span className="font-semibold text-primary">{match.bettingVolume.toLocaleString()} LPT</span>
              </div>
            </div>
          )}
        </div>

        {/* Betting Markets */}
        <div className="mb-8">
          <h2 className="font-display text-2xl font-bold mb-6">
            {isLive ? 'Live Predictions' : 'Pre-Match Predictions'}
          </h2>

          {!wallet.connected && (
            <div className="bg-muted border border-border rounded-xl p-6 mb-6 text-center">
              <p className="text-muted-foreground mb-4">
                Connect your wallet to place predictions
              </p>
              <Button onClick={connect} className="font-display font-bold uppercase">
                Connect Wallet
              </Button>
            </div>
          )}

          {markets.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {markets.map((market) => (
                <BettingCard
                  key={market.id}
                  market={market}
                  onPlaceBet={handlePlaceBet}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-xl font-bold mb-2">No Active Markets</h3>
              <p className="text-muted-foreground">
                {isLive 
                  ? 'New prediction markets will open soon' 
                  : 'Markets will open when the match goes live'
                }
              </p>
            </div>
          )}
        </div>

        {/* Recent Activity (placeholder) */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-display text-lg font-bold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { user: '0x1a2b...', action: `bet 50 LPT on ${match.teamA.shortName} to win round`, time: '2s ago' },
              { user: '0x3c4d...', action: `bet 25 LPT on First Blood: ${match.teamB.shortName}`, time: '8s ago' },
              { user: '0x5e6f...', action: 'won 85 LPT on Round prediction', time: '45s ago' },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                <div>
                  <span className="text-primary font-mono">{activity.user}</span>
                  <span className="text-muted-foreground"> {activity.action}</span>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
