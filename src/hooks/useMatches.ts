import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Match, Game } from '@/types';
import { mockMatches } from '@/data/mockData';

interface FetchMatchesOptions {
  action?: 'running' | 'upcoming' | 'past';
  game?: Game;
}

interface ApiMatch {
  id: string;
  pandaScoreId: number;
  game: Game;
  status: 'live' | 'upcoming' | 'finished';
  teamA: {
    id: string;
    name: string;
    shortName: string;
    logo?: string;
    score: number;
  };
  teamB: {
    id: string;
    name: string;
    shortName: string;
    logo?: string;
    score: number;
  };
  currentRound: number;
  totalRounds: number;
  currentMap: string;
  mapScore: { teamA: number; teamB: number };
  tournament: string;
  league: string;
  leagueLogo?: string;
  startTime: string;
  streamUrl?: string;
  viewers: number;
  bettingVolume: number;
}

async function fetchMatches(options: FetchMatchesOptions = {}): Promise<Match[]> {
  const { action = 'running', game } = options;

  try {
    const params = new URLSearchParams({ action });
    if (game) params.set('game', game);

    const { data, error } = await supabase.functions.invoke('esports-data', {
      body: null,
      method: 'GET',
    });

    // supabase.functions.invoke doesn't support query params well, so we use fetch directly
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/esports-data?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const apiMatches: ApiMatch[] = await response.json();

    // Transform API response to Match type
    return apiMatches.map((m): Match => ({
      id: m.id,
      game: m.game,
      status: m.status,
      teamA: {
        id: m.teamA.id,
        name: m.teamA.name,
        shortName: m.teamA.shortName,
        logo: m.teamA.logo,
        score: m.teamA.score,
      },
      teamB: {
        id: m.teamB.id,
        name: m.teamB.name,
        shortName: m.teamB.shortName,
        logo: m.teamB.logo,
        score: m.teamB.score,
      },
      currentRound: m.currentRound,
      totalRounds: m.totalRounds,
      currentMap: m.currentMap,
      mapScore: m.mapScore,
      tournament: m.tournament,
      startTime: new Date(m.startTime),
      viewers: m.viewers,
      bettingVolume: m.bettingVolume,
    }));
  } catch (error) {
    console.error('Error fetching matches from API, using mock data:', error);
    // Fallback to mock data if API fails
    return mockMatches.filter(m => {
      if (action === 'running') return m.status === 'live';
      if (action === 'upcoming') return m.status === 'upcoming';
      return true;
    });
  }
}

export function useRunningMatches(game?: Game) {
  return useQuery({
    queryKey: ['matches', 'running', game],
    queryFn: () => fetchMatches({ action: 'running', game }),
    refetchInterval: 30000, // Refetch every 30 seconds for live data
    staleTime: 10000,
  });
}

export function useUpcomingMatches(game?: Game) {
  return useQuery({
    queryKey: ['matches', 'upcoming', game],
    queryFn: () => fetchMatches({ action: 'upcoming', game }),
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000,
  });
}

export function useAllMatches(game?: Game) {
  const runningQuery = useRunningMatches(game);
  const upcomingQuery = useUpcomingMatches(game);

  const matches = [
    ...(runningQuery.data || []),
    ...(upcomingQuery.data || []),
  ];

  return {
    data: matches,
    isLoading: runningQuery.isLoading || upcomingQuery.isLoading,
    isError: runningQuery.isError && upcomingQuery.isError,
    error: runningQuery.error || upcomingQuery.error,
    refetch: () => {
      runningQuery.refetch();
      upcomingQuery.refetch();
    },
  };
}

export function useMatch(matchId: string) {
  return useQuery({
    queryKey: ['match', matchId],
    queryFn: async (): Promise<Match | null> => {
      // First check if it's a mock match
      const mockMatch = mockMatches.find(m => m.id === matchId);
      if (mockMatch) return mockMatch;

      // Try to get from API
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        // Extract PandaScore ID from our ID format
        const pandaScoreId = matchId.startsWith('ps-') 
          ? matchId.replace('ps-', '') 
          : matchId;

        const response = await fetch(
          `${supabaseUrl}/functions/v1/esports-data?action=match&matchId=${pandaScoreId}`,
          {
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'apikey': supabaseKey,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const m: ApiMatch = await response.json();
        
        return {
          id: m.id,
          game: m.game,
          status: m.status,
          teamA: {
            id: m.teamA.id,
            name: m.teamA.name,
            shortName: m.teamA.shortName,
            logo: m.teamA.logo,
            score: m.teamA.score,
          },
          teamB: {
            id: m.teamB.id,
            name: m.teamB.name,
            shortName: m.teamB.shortName,
            logo: m.teamB.logo,
            score: m.teamB.score,
          },
          currentRound: m.currentRound,
          totalRounds: m.totalRounds,
          currentMap: m.currentMap,
          mapScore: m.mapScore,
          tournament: m.tournament,
          startTime: new Date(m.startTime),
          viewers: m.viewers,
          bettingVolume: m.bettingVolume,
        };
      } catch (error) {
        console.error('Error fetching match:', error);
        return null;
      }
    },
    enabled: !!matchId,
    refetchInterval: matchId ? 15000 : false, // Refetch every 15s for live match
  });
}
