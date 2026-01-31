// Linera Smart Contract Types for Live Play Predictor

/** Unique identifier for a market */
export type MarketId = string;

/** Unique identifier for a bet */
export type BetId = string;

/** Amount in tokens (as string for precision) */
export type Amount = string;

/** Timestamp in milliseconds */
export type Timestamp = number;

/** Market status enum matching contract */
export enum MarketStatus {
  Open = 'Open',
  Locked = 'Locked',
  Resolved = 'Resolved',
  Cancelled = 'Cancelled',
}

/** A betting option within a market */
export interface MarketOption {
  id: number;
  label: string;
  pool: Amount;
}

/** A betting market */
export interface LineraMarket {
  id: MarketId;
  matchId: string;
  marketType: string;
  title: string;
  options: MarketOption[];
  status: MarketStatus;
  createdAt: Timestamp;
  locksAt: Timestamp;
  winningOption?: number;
}

/** A user's bet */
export interface LineraBet {
  id: BetId;
  owner: string;
  marketId: MarketId;
  optionId: number;
  amount: Amount;
  odds: number; // Scaled by 1000 (e.g., 1500 = 1.5x)
  placedAt: Timestamp;
  settled: boolean;
  payout?: Amount;
}

/** User balance information */
export interface LineraBalance {
  available: Amount;
  locked: Amount;
  total: Amount;
}

/** Transaction status */
export const TransactionStatus = {
  Pending: 'pending',
  Confirmed: 'confirmed',
  Failed: 'failed',
} as const;

export type TransactionStatus = typeof TransactionStatus[keyof typeof TransactionStatus];

/** Transaction receipt */
export interface TransactionReceipt {
  hash: string;
  status: TransactionStatus;
  blockHeight?: number;
  timestamp: Timestamp;
  gasUsed?: string;
}

/** Operation types matching contract ABI */
export type ContractOperation =
  | { type: 'CreateMarket'; matchId: string; marketType: string; title: string; options: string[]; locksAt: Timestamp }
  | { type: 'PlaceBet'; marketId: MarketId; optionId: number; amount: Amount }
  | { type: 'LockMarket'; marketId: MarketId }
  | { type: 'ResolveMarket'; marketId: MarketId; winningOption: number }
  | { type: 'CancelMarket'; marketId: MarketId }
  | { type: 'ClaimWinnings'; betId: BetId }
  | { type: 'Deposit'; amount: Amount }
  | { type: 'Withdraw'; amount: Amount };

/** Operation response types */
export type OperationResponse =
  | { type: 'MarketCreated'; marketId: MarketId }
  | { type: 'BetPlaced'; betId: BetId; odds: number }
  | { type: 'MarketLocked'; marketId: MarketId }
  | { type: 'MarketResolved'; marketId: MarketId; winningOption: number }
  | { type: 'MarketCancelled'; marketId: MarketId }
  | { type: 'WinningsClaimed'; betId: BetId; amount: Amount }
  | { type: 'Deposited'; amount: Amount; newBalance: Amount }
  | { type: 'Withdrawn'; amount: Amount; newBalance: Amount }
  | { type: 'Error'; message: string };

/** GraphQL query types */
export interface MarketsQuery {
  markets: LineraMarket[];
}

export interface MarketQuery {
  market: LineraMarket | null;
}

export interface UserBetsQuery {
  userBets: LineraBet[];
}

export interface BalanceQuery {
  balance: LineraBalance;
}

/** Client configuration */
export interface LineraClientConfig {
  /** Application ID on Linera */
  applicationId: string;
  /** Chain ID to interact with */
  chainId: string;
  /** GraphQL endpoint for queries */
  graphqlEndpoint: string;
  /** Whether to use testnet */
  testnet?: boolean;
}
