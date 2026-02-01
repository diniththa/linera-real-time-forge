import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { WalletState, UserBalance } from '@/types';
import {
  isCheCkoInstalled,
  getCheCkoProvider,
  waitForCheCko,
  connectCheCko,
  disconnectCheCko,
  getCheCkoBalance,
  getCheCkoAccounts,
  CHECKO_INSTALL_URL,
  CheCkoProvider,
} from '@/lib/checko';

interface WalletContextType {
  wallet: WalletState;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnecting: boolean;
  error: string | null;
  isCheCkoAvailable: boolean;
  installUrl: string;
  showInstallGuide: boolean;
  setShowInstallGuide: (show: boolean) => void;
}

const initialBalance: UserBalance = {
  available: 0,
  locked: 0,
  total: 0,
};

const initialWalletState: WalletState = {
  connected: false,
  address: null,
  chainId: null,
  balance: initialBalance,
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>(initialWalletState);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheCkoAvailable, setIsCheCkoAvailable] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const updateWalletState = useCallback(async (address: string, chainId: string) => {
    try {
      const balanceData = await getCheCkoBalance(address);
      const available = parseFloat(balanceData?.available || '0');
      const locked = parseFloat(balanceData?.locked || '0');
      
      setWallet({
        connected: true,
        address,
        chainId,
        balance: {
          available,
          locked,
          total: available + locked,
        },
      });
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      // If balance fetch fails, still connect with 0 balance
      setWallet({
        connected: true,
        address,
        chainId,
        balance: initialBalance,
      });
    }
  }, []);

  // Check for CheCko wallet on mount
  useEffect(() => {
    const checkCheCko = async () => {
      const provider = await waitForCheCko();
      setIsCheCkoAvailable(!!provider);
      
      if (provider) {
        // Check if already connected
        try {
          const accounts = await getCheCkoAccounts();
          if (accounts.length > 0) {
            let chainId = 'unknown';
            try {
              if (typeof provider.request === 'function') {
                chainId = await provider.request<string>({ method: 'eth_chainId' });
              }
            } catch {
              // Ignore chain ID fetch errors
            }
            await updateWalletState(accounts[0], chainId);
          }
        } catch (err) {
          console.log('No existing connection:', err);
        }

        // Listen for account changes
        provider.on('accountsChanged', async (accounts: unknown) => {
          const accountsArray = accounts as string[];
          if (!accountsArray || accountsArray.length === 0) {
            setWallet(initialWalletState);
          } else {
            await updateWalletState(accountsArray[0], wallet.chainId || 'unknown');
          }
        });

        // Listen for chain changes
        provider.on('chainChanged', (chainId: unknown) => {
          if (wallet.connected && wallet.address) {
            setWallet(prev => ({ ...prev, chainId: chainId as string }));
          }
        });

        // Listen for disconnect
        provider.on('disconnect', () => {
          setWallet(initialWalletState);
        });
      }
    };

    checkCheCko();
  }, [updateWalletState]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Re-check if wallet is available
      const provider = getCheCkoProvider();
      
      if (!provider) {
        // CheCko not installed - show install guide
        setError('CheCko wallet not found. Please install the extension.');
        setShowInstallGuide(true);
        setIsConnecting(false);
        return;
      }

      const account = await connectCheCko();
      
      if (account) {
        await updateWalletState(account.address, account.chainId);
      } else {
        setError('Failed to connect to CheCko wallet. No account returned.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet. Please try again.';
      setError(errorMessage);
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [updateWalletState]);

  const disconnect = useCallback(async () => {
    try {
      await disconnectCheCko();
    } catch (err) {
      console.error('Disconnect error:', err);
    }
    setWallet(initialWalletState);
    setError(null);
  }, []);

  return (
    <WalletContext.Provider value={{ 
      wallet, 
      connect, 
      disconnect, 
      isConnecting, 
      error, 
      isCheCkoAvailable,
      installUrl: CHECKO_INSTALL_URL,
      showInstallGuide,
      setShowInstallGuide,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
