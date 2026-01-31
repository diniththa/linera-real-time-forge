import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Market, MarketOption } from '@/types';

export interface BetSelection {
  id: string;
  market: Market;
  option: MarketOption;
  amount: number;
  potentialWin: number;
}

interface BettingContextType {
  selections: BetSelection[];
  isSlipOpen: boolean;
  totalStake: number;
  totalPotentialWin: number;
  addSelection: (market: Market, option: MarketOption, amount?: number) => void;
  removeSelection: (selectionId: string) => void;
  updateAmount: (selectionId: string, amount: number) => void;
  clearSelections: () => void;
  toggleSlip: () => void;
  openSlip: () => void;
  closeSlip: () => void;
}

const BettingContext = createContext<BettingContextType | undefined>(undefined);

export function BettingProvider({ children }: { children: ReactNode }) {
  const [selections, setSelections] = useState<BetSelection[]>([]);
  const [isSlipOpen, setIsSlipOpen] = useState(false);

  const addSelection = useCallback((market: Market, option: MarketOption, amount = 10) => {
    const existingIndex = selections.findIndex(s => s.market.id === market.id);
    
    if (existingIndex >= 0) {
      // Update existing selection for this market
      setSelections(prev => prev.map((s, i) => 
        i === existingIndex 
          ? { ...s, option, potentialWin: amount * option.odds }
          : s
      ));
    } else {
      // Add new selection
      const newSelection: BetSelection = {
        id: `${market.id}-${option.id}-${Date.now()}`,
        market,
        option,
        amount,
        potentialWin: amount * option.odds,
      };
      setSelections(prev => [...prev, newSelection]);
    }
    setIsSlipOpen(true);
  }, [selections]);

  const removeSelection = useCallback((selectionId: string) => {
    setSelections(prev => prev.filter(s => s.id !== selectionId));
  }, []);

  const updateAmount = useCallback((selectionId: string, amount: number) => {
    setSelections(prev => prev.map(s => 
      s.id === selectionId 
        ? { ...s, amount, potentialWin: amount * s.option.odds }
        : s
    ));
  }, []);

  const clearSelections = useCallback(() => {
    setSelections([]);
  }, []);

  const toggleSlip = useCallback(() => setIsSlipOpen(prev => !prev), []);
  const openSlip = useCallback(() => setIsSlipOpen(true), []);
  const closeSlip = useCallback(() => setIsSlipOpen(false), []);

  const totalStake = selections.reduce((sum, s) => sum + s.amount, 0);
  const totalPotentialWin = selections.reduce((sum, s) => sum + s.potentialWin, 0);

  return (
    <BettingContext.Provider value={{
      selections,
      isSlipOpen,
      totalStake,
      totalPotentialWin,
      addSelection,
      removeSelection,
      updateAmount,
      clearSelections,
      toggleSlip,
      openSlip,
      closeSlip,
    }}>
      {children}
    </BettingContext.Provider>
  );
}

export function useBetting() {
  const context = useContext(BettingContext);
  if (!context) {
    throw new Error('useBetting must be used within a BettingProvider');
  }
  return context;
}
