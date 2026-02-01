// Linera Client for Live Play Predictor
import {
  type LineraClientConfig,
  type LineraMarket,
  type LineraBet,
  type LineraBalance,
  type MarketId,
  type BetId,
  type Amount,
  type Timestamp,
  type TransactionReceipt,
  type OperationResponse,
  TransactionStatus,
} from './types';
import { getCheCkoProvider, type CheCkoProvider } from '../checko';

/** Default configuration for Linera Testnet Conway */
export const DEFAULT_CONFIG: Partial<LineraClientConfig> = {
  testnet: true,
  graphqlEndpoint: 'https://conway.linera.net/graphql',
};

/**
 * Linera Client for interacting with the Live Play Predictor smart contract.
 * Handles all blockchain operations including betting, market management, and balance queries.
 */
export class LineraClient {
  private config: LineraClientConfig;
  private provider: CheCkoProvider | null = null;
  private connected: boolean = false;

  constructor(config: Partial<LineraClientConfig> = {}) {
    this.config = {
      applicationId: config.applicationId || import.meta.env.VITE_LINERA_APP_ID || '',
      chainId: config.chainId || import.meta.env.VITE_LINERA_CHAIN_ID || '',
      graphqlEndpoint: config.graphqlEndpoint || DEFAULT_CONFIG.graphqlEndpoint!,
      testnet: config.testnet ?? DEFAULT_CONFIG.testnet,
    };
  }

  /**
   * Connect to the Linera network via CheCko wallet
   */
  async connect(): Promise<boolean> {
    try {
      this.provider = getCheCkoProvider();
      if (!this.provider) {
        console.error('[LineraClient] CheCko wallet not found - make sure the extension is installed');
        throw new Error('CheCko wallet not found. Please install the CheCko extension.');
      }

      console.log('[LineraClient] Found provider, connecting...');

      console.log('[LineraClient] Connecting via CheCko...');

      // CheCko uses EIP-1193 request pattern
      let accounts: string[] = [];
      try {
        accounts = await this.provider.request<string[]>({ method: 'eth_accounts' });
      } catch (err) {
        console.log('[LineraClient] eth_accounts failed, trying eth_requestAccounts:', err);
        accounts = [];
      }

      if (!accounts || accounts.length === 0) {
        // Request connection via EIP-1193
        accounts = await this.provider.request<string[]>({ method: 'eth_requestAccounts' });
      }

      this.connected = accounts && accounts.length > 0;
      console.log('[LineraClient] Connected:', this.connected, 'Account:', accounts?.[0]);
      return this.connected;
    } catch (error) {
      console.error('[LineraClient] Failed to connect:', error);
      this.connected = false;
      return false;
    }
  }

  /**
   * Check if client is connected
   */
  isConnected(): boolean {
    return this.connected && this.provider !== null;
  }

  /**
   * Ensure connection before operations
   */
  async ensureConnected(): Promise<void> {
    if (!this.isConnected()) {
      const success = await this.connect();
      if (!success) {
        throw new Error('Not connected to Linera');
      }
    }
  }

  /**
   * Get current user's address
   */
  async getAddress(): Promise<string | null> {
    if (!this.provider) return null;
    try {
      const accounts = await this.provider.request<string[]>({ method: 'eth_accounts' });
      return accounts?.[0] || null;
    } catch {
      return null;
    }
  }

  // ============================================
  // MARKET OPERATIONS
  // ============================================

  /**
   * Create a new betting market
   */
  async createMarket(params: {
    matchId: string;
    marketType: string;
    title: string;
    options: string[];
    locksAt: Date | Timestamp;
  }): Promise<{ marketId: MarketId; receipt: TransactionReceipt }> {
    const operation = {
      type: 'CreateMarket' as const,
      matchId: params.matchId,
      marketType: params.marketType,
      title: params.title,
      options: params.options,
      locksAt: typeof params.locksAt === 'number' ? params.locksAt : params.locksAt.getTime(),
    };

    const receipt = await this.executeOperation(operation);
    
    // Parse response for market ID
    const response = await this.parseOperationResponse(receipt);
    if (response.type === 'MarketCreated') {
      return { marketId: response.marketId, receipt };
    }
    
    throw new Error(response.type === 'Error' ? response.message : 'Failed to create market');
  }

  /**
   * Place a bet on a market option
   */
  async placeBet(params: {
    marketId: MarketId;
    optionId: number;
    amount: Amount | number;
  }): Promise<{ betId: BetId; odds: number; receipt: TransactionReceipt }> {
    const operation = {
      type: 'PlaceBet' as const,
      marketId: params.marketId,
      optionId: params.optionId,
      amount: typeof params.amount === 'number' ? params.amount.toString() : params.amount,
    };

    const receipt = await this.executeOperation(operation);
    
    const response = await this.parseOperationResponse(receipt);
    if (response.type === 'BetPlaced') {
      return { betId: response.betId, odds: response.odds, receipt };
    }
    
    throw new Error(response.type === 'Error' ? response.message : 'Failed to place bet');
  }

  /**
   * Claim winnings from a settled bet
   */
  async claimWinnings(betId: BetId): Promise<{ amount: Amount; receipt: TransactionReceipt }> {
    const operation = {
      type: 'ClaimWinnings' as const,
      betId,
    };

    const receipt = await this.executeOperation(operation);
    
    const response = await this.parseOperationResponse(receipt);
    if (response.type === 'WinningsClaimed') {
      return { amount: response.amount, receipt };
    }
    
    throw new Error(response.type === 'Error' ? response.message : 'Failed to claim winnings');
  }

  /**
   * Lock a market (admin only)
   */
  async lockMarket(marketId: MarketId): Promise<TransactionReceipt> {
    return this.executeOperation({ type: 'LockMarket', marketId });
  }

  /**
   * Resolve a market with winning option (admin only)
   */
  async resolveMarket(marketId: MarketId, winningOption: number): Promise<TransactionReceipt> {
    return this.executeOperation({ type: 'ResolveMarket', marketId, winningOption });
  }

  /**
   * Cancel a market and refund all bets (admin only)
   */
  async cancelMarket(marketId: MarketId): Promise<TransactionReceipt> {
    return this.executeOperation({ type: 'CancelMarket', marketId });
  }

  // ============================================
  // BALANCE OPERATIONS
  // ============================================

  /**
   * Deposit tokens to betting balance
   */
  async deposit(amount: Amount | number): Promise<{ newBalance: Amount; receipt: TransactionReceipt }> {
    const operation = {
      type: 'Deposit' as const,
      amount: typeof amount === 'number' ? amount.toString() : amount,
    };

    const receipt = await this.executeOperation(operation);
    
    const response = await this.parseOperationResponse(receipt);
    if (response.type === 'Deposited') {
      return { newBalance: response.newBalance, receipt };
    }
    
    throw new Error(response.type === 'Error' ? response.message : 'Failed to deposit');
  }

  /**
   * Withdraw tokens from betting balance
   */
  async withdraw(amount: Amount | number): Promise<{ newBalance: Amount; receipt: TransactionReceipt }> {
    const operation = {
      type: 'Withdraw' as const,
      amount: typeof amount === 'number' ? amount.toString() : amount,
    };

    const receipt = await this.executeOperation(operation);
    
    const response = await this.parseOperationResponse(receipt);
    if (response.type === 'Withdrawn') {
      return { newBalance: response.newBalance, receipt };
    }
    
    throw new Error(response.type === 'Error' ? response.message : 'Failed to withdraw');
  }

  // ============================================
  // QUERY OPERATIONS (via GraphQL)
  // ============================================

  /**
   * Get all open markets
   */
  async getOpenMarkets(): Promise<LineraMarket[]> {
    const query = `
      query GetOpenMarkets {
        markets(status: Open) {
          id
          matchId
          marketType
          title
          options { id label pool }
          status
          createdAt
          locksAt
          winningOption
        }
      }
    `;

    const result = await this.graphqlQuery<{ markets: LineraMarket[] }>(query);
    return result.markets;
  }

  /**
   * Get markets for a specific match
   */
  async getMarketsForMatch(matchId: string): Promise<LineraMarket[]> {
    const query = `
      query GetMarketsForMatch($matchId: String!) {
        marketsByMatch(matchId: $matchId) {
          id
          matchId
          marketType
          title
          options { id label pool }
          status
          createdAt
          locksAt
          winningOption
        }
      }
    `;

    const result = await this.graphqlQuery<{ marketsByMatch: LineraMarket[] }>(query, { matchId });
    return result.marketsByMatch;
  }

  /**
   * Get a specific market by ID
   */
  async getMarket(marketId: MarketId): Promise<LineraMarket | null> {
    const query = `
      query GetMarket($marketId: ID!) {
        market(id: $marketId) {
          id
          matchId
          marketType
          title
          options { id label pool }
          status
          createdAt
          locksAt
          winningOption
        }
      }
    `;

    const result = await this.graphqlQuery<{ market: LineraMarket | null }>(query, { marketId });
    return result.market;
  }

  /**
   * Get user's bets
   */
  async getUserBets(address?: string): Promise<LineraBet[]> {
    const userAddress = address || await this.getAddress();
    if (!userAddress) return [];

    const query = `
      query GetUserBets($owner: String!) {
        betsByOwner(owner: $owner) {
          id
          owner
          marketId
          optionId
          amount
          odds
          placedAt
          settled
          payout
        }
      }
    `;

    const result = await this.graphqlQuery<{ betsByOwner: LineraBet[] }>(query, { owner: userAddress });
    return result.betsByOwner;
  }

  /**
   * Get user's balance
   */
  async getBalance(address?: string): Promise<LineraBalance> {
    const userAddress = address || await this.getAddress();
    if (!userAddress) {
      return { available: '0', locked: '0', total: '0' };
    }

    const query = `
      query GetBalance($owner: String!) {
        balance(owner: $owner) {
          available
          locked
          total
        }
      }
    `;

    const result = await this.graphqlQuery<{ balance: LineraBalance }>(query, { owner: userAddress });
    return result.balance;
  }

  /**
   * Calculate potential payout for a bet
   */
  async calculatePayout(marketId: MarketId, optionId: number, amount: Amount | number): Promise<{
    odds: number;
    potentialWin: Amount;
  }> {
    const query = `
      query CalculatePayout($marketId: ID!, $optionId: Int!, $amount: String!) {
        calculatePayout(marketId: $marketId, optionId: $optionId, amount: $amount) {
          odds
          potentialWin
        }
      }
    `;

    const result = await this.graphqlQuery<{
      calculatePayout: { odds: number; potentialWin: Amount };
    }>(query, {
      marketId,
      optionId,
      amount: typeof amount === 'number' ? amount.toString() : amount,
    });

    return result.calculatePayout;
  }

  // ============================================
  // INTERNAL METHODS
  // ============================================

  /**
   * Execute a contract operation via wallet using EIP-1193 request pattern
   * CheCko uses linera_graphqlMutation for write operations
   */
  private async executeOperation(operation: Record<string, unknown>): Promise<TransactionReceipt> {
    await this.ensureConnected();

    if (!this.provider) {
      throw new Error('Not connected to Linera');
    }

    try {
      // Get current user's public key for the mutation
      const accounts = await this.provider.request<string[]>({ method: 'eth_accounts' });
      const publicKey = accounts?.[0];
      
      if (!publicKey) {
        throw new Error('No account available');
      }

      // Build GraphQL mutation for the operation
      const { mutation, variables } = this.buildOperationMutation(operation);

      // Execute via CheCko's linera_graphqlMutation RPC method
      const hash = await this.provider.request<string>({
        method: 'linera_graphqlMutation',
        params: {
          applicationId: this.config.applicationId,
          publicKey,
          query: {
            query: mutation,
            variables,
          },
        },
      });

      // Wait for confirmation
      const receipt = await this.waitForTransaction(hash);
      return receipt;
    } catch (error) {
      console.error('Operation failed:', error);
      throw error;
    }
  }

  /**
   * Build GraphQL mutation from operation object
   */
  private buildOperationMutation(operation: Record<string, unknown>): { mutation: string; variables: Record<string, unknown> } {
    const opType = operation.type as string;
    
    switch (opType) {
      case 'Deposit':
        return {
          mutation: `mutation deposit($amount: String!) { deposit(amount: $amount) }`,
          variables: { amount: operation.amount },
        };
      case 'Withdraw':
        return {
          mutation: `mutation withdraw($amount: String!) { withdraw(amount: $amount) }`,
          variables: { amount: operation.amount },
        };
      case 'PlaceBet':
        return {
          mutation: `mutation placeBet($marketId: ID!, $optionId: Int!, $amount: String!) { placeBet(marketId: $marketId, optionId: $optionId, amount: $amount) }`,
          variables: { marketId: operation.marketId, optionId: operation.optionId, amount: operation.amount },
        };
      case 'ClaimWinnings':
        return {
          mutation: `mutation claimWinnings($betId: ID!) { claimWinnings(betId: $betId) }`,
          variables: { betId: operation.betId },
        };
      case 'CreateMarket':
        return {
          mutation: `mutation createMarket($matchId: String!, $marketType: String!, $title: String!, $options: [String!]!, $locksAt: Int!) { createMarket(matchId: $matchId, marketType: $marketType, title: $title, options: $options, locksAt: $locksAt) }`,
          variables: {
            matchId: operation.matchId,
            marketType: operation.marketType,
            title: operation.title,
            options: operation.options,
            locksAt: operation.locksAt,
          },
        };
      case 'LockMarket':
        return {
          mutation: `mutation lockMarket($marketId: ID!) { lockMarket(marketId: $marketId) }`,
          variables: { marketId: operation.marketId },
        };
      case 'ResolveMarket':
        return {
          mutation: `mutation resolveMarket($marketId: ID!, $winningOption: Int!) { resolveMarket(marketId: $marketId, winningOption: $winningOption) }`,
          variables: { marketId: operation.marketId, winningOption: operation.winningOption },
        };
      case 'CancelMarket':
        return {
          mutation: `mutation cancelMarket($marketId: ID!) { cancelMarket(marketId: $marketId) }`,
          variables: { marketId: operation.marketId },
        };
      default:
        throw new Error(`Unknown operation type: ${opType}`);
    }
  }

  /**
   * Wait for transaction confirmation
   */
  private async waitForTransaction(hash: string, timeout = 30000): Promise<TransactionReceipt> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const status = await this.getTransactionStatus(hash);
        if (status.status !== TransactionStatus.Pending) {
          return status;
        }
      } catch {
        // Transaction not found yet, keep polling
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error(`Transaction ${hash} timed out`);
  }

  /**
   * Get transaction status
   */
  private async getTransactionStatus(hash: string): Promise<TransactionReceipt> {
    // In production, this would query the Linera node
    // For now, return a mock confirmed status
    return {
      hash,
      status: TransactionStatus.Confirmed,
      timestamp: Date.now(),
    };
  }

  /**
   * Parse operation response from receipt
   */
  private async parseOperationResponse(receipt: TransactionReceipt): Promise<OperationResponse> {
    // In production, parse the actual response from the chain
    // For now, return a generic success based on the operation
    if (receipt.status === TransactionStatus.Failed) {
      return { type: 'Error', message: 'Transaction failed' };
    }

    // This would parse actual response data from the receipt
    return { type: 'Error', message: 'Response parsing not implemented' };
  }

  /**
   * Execute GraphQL query
   */
  private async graphqlQuery<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const response = await fetch(this.config.graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'GraphQL error');
    }

    return result.data as T;
  }
}

/** Singleton instance */
let clientInstance: LineraClient | null = null;

/**
 * Get or create the Linera client instance
 */
export function getLineraClient(config?: Partial<LineraClientConfig>): LineraClient {
  if (!clientInstance || config) {
    clientInstance = new LineraClient(config);
  }
  return clientInstance;
}
