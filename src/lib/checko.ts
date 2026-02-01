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
    // Use EIP-1193 request method with eth_requestAccounts
    if (typeof provider.request === 'function') {
      const accounts = await provider.request<string[]>({ 
        method: 'eth_requestAccounts',
        params: [] 
      });
      
      if (accounts && accounts.length > 0) {
        // Get chain ID
        let chainId = '';
        try {
          chainId = await provider.request<string>({ method: 'eth_chainId' });
        } catch {
          chainId = 'unknown';
        }
        
        return {
          address: accounts[0],
          chainId: chainId,
        };
      }
    }
    
    // Try legacy send method if request is not available
    if (typeof provider.send === 'function') {
      const result = await provider.send('eth_requestAccounts', []);
      if (Array.isArray(result) && result.length > 0) {
        return {
          address: result[0] as string,
          chainId: 'unknown',
        };
      }
    }
    
    // Try sendAsync as last resort
    if (typeof provider.sendAsync === 'function') {
      return new Promise((resolve, reject) => {
        provider.sendAsync!(
          {
            id: 1,
            jsonrpc: '2.0',
            method: 'eth_requestAccounts',
            params: [],
          },
          (error, response) => {
            if (error) {
              reject(error);
            } else if (response?.result && Array.isArray(response.result)) {
              resolve({
                address: response.result[0] as string,
                chainId: 'unknown',
              });
            } else if (response?.error) {
              reject(new Error(response.error.message));
            } else {
              reject(new Error('No accounts returned'));
            }
          }
        );
      });
    }
    
    throw new Error('CheCko provider does not support any known connection method');
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
    if (typeof provider.request === 'function') {
      const accounts = await provider.request<string[]>({ 
        method: 'eth_accounts',
        params: [] 
      });
      return accounts || [];
    }
  } catch (error) {
    console.error('Failed to get accounts from CheCko wallet:', error);
  }
  
  return [];
}

/**
 * Get balance from CheCko wallet
 */
export async function getCheCkoBalance(address: string): Promise<CheCkoBalance | null> {
  const provider = getCheCkoProvider();
  
  if (!provider) {
    return null;
  }

  try {
    if (typeof provider.request === 'function') {
      const balance = await provider.request<string>({ 
        method: 'eth_getBalance',
        params: [address, 'latest'] 
      });
      
      // Parse hex balance if returned
      const balanceValue = balance ? 
        (typeof balance === 'string' && balance.startsWith('0x') ? 
          parseInt(balance, 16).toString() : 
          balance.toString()) : 
        '0';
      
      return {
        available: balanceValue,
        locked: '0',
      };
    }
  } catch (error) {
    console.error('Failed to get balance from CheCko wallet:', error);
  }
  
  return null;
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
    const result = await provider.request({
      method: 'linera_graphqlMutation',
      params: [{ query: mutation, variables }],
    });
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
    const result = await provider.request({
      method: 'linera_graphqlQuery',
      params: [{ query, variables }],
    });
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
    await provider.request({ method: 'checko_ping' });
    return true;
  } catch {
    return false;
  }
}

/**
 * CheCko wallet extension URL
 */
export const CHECKO_INSTALL_URL = 'https://github.com/respeer-ai/linera-wallet/releases';
