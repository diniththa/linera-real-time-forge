import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { WalletState, UserBalance } from '@/types';
import {
  isCheCkoInstalled,
  getCheCkoProvider,
  waitForCheCko,
  connectCheCko,
  disconnectCheCko,
  getCheCkoBalance,
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

  // Check for CheCko wallet on mount
  useEffect(() => {
    const checkCheCko = async () => {
      const provider = await waitForCheCko();
      setIsCheCkoAvailable(!!provider);
      
      if (provider) {
        // Listen for account changes
        provider.on('accountsChanged', async () => {
          const accounts = await provider.getAccounts();
          if (accounts.length === 0) {
            setWallet(initialWalletState);
          } else {
            const account = accounts[0];
            await updateWalletState(account.address, account.chainId, provider);
          }
        });

        // Listen for chain changes
        provider.on('chainChanged', async (chainId: unknown) => {
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
  }, []);

  const updateWalletState = async (address: string, chainId: string, provider: CheCkoProvider) => {
    try {
      const balanceData = await provider.getBalance(address);
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
      // If balance fetch fails, still connect with 0 balance
      setWallet({
        connected: true,
        address,
        chainId,
        balance: initialBalance,
      });
    }
  };

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const provider = getCheCkoProvider();
      
      if (!provider) {
        // CheCko not installed - open install page
        setError('CheCko wallet not found. Please install the extension.');
        window.open(CHECKO_INSTALL_URL, '_blank');
        setIsConnecting(false);
        return;
      }

      const account = await connectCheCko();
      
      if (account) {
        await updateWalletState(account.address, account.chainId, provider);
      } else {
        setError('Failed to connect to CheCko wallet.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet. Please try again.';
      setError(errorMessage);
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

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
