import { Match, Market, LeaderboardEntry, Game } from '@/types';

// Game logos/icons mapping
export const gameLogos: Record<Game, string> = {
  cs2: '🎯',
  valorant: '⚔️',
  league: '🏰',
  dota2: '🛡️',
};

export const gameNames: Record<Game, string> = {
  cs2: 'Counter-Strike 2',
  valorant: 'VALORANT',
  league: 'League of Legends',
  dota2: 'Dota 2',
};

// Mock live matches
export const mockMatches: Match[] = [
  {
    id: 'match-1',
    game: 'cs2',
    status: 'live',
    teamA: {
      id: 'team-1',
      name: 'Natus Vincere',
      shortName: 'NAVI',
      score: 12,
    },
    teamB: {
      id: 'team-2',
      name: 'FaZe Clan',
      shortName: 'FaZe',
      score: 10,
    },
    currentRound: 23,
    totalRounds: 24,
    currentMap: 'Mirage',
    mapScore: { teamA: 1, teamB: 1 },
    tournament: 'BLAST Premier World Final',
    startTime: new Date(Date.now() - 3600000),
    viewers: 145000,
    bettingVolume: 25400,
  },
  {
    id: 'match-2',
    game: 'valorant',
    status: 'live',
    teamA: {
      id: 'team-3',
      name: 'Sentinels',
      shortName: 'SEN',
      score: 8,
    },
    teamB: {
      id: 'team-4',
      name: 'Cloud9',
      shortName: 'C9',
      score: 7,
    },
    currentRound: 16,
    totalRounds: 24,
    currentMap: 'Haven',
    mapScore: { teamA: 1, teamB: 0 },
    tournament: 'VCT Americas',
    startTime: new Date(Date.now() - 1800000),
    viewers: 89000,
    bettingVolume: 18200,
  },
  {
    id: 'match-3',
    game: 'cs2',
    status: 'live',
    teamA: {
      id: 'team-5',
      name: 'G2 Esports',
      shortName: 'G2',
      score: 5,
    },
    teamB: {
      id: 'team-6',
      name: 'Team Vitality',
      shortName: 'VIT',
      score: 6,
    },
    currentRound: 12,
    totalRounds: 24,
    currentMap: 'Inferno',
    mapScore: { teamA: 0, teamB: 0 },
    tournament: 'IEM Katowice',
    startTime: new Date(Date.now() - 2400000),
    viewers: 112000,
    bettingVolume: 31500,
  },
  {
    id: 'match-4',
    game: 'valorant',
    status: 'upcoming',
    teamA: {
      id: 'team-7',
      name: 'Fnatic',
      shortName: 'FNC',
      score: 0,
    },
    teamB: {
      id: 'team-8',
      name: 'Team Liquid',
      shortName: 'TL',
      score: 0,
    },
    currentRound: 0,
    totalRounds: 24,
    currentMap: 'TBD',
    mapScore: { teamA: 0, teamB: 0 },
    tournament: 'VCT EMEA',
    startTime: new Date(Date.now() + 3600000),
    viewers: 0,
    bettingVolume: 5200,
  },
  {
    id: 'match-5',
    game: 'cs2',
    status: 'upcoming',
    teamA: {
      id: 'team-9',
      name: 'Astralis',
      shortName: 'AST',
      score: 0,
    },
    teamB: {
      id: 'team-10',
      name: 'Heroic',
      shortName: 'HRC',
      score: 0,
    },
    currentRound: 0,
    totalRounds: 24,
    currentMap: 'TBD',
    mapScore: { teamA: 0, teamB: 0 },
    tournament: 'ESL Pro League',
    startTime: new Date(Date.now() + 7200000),
    viewers: 0,
    bettingVolume: 3100,
  },
];

// Mock markets for a live match
export const mockMarkets: Market[] = [
  {
    id: 'market-1',
    matchId: 'match-1',
    type: 'round_winner',
    title: 'Round 24 Winner',
    description: 'Who will win the current round?',
    options: [
      { id: 'opt-1', label: 'NAVI', odds: 1.85, previousOdds: 1.90, poolAmount: 8500 },
      { id: 'opt-2', label: 'FaZe', odds: 1.95, previousOdds: 1.90, poolAmount: 7800 },
    ],
    status: 'open',
    closesAt: new Date(Date.now() + 45000), // 45 seconds
    totalPool: 16300,
  },
  {
    id: 'market-2',
    matchId: 'match-1',
    type: 'first_blood',
    title: 'First Blood',
    description: 'Which team gets the first kill?',
    options: [
      { id: 'opt-3', label: 'NAVI', odds: 1.88, poolAmount: 4200 },
      { id: 'opt-4', label: 'FaZe', odds: 1.92, poolAmount: 3900 },
    ],
    status: 'open',
    closesAt: new Date(Date.now() + 45000),
    totalPool: 8100,
  },
  {
    id: 'market-3',
    matchId: 'match-1',
    type: 'bomb_plant',
    title: 'Bomb Planted?',
    description: 'Will the bomb be planted this round?',
    options: [
      { id: 'opt-5', label: 'Yes', odds: 1.65, poolAmount: 6100 },
      { id: 'opt-6', label: 'No', odds: 2.20, poolAmount: 2800 },
    ],
    status: 'open',
    closesAt: new Date(Date.now() + 60000),
    totalPool: 8900,
  },
  {
    id: 'market-4',
    matchId: 'match-1',
    type: 'total_kills',
    title: 'Total Kills in Round',
    description: 'Over or under 6.5 total kills?',
    options: [
      { id: 'opt-7', label: 'Over 6.5', odds: 1.75, poolAmount: 5500 },
      { id: 'opt-8', label: 'Under 6.5', odds: 2.05, poolAmount: 4100 },
    ],
    status: 'open',
    closesAt: new Date(Date.now() + 60000),
    totalPool: 9600,
  },
];

// Mock leaderboard
export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, address: '0x1a2b...3c4d', displayName: 'CryptoOracle', profit: 15420, winRate: 68.5, totalBets: 245 },
  { rank: 2, address: '0x5e6f...7g8h', displayName: 'BetMaster99', profit: 12850, winRate: 65.2, totalBets: 312 },
  { rank: 3, address: '0x9i0j...1k2l', displayName: 'EsportsGuru', profit: 11200, winRate: 62.8, totalBets: 198 },
  { rank: 4, address: '0x3m4n...5o6p', displayName: 'ProPredictor', profit: 9870, winRate: 61.5, totalBets: 276 },
  { rank: 5, address: '0x7q8r...9s0t', displayName: 'LineraWhale', profit: 8540, winRate: 59.8, totalBets: 189 },
  { rank: 6, address: '0x1u2v...3w4x', profit: 7320, winRate: 58.2, totalBets: 165 },
  { rank: 7, address: '0x5y6z...7a8b', profit: 6190, winRate: 57.1, totalBets: 142 },
  { rank: 8, address: '0x9c0d...1e2f', profit: 5450, winRate: 55.9, totalBets: 203 },
  { rank: 9, address: '0x3g4h...5i6j', profit: 4780, winRate: 54.3, totalBets: 178 },
  { rank: 10, address: '0x7k8l...9m0n', profit: 4120, winRate: 53.1, totalBets: 156 },
];
