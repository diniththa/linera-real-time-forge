// React Hooks for Linera Client
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { getLineraClient } from './client';
import type {
  LineraMarket,
  LineraBet,
  LineraBalance,
  MarketId,
  BetId,
  Amount,
} from './types';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/hooks/use-toast';

/**
 * Hook to get the Linera client instance
 */
export function useLineraClient() {
  const client = useMemo(() => getLineraClient(), []);
  return client;
}

/**
 * Hook to get open markets
 */
export function useOpenMarkets() {
  const client = useLineraClient();

  return useQuery({
    queryKey: ['linera', 'markets', 'open'],
    queryFn: () => client.getOpenMarkets(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
}

/**
 * Hook to get markets for a specific match
 */
export function useMatchMarkets(matchId: string | undefined) {
  const client = useLineraClient();

  return useQuery({
    queryKey: ['linera', 'markets', 'match', matchId],
    queryFn: () => client.getMarketsForMatch(matchId!),
    enabled: !!matchId,
    staleTime: 15000,
    refetchInterval: 30000,
  });
}

/**
 * Hook to get a specific market
 */
export function useMarket(marketId: MarketId | undefined) {
  const client = useLineraClient();

  return useQuery({
    queryKey: ['linera', 'market', marketId],
    queryFn: () => client.getMarket(marketId!),
    enabled: !!marketId,
    staleTime: 10000,
    refetchInterval: 15000,
  });
}

/**
 * Hook to get user's bets
 */
export function useUserBets() {
  const client = useLineraClient();
  const { wallet } = useWallet();

  return useQuery({
    queryKey: ['linera', 'bets', wallet.address],
    queryFn: () => client.getUserBets(wallet.address || undefined),
    enabled: wallet.connected && !!wallet.address,
    staleTime: 30000,
  });
}

/**
 * Hook to get user's Linera balance
 */
export function useLineraBalance() {
  const client = useLineraClient();
  const { wallet } = useWallet();

  return useQuery({
    queryKey: ['linera', 'balance', wallet.address],
    queryFn: () => client.getBalance(wallet.address || undefined),
    enabled: wallet.connected && !!wallet.address,
    staleTime: 15000,
    refetchInterval: 30000,
  });
}

/**
 * Hook to calculate potential payout
 */
export function usePotentialPayout(
  marketId: MarketId | undefined,
  optionId: number | undefined,
  amount: number | undefined
) {
  const client = useLineraClient();

  return useQuery({
    queryKey: ['linera', 'payout', marketId, optionId, amount],
    queryFn: () => client.calculatePayout(marketId!, optionId!, amount!),
    enabled: !!marketId && optionId !== undefined && !!amount && amount > 0,
    staleTime: 5000,
  });
}

/**
 * Hook to place a bet
 */
export function usePlaceBet() {
  const client = useLineraClient();
  const queryClient = useQueryClient();
  const { wallet } = useWallet();

  return useMutation({
    mutationFn: async (params: {
      marketId: MarketId;
      optionId: number;
      amount: number;
    }) => {
      if (!wallet.connected) {
        throw new Error('Wallet not connected');
      }

      // Ensure client is connected
      if (!client.isConnected()) {
        await client.connect();
      }

      return client.placeBet({
        marketId: params.marketId,
        optionId: params.optionId,
        amount: params.amount.toString(),
      });
    },
    onSuccess: (data, variables) => {
      toast({
        title: 'Bet placed!',
        description: `Bet ID: ${data.betId} at ${(data.odds / 1000).toFixed(2)}x odds`,
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['linera', 'bets'] });
      queryClient.invalidateQueries({ queryKey: ['linera', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['linera', 'market', variables.marketId] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to place bet',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to claim winnings
 */
export function useClaimWinnings() {
  const client = useLineraClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (betId: BetId) => {
      if (!client.isConnected()) {
        await client.connect();
      }
      return client.claimWinnings(betId);
    },
    onSuccess: (data) => {
      toast({
        title: 'Winnings claimed!',
        description: `${data.amount} LPT added to your balance`,
      });

      queryClient.invalidateQueries({ queryKey: ['linera', 'bets'] });
      queryClient.invalidateQueries({ queryKey: ['linera', 'balance'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to claim winnings',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to deposit tokens
 */
export function useDeposit() {
  const client = useLineraClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amount: number) => {
      if (!client.isConnected()) {
        await client.connect();
      }
      return client.deposit(amount);
    },
    onSuccess: (data) => {
      toast({
        title: 'Deposit successful!',
        description: `New balance: ${data.newBalance} LPT`,
      });

      queryClient.invalidateQueries({ queryKey: ['linera', 'balance'] });
    },
    onError: (error) => {
      toast({
        title: 'Deposit failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to withdraw tokens
 */
export function useWithdraw() {
  const client = useLineraClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amount: number) => {
      if (!client.isConnected()) {
        await client.connect();
      }
      return client.withdraw(amount);
    },
    onSuccess: (data) => {
      toast({
        title: 'Withdrawal successful!',
        description: `New balance: ${data.newBalance} LPT`,
      });

      queryClient.invalidateQueries({ queryKey: ['linera', 'balance'] });
    },
    onError: (error) => {
      toast({
        title: 'Withdrawal failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to create a market (admin only)
 */
export function useCreateMarket() {
  const client = useLineraClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      matchId: string;
      marketType: string;
      title: string;
      options: string[];
      locksAt: Date;
    }) => {
      if (!client.isConnected()) {
        await client.connect();
      }
      return client.createMarket(params);
    },
    onSuccess: (data) => {
      toast({
        title: 'Market created!',
        description: `Market ID: ${data.marketId}`,
      });

      queryClient.invalidateQueries({ queryKey: ['linera', 'markets'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create market',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to resolve a market (admin only)
 */
export function useResolveMarket() {
  const client = useLineraClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { marketId: MarketId; winningOption: number }) => {
      if (!client.isConnected()) {
        await client.connect();
      }
      return client.resolveMarket(params.marketId, params.winningOption);
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Market resolved!',
        description: `Winning option: ${variables.winningOption}`,
      });

      queryClient.invalidateQueries({ queryKey: ['linera', 'markets'] });
      queryClient.invalidateQueries({ queryKey: ['linera', 'market', variables.marketId] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to resolve market',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
}
