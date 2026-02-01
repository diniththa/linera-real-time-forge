/**
 * CheCko Wallet Integration for Linera Blockchain
 * Browser wallet by ResPeer: https://github.com/respeer-ai/linera-wallet
 *
 * CheCko uses JSON-RPC messaging similar to MetaMask/EIP-1193 pattern.
 * It injects a provider into the window object for dApp communication.
 */

import { keccak_256 } from 'js-sha3';

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
  // NOTE: EIP-1193 typically uses an array, but CheCko also uses object params
  // (e.g. { publicKey, query: { query, variables } } for linera_graphqlQuery).
  params: unknown = []
): Promise<T> {
  // EIP-1193
  if (typeof provider.request === 'function') {
    return provider.request<T>({ method, params });
  }

  // Legacy web3 provider style
  if (typeof provider.send === 'function') {
    const legacyParams = Array.isArray(params) ? params : params === undefined ? [] : [params];
    return (await provider.send(method, legacyParams)) as T;
  }

  if (typeof provider.sendAsync === 'function') {
    const id = _rpcId++;
    const legacyParams = Array.isArray(params) ? params : params === undefined ? [] : [params];
    return await new Promise<T>((resolve, reject) => {
      provider.sendAsync!(
        {
          id,
          jsonrpc: '2.0',
          method,
          params: legacyParams,
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
  providers?: CheCkoProvider[]; // some wallets (e.g. MetaMask) expose multiple injected providers
  
  // EIP-1193 standard request method (primary method)
  request<T = unknown>(args: { method: string; params?: unknown }): Promise<T>;
  
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

function pickCheCkoFromEthereum(ethereum: CheCkoProvider | undefined): CheCkoProvider | null {
  if (!ethereum) return null;

  // Some extensions inject multiple providers under window.ethereum.providers.
  if (Array.isArray(ethereum.providers) && ethereum.providers.length > 0) {
    return (
      ethereum.providers.find((p) => p?.isCheCko || p?.isLineraWallet) ??
      null
    );
  }

  if (ethereum.isCheCko || ethereum.isLineraWallet) return ethereum;
  return null;
}

/**
 * Check if CheCko wallet is installed
 */
export function isCheCkoInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for CheCko-specific providers
  const provider = window.checko || window.linera;
  if (provider) return true;

  // Check if ethereum provider (or one of its sub-providers) is CheCko
  if (pickCheCkoFromEthereum(window.ethereum) != null) return true;
  
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

  // Fall back to ethereum if it's CheCko (or one of its providers)
  const picked = pickCheCkoFromEthereum(window.ethereum);
  if (picked) return picked;
  
  return null;
}

function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  const clean = normalized.length % 2 === 0 ? normalized : `0${normalized}`;

  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

// Matches linera-meme's approach: owner = keccak256("Ed25519PublicKey::" + publicKeyBytes)
function ownerFromPublicKey(publicKey: string): string {
  const publicKeyBytes = hexToBytes(publicKey);
  const typeNameBytes = new TextEncoder().encode('Ed25519PublicKey::');
  const bytes = new Uint8Array([...typeNameBytes, ...publicKeyBytes]);
  return keccak_256(bytes);
}

function formalizeOwner(owner: string): string {
  return owner.startsWith('0x') ? owner : `0x${owner}`;
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
 * Get balance from CheCko wallet.
 * 
 * CheCko wallet's eth_getBalance internally uses a GraphQL query to fetch balances
 * and returns a plain number (not hex wei) representing the total balance.
 * 
 * Based on linera-wallet source: src-bex/middleware/rpcimpl/ethgetbalance.ts
 */
export async function getCheCkoBalance(address: string): Promise<CheCkoBalance | null> {
  const provider = getCheCkoProvider();
  
  if (!provider) {
    console.warn('[CheCko] No provider available');
    return null;
  }

  // Method 0 (preferred): linera_graphqlQuery balances(chainOwners) like linera-meme
  // This avoids relying on eth_getBalance and also confirms we're talking to the Linera wallet,
  // not a different injected provider (e.g. MetaMask).
  try {
    // Try to get chainId (CheCko supports metamask_getProviderState)
    let chainId: string | null = null;
    try {
      const state = await rpcRequest<Record<string, unknown>>(provider, 'metamask_getProviderState');
      if (typeof state?.chainId === 'string') chainId = state.chainId;
    } catch {
      // ignore
    }
    if (!chainId) {
      try {
        chainId = await rpcRequest<string>(provider, 'eth_chainId', []);
      } catch {
        // ignore
      }
    }

    if (chainId) {
      const chainIdNormalized = chainId.startsWith('0x') ? chainId.substring(2) : chainId;
      const owner = formalizeOwner(ownerFromPublicKey(address));
      const BALANCES_CHAIN_OWNERS_QUERY = `query balances($chainOwners: [ChainOwners!]!) {\n  balances(chainOwners: $chainOwners)\n}`;

      const result = await rpcRequest<unknown>(provider, 'linera_graphqlQuery', {
        publicKey: address,
        query: {
          query: BALANCES_CHAIN_OWNERS_QUERY,
          variables: {
            chainOwners: [
              {
                chainId: chainIdNormalized,
                owners: [owner],
              },
            ],
          },
        },
      });

      // CheCko may return either the raw balances map or a wrapped object.
      const balancesAny = result as any;
      const balancesMap =
        balancesAny?.balances ??
        balancesAny?.data?.balances ??
        balancesAny;

      if (balancesMap && typeof balancesMap === 'object') {
        const chainEntry = balancesMap[chainIdNormalized] ?? balancesMap[chainId];

        const chainBalanceStr =
          chainEntry?.chainBalance ??
          chainEntry?.chain_balance ??
          '0';
        const ownerBalances =
          chainEntry?.ownerBalances ??
          chainEntry?.account_balances ??
          {};

        let total = parseFloat(chainBalanceStr || '0');
        if (ownerBalances && typeof ownerBalances === 'object') {
          for (const amount of Object.values(ownerBalances as Record<string, string>)) {
            total += parseFloat(amount || '0');
          }
        }

        if (!isNaN(total)) {
          console.log('[CheCko] Balance from linera_graphqlQuery (chainOwners):', total);
          return { available: total.toString(), locked: '0' };
        }
      }
    }
  } catch (error) {
    console.log('[CheCko] linera_graphqlQuery (chainOwners) failed:', error);
  }

  // Method 1: Try eth_getBalance - CheCko returns a plain number (total balance)
  // This is the preferred method as CheCko handles all the internal complexity
  try {
    console.log('[CheCko] Calling eth_getBalance for address:', address);
    const balance = await rpcRequest<number | string>(
      provider, 
      'eth_getBalance', 
      [address, 'latest']
    );
    
    console.log('[CheCko] eth_getBalance raw response:', balance, typeof balance);
    
    if (balance !== null && balance !== undefined) {
      // CheCko returns a plain number (float), not hex
      if (typeof balance === 'number') {
        console.log(`[CheCko] Balance (number): ${balance}`);
        return {
          available: balance.toString(),
          locked: '0',
        };
      }
      
      // Handle string that's a plain number (not hex)
      if (typeof balance === 'string') {
        // Check if it's hex (starts with 0x)
        if (balance.startsWith('0x')) {
          // Convert from wei to tokens (18 decimals)
          const weiBalance = BigInt(balance);
          const tokenBalance = weiToTokens(weiBalance);
          console.log(`[CheCko] Balance from hex: ${tokenBalance}`);
          return {
            available: tokenBalance,
            locked: '0',
          };
        }
        
        // Plain number string
        const numBalance = parseFloat(balance);
        if (!isNaN(numBalance)) {
          console.log(`[CheCko] Balance (string): ${numBalance}`);
          return {
            available: numBalance.toString(),
            locked: '0',
          };
        }
      }
      
      // Handle object response (rare, but possible)
      if (typeof balance === 'object') {
        const balanceObj = balance as Record<string, unknown>;
        // Check for balances property (GraphQL response structure)
        if (balanceObj.balances) {
          const total = parseCheCkoBalancesResponse(balanceObj.balances as CheCkoBalanceResponse);
          console.log(`[CheCko] Balance from balances object: ${total}`);
          return {
            available: total.toString(),
            locked: '0',
          };
        }
      }
    }
  } catch (error) {
    console.log('[CheCko] eth_getBalance failed:', error);
  }

  // Method 2 (legacy CheCko): balances(chainIds, publicKeys)
  // Keep as a fallback for wallet builds that still expose this path.
  try {
    console.log('[CheCko] Trying linera_graphqlQuery for balances (chainIds/publicKeys)...');

    let chainId: string | null = null;
    try {
      chainId = await rpcRequest<string>(provider, 'eth_chainId', []);
      console.log('[CheCko] Current chainId:', chainId);
    } catch {
      // ignore
    }

    if (chainId) {
      const publicKey = address.startsWith('0x') ? address.substring(2) : address;

      const query = `query getChainAccountBalances($chainIds: [String!]!, $publicKeys: [String!]!) {\n  balances(chainIds: $chainIds, publicKeys: $publicKeys)\n}`;

      // Some wallet builds expect params as an array; some as an object.
      const tryShapes: unknown[] = [
        // object params
        {
          query: {
            query,
            variables: { chainIds: [chainId], publicKeys: [publicKey] },
            operationName: 'getChainAccountBalances',
          },
        },
        // array params
        [
          {
            query: {
              query,
              variables: { chainIds: [chainId], publicKeys: [publicKey] },
              operationName: 'getChainAccountBalances',
            },
          },
        ],
      ];

      for (const params of tryShapes) {
        try {
          const result = await rpcRequest<{ balances?: CheCkoBalanceResponse }>(
            provider,
            'linera_graphqlQuery',
            params
          );

          console.log('[CheCko] linera_graphqlQuery result:', result);
          if (result?.balances) {
            const total = parseCheCkoBalancesResponse(result.balances);
            console.log(`[CheCko] Total balance from GraphQL: ${total}`);
            return { available: total.toString(), locked: '0' };
          }
        } catch {
          // try next shape
        }
      }
    }
  } catch (error) {
    console.log('[CheCko] linera_graphqlQuery (chainIds/publicKeys) failed:', error);
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
