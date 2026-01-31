// Live Play Predictor Types

export type Game = 'cs2' | 'valorant' | 'league' | 'dota2';

export type MatchStatus = 'live' | 'upcoming' | 'finished';

export type BetStatus = 'open' | 'locked' | 'won' | 'lost' | 'push';

export type MarketType = 
  | 'round_winner'
  | 'first_blood'
  | 'bomb_plant'
  | 'clutch_outcome'
  | 'total_kills'
  | 'map_winner';

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo?: string;
  score: number;
}

export interface Match {
  id: string;
  game: Game;
  status: MatchStatus;
  teamA: Team;
  teamB: Team;
  currentRound: number;
  totalRounds: number;
  currentMap: string;
  mapScore: { teamA: number; teamB: number };
  tournament: string;
  startTime: Date;
  viewers: number;
  bettingVolume: number;
}

export interface Market {
  id: string;
  matchId: string;
  type: MarketType;
  title: string;
  description: string;
  options: MarketOption[];
  status: 'open' | 'locked' | 'resolved';
  closesAt: Date;
  resolvedOption?: string;
  totalPool: number;
}

export interface MarketOption {
  id: string;
  label: string;
  odds: number;
  previousOdds?: number;
  poolAmount: number;
}

export interface Bet {
  id: string;
  marketId: string;
  matchId: string;
  optionId: string;
  amount: number;
  odds: number;
  status: BetStatus;
  potentialWin: number;
  placedAt: Date;
  settledAt?: Date;
}

export interface UserBalance {
  available: number;
  locked: number; // In active bets
  total: number;
}

export interface WalletState {
  connected: boolean;
  address: string | null;
  chainId: string | null;
  balance: UserBalance;
}

export interface UserStats {
  totalBets: number;
  wonBets: number;
  lostBets: number;
  totalWagered: number;
  totalWon: number;
  winRate: number;
  profitLoss: number;
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  displayName?: string;
  avatar?: string;
  profit: number;
  winRate: number;
  totalBets: number;
}

// Linera-specific types
export interface LineraTransaction {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  type: 'bet' | 'deposit' | 'withdraw' | 'claim';
  amount: number;
  timestamp: Date;
}

// Event types for real-time updates
export interface GameEvent {
  id: string;
  matchId: string;
  type: 'kill' | 'bomb_plant' | 'bomb_defuse' | 'round_end' | 'clutch_start';
  timestamp: Date;
  data: Record<string, unknown>;
}
