import { Link } from 'react-router-dom';
import { Users, TrendingUp, Clock } from 'lucide-react';
import { Match } from '@/types';
import { gameLogos, gameNames } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface MatchCardProps {
  match: Match;
}

export function MatchCard({ match }: MatchCardProps) {
  const isLive = match.status === 'live';
  const isUpcoming = match.status === 'upcoming';

  const formatTime = (date: Date) => {
    if (isUpcoming) {
      const diff = date.getTime() - Date.now();
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      return `Starts in ${hours}h ${minutes}m`;
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Link
      to={`/match/${match.id}`}
      className={cn(
        'block group relative overflow-hidden rounded-xl border bg-card p-4 transition-all hover-lift',
        isLive ? 'border-primary/50 glow-primary' : 'border-border hover:border-primary/30'
      )}
    >
      {/* Live indicator */}
      {isLive && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-xs font-bold uppercase text-destructive">LIVE</span>
        </div>
      )}

      {/* Game & Tournament */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{gameLogos[match.game]}</span>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {gameNames[match.game]}
          </p>
          <p className="text-xs text-muted-foreground">{match.tournament}</p>
        </div>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-4 mb-4">
        {/* Team A */}
        <div className="flex-1 text-center">
          <p className="font-display text-sm font-bold text-foreground mb-1">
            {match.teamA.shortName}
          </p>
          <p className={cn(
            'font-display text-3xl font-black',
            isLive && match.teamA.score > match.teamB.score ? 'text-success' : 'text-foreground'
          )}>
            {match.teamA.score}
          </p>
        </div>

        {/* VS / Round Info */}
        <div className="flex flex-col items-center">
          <span className="text-xs text-muted-foreground font-semibold mb-1">
            {isLive ? `R${match.currentRound}` : 'VS'}
          </span>
          {isLive && (
            <span className="text-xs text-primary font-semibold">
              {match.currentMap}
            </span>
          )}
          {isLive && (
            <span className="text-[10px] text-muted-foreground mt-1">
              {match.mapScore.teamA} - {match.mapScore.teamB}
            </span>
          )}
        </div>

        {/* Team B */}
        <div className="flex-1 text-center">
          <p className="font-display text-sm font-bold text-foreground mb-1">
            {match.teamB.shortName}
          </p>
          <p className={cn(
            'font-display text-3xl font-black',
            isLive && match.teamB.score > match.teamA.score ? 'text-success' : 'text-foreground'
          )}>
            {match.teamB.score}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{formatTime(match.startTime)}</span>
        </div>
        
        {isLive && (
          <>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{(match.viewers / 1000).toFixed(1)}K</span>
            </div>
            <div className="flex items-center gap-1 text-primary">
              <TrendingUp className="h-3 w-3" />
              <span>{match.bettingVolume.toLocaleString()} LPT</span>
            </div>
          </>
        )}
        
        {isUpcoming && (
          <span className="text-warning font-semibold">Pre-match bets open</span>
        )}
      </div>

      {/* Hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </Link>
  );
}
