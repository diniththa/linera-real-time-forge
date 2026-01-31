import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { WalletState, UserBalance } from '@/types';

interface WalletContextType {
  wallet: WalletState;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnecting: boolean;
  error: string | null;
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

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // TODO: Integrate with CheCko/Croissant wallet
      // For now, simulate wallet connection
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulated connected wallet
      const mockAddress = '0x' + Math.random().toString(16).slice(2, 10) + '...' + Math.random().toString(16).slice(2, 6);
      
      setWallet({
        connected: true,
        address: mockAddress,
        chainId: 'linera-testnet-conway',
        balance: {
          available: 1000,
          locked: 0,
          total: 1000,
        },
      });
    } catch (err) {
      setError('Failed to connect wallet. Please try again.');
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet(initialWalletState);
    setError(null);
  }, []);

  return (
    <WalletContext.Provider value={{ wallet, connect, disconnect, isConnecting, error }}>
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
