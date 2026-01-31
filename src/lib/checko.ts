/**
 * CheCko Wallet Integration for Linera Blockchain
 * Browser wallet by ResPeer: https://github.com/respeer-ai/linera-wallet
 * 
 * CheCko injects a provider into the window object for dApp communication.
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

export interface CheCkoProvider {
  isCheCko: boolean;
  
  // Connection methods
  connect(): Promise<CheCkoAccount>;
  disconnect(): Promise<void>;
  
  // Account methods
  getAccounts(): Promise<CheCkoAccount[]>;
  getBalance(address: string): Promise<CheCkoBalance>;
  
  // Transaction methods
  signTransaction(transaction: unknown): Promise<string>;
  sendTransaction(signedTransaction: string): Promise<string>;
  
  // Linera-specific methods
  signAndSubmit?(params: {
    chainId: string;
    applicationId: string;
    operation: unknown;
  }): Promise<{ hash: string }>;
  
  // Event listeners
  on(event: string, callback: (...args: unknown[]) => void): void;
  off(event: string, callback: (...args: unknown[]) => void): void;
  
  // Chain info
  getChainId(): Promise<string>;
}

declare global {
  interface Window {
    checko?: CheCkoProvider;
    linera?: CheCkoProvider;
  }
}

/**
 * Check if CheCko wallet is installed
 */
export function isCheCkoInstalled(): boolean {
  return typeof window !== 'undefined' && (!!window.checko || !!window.linera);
}

/**
 * Get the CheCko provider instance
 */
export function getCheCkoProvider(): CheCkoProvider | null {
  if (typeof window === 'undefined') return null;
  return window.checko || window.linera || null;
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
 * Connect to CheCko wallet
 */
export async function connectCheCko(): Promise<CheCkoAccount | null> {
  const provider = getCheCkoProvider();
  
  if (!provider) {
    throw new Error('CheCko wallet is not installed. Please install the CheCko browser extension.');
  }

  try {
    const account = await provider.connect();
    return account;
  } catch (error) {
    console.error('Failed to connect to CheCko wallet:', error);
    throw error;
  }
}

/**
 * Disconnect from CheCko wallet
 */
export async function disconnectCheCko(): Promise<void> {
  const provider = getCheCkoProvider();
  
  if (provider) {
    try {
      await provider.disconnect();
    } catch (error) {
      console.error('Failed to disconnect from CheCko wallet:', error);
    }
  }
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
    const balance = await provider.getBalance(address);
    return balance;
  } catch (error) {
    console.error('Failed to get balance from CheCko wallet:', error);
    return null;
  }
}

/**
 * CheCko wallet extension URL
 */
export const CHECKO_INSTALL_URL = 'https://github.com/respeer-ai/linera-wallet/releases';
