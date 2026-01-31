import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Clock, TrendingUp, Users, Trophy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { MatchCard } from '@/components/matches/MatchCard';
import { useRunningMatches } from '@/hooks/useMatches';
import { mockMatches } from '@/data/mockData';

export default function Landing() {
  const { wallet, connect, isConnecting } = useWallet();
  const { data: liveMatches, isLoading } = useRunningMatches();

  // Use API data if available, otherwise fallback to mock
  const displayMatches = (liveMatches && liveMatches.length > 0) 
    ? liveMatches.slice(0, 3)
    : mockMatches.filter((m) => m.status === 'live').slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Built on Linera - Sub-second Finality</span>
            </div>

            {/* Main headline */}
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight animate-fade-in">
              <span className="text-foreground">Predict</span>{' '}
              <span className="text-primary text-glow-primary">Every Play.</span>
              <br />
              <span className="text-foreground">Win</span>{' '}
              <span className="text-accent text-glow-accent">Instantly.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in">
              Real-time micro-predictions on live esports matches. 
              Bet on individual plays, not just game outcomes. 
              Instant settlement powered by Linera's microchain architecture.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
              {wallet.connected ? (
                <Button 
                  asChild 
                  size="lg"
                  className="font-display font-bold uppercase tracking-wide text-lg px-8 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
                >
                  <Link to="/matches">
                    View Live Matches
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={connect}
                  disabled={isConnecting}
                  className="font-display font-bold uppercase tracking-wide text-lg px-8 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
                >
                  {isConnecting ? 'Connecting...' : 'Connect Wallet to Start'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              )}
              <Button
                asChild
                variant="outline"
                size="lg"
                className="font-body font-semibold"
              >
                <Link to="/how-it-works">How It Works</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto mt-16">
              <div>
                <p className="font-display text-3xl md:text-4xl font-black text-primary">50K+</p>
                <p className="text-sm text-muted-foreground">Active Predictors</p>
              </div>
              <div>
                <p className="font-display text-3xl md:text-4xl font-black text-primary">{'<1s'}</p>
                <p className="text-sm text-muted-foreground">Settlement Time</p>
              </div>
              <div>
                <p className="font-display text-3xl md:text-4xl font-black text-primary">$2M+</p>
                <p className="text-sm text-muted-foreground">Total Volume</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Matches Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
              <h2 className="font-display text-2xl md:text-3xl font-bold">Live Now</h2>
              {liveMatches && liveMatches.length > 0 && (
                <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-xs font-semibold">
                  Real Data
                </span>
              )}
            </div>
            <Button asChild variant="outline" className="font-body font-semibold">
              <Link to="/matches">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
              <span className="ml-2 text-muted-foreground">Loading live matches...</span>
            </div>
          ) : displayMatches.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <p className="text-muted-foreground">No live matches at the moment. Check upcoming matches!</p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/matches">View Upcoming</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Why <span className="text-primary">LivePredict</span>?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              The first real-time micro-prediction platform for esports, 
              powered by Linera's revolutionary blockchain technology.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors hover-lift">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2">Instant Settlement</h3>
              <p className="text-muted-foreground">
                Bets are settled in under 1 second thanks to Linera's sub-second finality. 
                No waiting, no uncertainty.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors hover-lift">
              <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2">Micro-Predictions</h3>
              <p className="text-muted-foreground">
                Bet on individual plays: first blood, round winner, bomb plants. 
                More action, more opportunities.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors hover-lift">
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2">Fully On-Chain</h3>
              <p className="text-muted-foreground">
                All bets and settlements happen on Linera. 
                Transparent, trustless, and verifiable.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors hover-lift">
              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-success" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2">Live Odds</h3>
              <p className="text-muted-foreground">
                Dynamic odds that update in real-time based on pool sizes 
                and game state. Fair and transparent.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors hover-lift">
              <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-warning" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2">Community</h3>
              <p className="text-muted-foreground">
                Compete with other predictors, climb the leaderboard, 
                and earn recognition for your skills.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors hover-lift">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2">CS2 & Valorant</h3>
              <p className="text-muted-foreground">
                Starting with the biggest FPS esports titles. 
                More games coming soon based on community demand.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center p-8 md:p-12 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5 glow-primary">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Ready to Make Your Predictions?
            </h2>
            <p className="text-muted-foreground mb-8">
              Connect your Linera wallet and start predicting live esports plays. 
              Get 1000 testnet tokens to start!
            </p>
            {wallet.connected ? (
              <Button 
                asChild 
                size="lg"
                className="font-display font-bold uppercase tracking-wide bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Link to="/matches">
                  Start Predicting
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={connect}
                disabled={isConnecting}
                className="font-display font-bold uppercase tracking-wide bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
