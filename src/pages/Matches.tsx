import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MatchCard } from '@/components/matches/MatchCard';
import { mockMatches, gameNames } from '@/data/mockData';
import { Game, MatchStatus } from '@/types';
import { cn } from '@/lib/utils';

type FilterGame = Game | 'all';
type FilterStatus = MatchStatus | 'all';

export default function Matches() {
  const [searchQuery, setSearchQuery] = useState('');
  const [gameFilter, setGameFilter] = useState<FilterGame>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  const filteredMatches = mockMatches.filter((match) => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      match.teamA.name.toLowerCase().includes(searchLower) ||
      match.teamB.name.toLowerCase().includes(searchLower) ||
      match.tournament.toLowerCase().includes(searchLower);

    // Game filter
    const matchesGame = gameFilter === 'all' || match.game === gameFilter;

    // Status filter
    const matchesStatus = statusFilter === 'all' || match.status === statusFilter;

    return matchesSearch && matchesGame && matchesStatus;
  });

  const liveMatches = filteredMatches.filter((m) => m.status === 'live');
  const upcomingMatches = filteredMatches.filter((m) => m.status === 'upcoming');

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            <span className="text-primary">Live</span> Matches
          </h1>
          <p className="text-muted-foreground">
            Find live and upcoming esports matches to make your predictions
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teams or tournaments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted border-border"
            />
          </div>

          {/* Game Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
            <Button
              variant={gameFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGameFilter('all')}
              className="font-body font-semibold whitespace-nowrap"
            >
              All Games
            </Button>
            {(Object.keys(gameNames) as Game[]).map((game) => (
              <Button
                key={game}
                variant={gameFilter === game ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGameFilter(game)}
                className="font-body font-semibold whitespace-nowrap"
              >
                {gameNames[game]}
              </Button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
              className="font-body font-semibold"
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'live' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('live')}
              className={cn(
                'font-body font-semibold',
                statusFilter === 'live' && 'bg-destructive hover:bg-destructive/90'
              )}
            >
              🔴 Live
            </Button>
            <Button
              variant={statusFilter === 'upcoming' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('upcoming')}
              className="font-body font-semibold"
            >
              Upcoming
            </Button>
          </div>
        </div>

        {/* Live Matches */}
        {liveMatches.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
              <h2 className="font-display text-xl font-bold">Live Now</h2>
              <span className="text-sm text-muted-foreground">
                ({liveMatches.length} matches)
              </span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Matches */}
        {upcomingMatches.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="font-display text-xl font-bold">Upcoming</h2>
              <span className="text-sm text-muted-foreground">
                ({upcomingMatches.length} matches)
              </span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {filteredMatches.length === 0 && (
          <div className="text-center py-20">
            <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold mb-2">No matches found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or search query
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setGameFilter('all');
                setStatusFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
