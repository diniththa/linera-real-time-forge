/**
 * CheCko Wallet Integration for Linera Blockchain
 * Browser wallet by ResPeer: https://github.com/respeer-ai/linera-wallet
 * 
 * CheCko uses JSON-RPC messaging similar to MetaMask/EIP-1193 pattern.
 * It injects a provider into the window object for dApp communication.
 */

export interface CheCkoAccount {
  chainId: string;
  address: string;
  publicKey?: string;
}

export interface CheCkoBalance {
  available: string;
  locked: string;
}

let _rpcId = 1;

async function rpcRequest<T = unknown>(
  provider: CheCkoProvider,
  method: string,
  params: unknown[] = []
): Promise<T> {
  // EIP-1193
  if (typeof provider.request === 'function') {
    return provider.request<T>({ method, params });
  }

  // Legacy web3 provider style
  if (typeof provider.send === 'function') {
    return (await provider.send(method, params)) as T;
  }

  if (typeof provider.sendAsync === 'function') {
    const id = _rpcId++;
    return await new Promise<T>((resolve, reject) => {
      provider.sendAsync!(
        {
          id,
          jsonrpc: '2.0',
          method,
          params,
        },
        (error, response) => {
          if (error) return reject(error);
          if (response?.error) return reject(new Error(response.error.message));
          resolve(response?.result as T);
        }
      );
    });
  }

  throw new Error('CheCko provider does not support request/send/sendAsync');
}

// JSON-RPC request/response types
interface JsonRpcRequest {
  id: number;
  jsonrpc: '2.0';
  method: string;
  params?: unknown[];
}

interface JsonRpcResponse<T = unknown> {
  id: number;
  jsonrpc: '2.0';
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

// CheCko Provider using EIP-1193 style request method
export interface CheCkoProvider {
  isCheCko?: boolean;
  isLineraWallet?: boolean;
  
  // EIP-1193 standard request method (primary method)
  request<T = unknown>(args: { method: string; params?: unknown[] }): Promise<T>;
  
  // Legacy send method (backup)
  send?(method: string, params?: unknown[]): Promise<unknown>;
  sendAsync?(payload: JsonRpcRequest, callback: (error: Error | null, response?: JsonRpcResponse) => void): void;
  
  // Event listeners (EIP-1193)
  on(event: string, callback: (...args: unknown[]) => void): void;
  removeListener?(event: string, callback: (...args: unknown[]) => void): void;
  off?(event: string, callback: (...args: unknown[]) => void): void;
}

declare global {
  interface Window {
    checko?: CheCkoProvider;
    linera?: CheCkoProvider;
    ethereum?: CheCkoProvider; // CheCko may also inject as ethereum for compatibility
  }
}

/**
 * Check if CheCko wallet is installed
 */
export function isCheCkoInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for CheCko-specific providers
  const provider = window.checko || window.linera;
  if (provider) return true;
  
  // Check if ethereum provider is CheCko
  if (window.ethereum?.isCheCko || window.ethereum?.isLineraWallet) {
    return true;
  }
  
  return false;
}

/**
 * Get the CheCko provider instance
 */
export function getCheCkoProvider(): CheCkoProvider | null {
  if (typeof window === 'undefined') return null;
  
  // Prefer CheCko-specific providers
  if (window.checko) return window.checko;
  if (window.linera) return window.linera;
  
  // Fall back to ethereum if it's CheCko
  if (window.ethereum?.isCheCko || window.ethereum?.isLineraWallet) {
    return window.ethereum;
  }
  
  return null;
}

/**
 * Wait for CheCko to be injected (useful on page load)
 */
export function waitForCheCko(timeout = 3000): Promise<CheCkoProvider | null> {
  return new Promise((resolve) => {
    if (isCheCkoInstalled()) {
      resolve(getCheCkoProvider());
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      if (isCheCkoInstalled()) {
        clearInterval(interval);
        resolve(getCheCkoProvider());
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        resolve(null);
      }
    }, 100);
  });
}

/**
 * Connect to CheCko wallet using JSON-RPC
 */
export async function connectCheCko(): Promise<CheCkoAccount | null> {
  const provider = getCheCkoProvider();
  
  if (!provider) {
    throw new Error('CheCko wallet is not installed. Please install the CheCko browser extension.');
  }

  try {
    const accounts = await rpcRequest<string[]>(provider, 'eth_requestAccounts', []);

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts returned');
    }

    // Best-effort chain id
    let chainId = 'unknown';
    try {
      chainId = await rpcRequest<string>(provider, 'eth_chainId', []);
    } catch {
      // ignore
    }

    return {
      address: accounts[0],
      chainId,
    };
  } catch (error) {
    console.error('Failed to connect to CheCko wallet:', error);
    throw error;
  }
}

/**
 * Disconnect from CheCko wallet (clear local state - no RPC method for this typically)
 */
export async function disconnectCheCko(): Promise<void> {
  // Most wallet providers don't have a disconnect RPC method
  // Disconnection is typically handled by clearing local state
  // CheCko may implement wallet_revokePermissions in the future
  console.log('Disconnecting from CheCko wallet');
}

/**
 * Get accounts from CheCko wallet
 */
export async function getCheCkoAccounts(): Promise<string[]> {
  const provider = getCheCkoProvider();
  
  if (!provider) {
    return [];
  }

  try {
    const accounts = await rpcRequest<string[]>(provider, 'eth_accounts', []);
    return accounts || [];
  } catch (error) {
    console.error('Failed to get accounts from CheCko wallet:', error);
  }
  
  return [];
}

/**
 * Convert wei (10^18) to human-readable token amount.
 * Linera/TLINERA uses 18 decimals like Ethereum.
 */
function weiToTokens(weiValue: string | bigint): string {
  const wei = typeof weiValue === 'string' ? BigInt(weiValue) : weiValue;
  const decimals = 18n;
  const divisor = 10n ** decimals;
  
  // Integer division for whole tokens
  const whole = wei / divisor;
  // Remainder for fractional part (keep 4 decimals for display)
  const remainder = wei % divisor;
  const fractional = (remainder * 10000n) / divisor;
  
  if (fractional === 0n) {
    return whole.toString();
  }
  
  // Format with up to 4 decimal places, trimming trailing zeros
  const fracStr = fractional.toString().padStart(4, '0').replace(/0+$/, '');
  return fracStr ? `${whole}.${fracStr}` : whole.toString();
}

/**
 * CheCko balance response structure from balances(chainIds, publicKeys) query.
 * The response is keyed by chainId.
 */
interface CheCkoBalanceResponse {
  [chainId: string]: {
    chain_balance?: string;
    account_balances?: Record<string, string>;
  };
}

/**
 * Parse the balances response from CheCko's linera_graphqlQuery.
 * Returns the total balance (chain_balance + all account_balances).
 */
function parseCheCkoBalancesResponse(balances: CheCkoBalanceResponse): number {
  let total = 0;
  
  for (const chainData of Object.values(balances)) {
    // Add chain balance
    if (chainData.chain_balance) {
      total += parseFloat(chainData.chain_balance);
    }
    
    // Add all account balances
    if (chainData.account_balances) {
      for (const amount of Object.values(chainData.account_balances)) {
        total += parseFloat(amount);
      }
    }
  }
  
  return total;
}

/**
 * Get balance from CheCko wallet using linera_graphqlQuery.
 * 
 * CheCko wallet internally uses a GraphQL query to fetch balances:
 * query { balances(chainIds: [...], publicKeys: [...]) }
 * 
 * The eth_getBalance method in CheCko returns the total as a plain number.
 */
export async function getCheCkoBalance(address: string): Promise<CheCkoBalance | null> {
  const provider = getCheCkoProvider();
  
  if (!provider) {
    console.warn('[CheCko] No provider available');
    return null;
  }

  // Method 1: Try eth_getBalance which CheCko implements internally
  // CheCko returns a plain number (not hex wei) - this is the total balance
  try {
    console.log('[CheCko] Trying eth_getBalance...');
    const balance = await rpcRequest<number | string>(
      provider, 
      'eth_getBalance', 
      [address, 'latest']
    );
    
    console.log('[CheCko] eth_getBalance returned:', balance, typeof balance);
    
    // CheCko returns a plain number, not hex
    if (balance !== null && balance !== undefined) {
      // Handle plain number response (most common from CheCko)
      if (typeof balance === 'number') {
        console.log(`[CheCko] Balance: ${balance}`);
        return {
          available: balance.toString(),
          locked: '0',
        };
      }
      
      // Handle string that's a plain number (not hex)
      if (typeof balance === 'string' && !balance.startsWith('0x')) {
        const numBalance = parseFloat(balance);
        if (!isNaN(numBalance)) {
          console.log(`[CheCko] Balance from string: ${numBalance}`);
          return {
            available: numBalance.toString(),
            locked: '0',
          };
        }
      }
      
      // Handle hex string (wei format) - fallback for other providers
      if (typeof balance === 'string' && balance.startsWith('0x')) {
        const weiBalance = BigInt(balance);
        const tokenBalance = weiToTokens(weiBalance);
        console.log(`[CheCko] Parsed balance from hex: ${tokenBalance}`);
        return {
          available: tokenBalance,
          locked: '0',
        };
      }
    }
  } catch (error) {
    console.log('[CheCko] eth_getBalance failed:', error);
  }

  // Method 2: Try direct linera_graphqlQuery for balances
  // This is the underlying method that eth_getBalance uses internally
  try {
    console.log('[CheCko] Trying linera_graphqlQuery for balances...');
    
    // Get chain ID for the query
    let chainId: string | null = null;
    try {
      chainId = await rpcRequest<string>(provider, 'eth_chainId', []);
      console.log('[CheCko] Chain ID:', chainId);
    } catch {
      console.log('[CheCko] Could not get chain ID');
    }
    
    // The balances query requires chainIds and publicKeys
    const query = `query getChainAccountBalances($chainIds: [String!]!, $publicKeys: [String!]!) {
      balances(chainIds: $chainIds, publicKeys: $publicKeys)
    }`;
    
    // Use the address as the public key and chain ID if available
    const chainIds = chainId ? [chainId] : [];
    const publicKeys = [address];
    
    if (chainIds.length > 0) {
      const result = await rpcRequest<{ balances: CheCkoBalanceResponse }>(
        provider,
        'linera_graphqlQuery',
        [{
          query,
          variables: { chainIds, publicKeys },
          operationName: 'getChainAccountBalances'
        }]
      );
      
      console.log('[CheCko] GraphQL balances result:', result);
      
      if (result?.balances) {
        const total = parseCheCkoBalancesResponse(result.balances);
        console.log(`[CheCko] Total balance from GraphQL: ${total}`);
        return {
          available: total.toString(),
          locked: '0',
        };
      }
    }
  } catch (error) {
    console.log('[CheCko] linera_graphqlQuery failed:', error);
  }

  // Method 3: Try other balance methods as fallback
  const fallbackMethods = [
    { method: 'linera_getBalance', params: [address] },
    { method: 'wallet_getBalance', params: [address] },
  ];

  for (const { method, params } of fallbackMethods) {
    try {
      console.log(`[CheCko] Trying ${method}...`);
      const balance = await rpcRequest<string | number | { available?: string; balance?: string }>(
        provider, 
        method, 
        params
      );
      
      console.log(`[CheCko] ${method} returned:`, balance);

      if (balance !== null && balance !== undefined) {
        // Handle object response
        if (typeof balance === 'object' && balance !== null) {
          const available = (balance as { available?: string; balance?: string }).available 
            || (balance as { available?: string; balance?: string }).balance 
            || '0';
          return {
            available: available.toString(),
            locked: '0',
          };
        }
        
        // Handle plain number or string
        const numBalance = typeof balance === 'number' ? balance : parseFloat(balance.toString());
        if (!isNaN(numBalance)) {
          console.log(`[CheCko] Parsed balance: ${numBalance}`);
          return {
            available: numBalance.toString(),
            locked: '0',
          };
        }
      }
    } catch (error) {
      console.log(`[CheCko] ${method} failed:`, error);
    }
  }

  console.warn('[CheCko] All balance methods failed, returning 0');
  return {
    available: '0',
    locked: '0',
  };
}

/**
 * Execute a GraphQL mutation on Linera (CheCko-specific)
 */
export async function executeLineraGraphQLMutation(
  mutation: string,
  variables?: Record<string, unknown>
): Promise<unknown> {
  const provider = getCheCkoProvider();
  
  if (!provider || typeof provider.request !== 'function') {
    throw new Error('CheCko wallet not available');
  }

  try {
    const result = await rpcRequest(provider, 'linera_graphqlMutation', [{ query: mutation, variables }]);
    return result;
  } catch (error) {
    console.error('GraphQL mutation failed:', error);
    throw error;
  }
}

/**
 * Execute a GraphQL query on Linera (CheCko-specific)
 */
export async function executeLineraGraphQLQuery(
  query: string,
  variables?: Record<string, unknown>
): Promise<unknown> {
  const provider = getCheCkoProvider();
  
  if (!provider || typeof provider.request !== 'function') {
    throw new Error('CheCko wallet not available');
  }

  try {
    const result = await rpcRequest(provider, 'linera_graphqlQuery', [{ query, variables }]);
    return result;
  } catch (error) {
    console.error('GraphQL query failed:', error);
    throw error;
  }
}

/**
 * Check if provider is ready (ping)
 */
export async function pingCheCko(): Promise<boolean> {
  const provider = getCheCkoProvider();
  
  if (!provider || typeof provider.request !== 'function') {
    return false;
  }

  try {
    await rpcRequest(provider, 'checko_ping', []);
    return true;
  } catch {
    return false;
  }
}

/**
 * CheCko wallet extension URL
 */
export const CHECKO_INSTALL_URL = 'https://github.com/respeer-ai/linera-wallet/releases';
