import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PANDASCORE_BASE_URL = 'https://api.pandascore.co';

// In-memory cache with TTL
interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

// Cache TTLs in milliseconds
const CACHE_TTL = {
  running: 30 * 1000,    // 30 seconds for live matches
  upcoming: 5 * 60 * 1000, // 5 minutes for upcoming
  past: 10 * 60 * 1000,    // 10 minutes for past
  match: 15 * 1000,        // 15 seconds for specific match
};

function getCachedData(key: string): unknown | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

function setCacheData(key: string, data: unknown, ttl: number): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
  });
  
  // Cleanup old entries (keep cache size manageable)
  if (cache.size > 100) {
    const now = Date.now();
    for (const [k, v] of cache.entries()) {
      if (v.expiresAt < now) {
        cache.delete(k);
      }
    }
  }
}

interface PandaScoreMatch {
  id: number;
  name: string;
  slug: string;
  status: 'not_started' | 'running' | 'finished';
  scheduled_at: string;
  begin_at: string | null;
  end_at: string | null;
  streams_list: Array<{ raw_url: string; language: string }>;
  live: {
    opens_at: string | null;
    supported: boolean;
    url: string | null;
  };
  videogame: {
    id: number;
    name: string;
    slug: string;
  };
  league: {
    id: number;
    name: string;
    slug: string;
    image_url: string | null;
  };
  serie: {
    id: number;
    full_name: string;
    name: string | null;
  };
  tournament: {
    id: number;
    name: string;
    slug: string;
  };
  opponents: Array<{
    opponent: {
      id: number;
      name: string;
      acronym: string | null;
      image_url: string | null;
    };
    type: string;
  }>;
  results: Array<{
    team_id: number;
    score: number;
  }>;
  games: Array<{
    id: number;
    position: number;
    status: string;
    winner: { id: number; type: string } | null;
    winner_type: string | null;
  }>;
  number_of_games: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('PANDASCORE_API_KEY');
    if (!apiKey) {
      throw new Error('PANDASCORE_API_KEY not configured');
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'running';
    const game = url.searchParams.get('game'); // 'csgo' for CS2, 'valorant'
    const matchId = url.searchParams.get('matchId');

    // Create cache key
    const cacheKey = `${action}:${game || 'all'}:${matchId || ''}`;
    
    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      console.log('Returning cached data for:', cacheKey);
      return new Response(JSON.stringify(cachedData), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
        },
      });
    }

    let endpoint = '';
    const params = new URLSearchParams();
    params.set('page[size]', '20');

    switch (action) {
      case 'running':
        // Get currently live matches
        endpoint = '/matches/running';
        break;
      case 'upcoming':
        // Get upcoming matches
        endpoint = '/matches/upcoming';
        params.set('page[size]', '10');
        break;
      case 'past':
        // Get recent finished matches
        endpoint = '/matches/past';
        params.set('page[size]', '10');
        break;
      case 'match':
        // Get specific match details
        if (!matchId) {
          throw new Error('matchId required for match action');
        }
        endpoint = `/matches/${matchId}`;
        break;
      default:
        endpoint = '/matches/running';
    }

    // Filter by game if specified
    if (game && action !== 'match') {
      // PandaScore uses 'csgo' for CS2
      const gameSlug = game === 'cs2' ? 'csgo' : game;
      params.set('filter[videogame]', gameSlug);
    }

    const apiUrl = `${PANDASCORE_BASE_URL}${endpoint}?${params.toString()}`;
    console.log('Fetching from PandaScore:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PandaScore API error:', response.status, errorText);
      throw new Error(`PandaScore API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform data to our format
    const transformedData = action === 'match' 
      ? transformMatch(data as PandaScoreMatch)
      : (data as PandaScoreMatch[]).map(transformMatch);

    // Cache the result
    const ttl = CACHE_TTL[action as keyof typeof CACHE_TTL] || CACHE_TTL.running;
    setCacheData(cacheKey, transformedData, ttl);
    console.log('Cached data for:', cacheKey, 'TTL:', ttl / 1000, 'seconds');

    return new Response(JSON.stringify(transformedData), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
      },
    });

  } catch (error: unknown) {
    console.error('Error in esports-data function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
function transformMatch(match: PandaScoreMatch) {
  const teamA = match.opponents[0]?.opponent;
  const teamB = match.opponents[1]?.opponent;
  
  const teamAResult = match.results.find(r => r.team_id === teamA?.id);
  const teamBResult = match.results.find(r => r.team_id === teamB?.id);

  // Calculate map scores from games
  const teamAMapWins = match.games.filter(g => g.winner?.id === teamA?.id).length;
  const teamBMapWins = match.games.filter(g => g.winner?.id === teamB?.id).length;

  // Determine game type
  let game: 'cs2' | 'valorant' | 'league' | 'dota2' = 'cs2';
  const gameSlug = match.videogame.slug.toLowerCase();
  if (gameSlug.includes('valorant')) game = 'valorant';
  else if (gameSlug.includes('league') || gameSlug.includes('lol')) game = 'league';
  else if (gameSlug.includes('dota')) game = 'dota2';

  // Map status
  let status: 'live' | 'upcoming' | 'finished' = 'upcoming';
  if (match.status === 'running') status = 'live';
  else if (match.status === 'finished') status = 'finished';

  // Get current round estimate (PandaScore doesn't always provide this)
  const currentRound = (teamAResult?.score || 0) + (teamBResult?.score || 0) + 1;

  return {
    id: `ps-${match.id}`,
    pandaScoreId: match.id,
    game,
    status,
    teamA: {
      id: teamA?.id?.toString() || 'unknown',
      name: teamA?.name || 'TBD',
      shortName: teamA?.acronym || teamA?.name?.substring(0, 4) || 'TBD',
      logo: teamA?.image_url || undefined,
      score: teamAResult?.score || 0,
    },
    teamB: {
      id: teamB?.id?.toString() || 'unknown',
      name: teamB?.name || 'TBD',
      shortName: teamB?.acronym || teamB?.name?.substring(0, 4) || 'TBD',
      logo: teamB?.image_url || undefined,
      score: teamBResult?.score || 0,
    },
    currentRound,
    totalRounds: match.number_of_games * 24, // Estimate for CS/Val
    currentMap: `Map ${teamAMapWins + teamBMapWins + 1}`,
    mapScore: { teamA: teamAMapWins, teamB: teamBMapWins },
    tournament: match.tournament?.name || match.league?.name || 'Tournament',
    league: match.league?.name || 'League',
    leagueLogo: match.league?.image_url || undefined,
    startTime: match.scheduled_at || match.begin_at,
    streamUrl: match.streams_list?.[0]?.raw_url || match.live?.url || undefined,
    // Simulated values for betting (would come from smart contract in production)
    viewers: status === 'live' ? Math.floor(Math.random() * 100000) + 10000 : 0,
    bettingVolume: status === 'live' ? Math.floor(Math.random() * 50000) + 5000 : Math.floor(Math.random() * 5000),
  };
}
