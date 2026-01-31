// Copyright (c) Live Play Predictor
// SPDX-License-Identifier: Apache-2.0

//! Application state for the Live Play Predictor contract.
//!
//! Uses Linera's view system for persistent storage with support for
//! efficient queries and updates.

use linera_sdk::views::{
    linera_views, MapView, RegisterView, RootView, ViewStorageContext,
};
use live_predict::{Amount, Bet, BetId, Market, MarketId};

/// The main application state stored on-chain.
#[derive(RootView, async_graphql::SimpleObject)]
#[view(context = ViewStorageContext)]
pub struct LivePredictState {
    /// Counter for generating unique market IDs.
    pub next_market_id: RegisterView<MarketId>,
    
    /// Counter for generating unique bet IDs.
    pub next_bet_id: RegisterView<BetId>,
    
    /// All betting markets indexed by ID.
    #[graphql(skip)]
    pub markets: MapView<MarketId, Market>,
    
    /// All bets indexed by ID.
    #[graphql(skip)]
    pub bets: MapView<BetId, Bet>,
    
    /// User balances indexed by chain ID (owner address).
    #[graphql(skip)]
    pub balances: MapView<String, Amount>,
    
    /// Bets by user (chain ID -> list of bet IDs).
    #[graphql(skip)]
    pub user_bets: MapView<String, Vec<BetId>>,
    
    /// Bets by market (market ID -> list of bet IDs).
    #[graphql(skip)]
    pub market_bets: MapView<MarketId, Vec<BetId>>,
    
    /// Active (open) market IDs for quick lookup.
    pub active_markets: RegisterView<Vec<MarketId>>,
    
    /// Total volume of all bets (lifetime).
    pub total_volume: RegisterView<Amount>,
    
    /// Protocol fee rate (basis points, e.g., 100 = 1%).
    pub fee_rate_bps: RegisterView<u32>,
    
    /// Accumulated protocol fees.
    pub protocol_fees: RegisterView<Amount>,
}

impl LivePredictState {
    /// Get the next market ID and increment counter.
    pub async fn allocate_market_id(&mut self) -> MarketId {
        let id = self.next_market_id.get();
        self.next_market_id.set(id + 1);
        id
    }
    
    /// Get the next bet ID and increment counter.
    pub async fn allocate_bet_id(&mut self) -> BetId {
        let id = self.next_bet_id.get();
        self.next_bet_id.set(id + 1);
        id
    }
    
    /// Get a market by ID.
    pub async fn get_market(&self, market_id: MarketId) -> Option<Market> {
        self.markets.get(&market_id).await.ok().flatten()
    }
    
    /// Get a bet by ID.
    pub async fn get_bet(&self, bet_id: BetId) -> Option<Bet> {
        self.bets.get(&bet_id).await.ok().flatten()
    }
    
    /// Get user balance.
    pub async fn get_balance(&self, owner: &str) -> Amount {
        self.balances.get(&owner.to_string()).await.ok().flatten().unwrap_or(0)
    }
    
    /// Update user balance.
    pub async fn set_balance(&mut self, owner: &str, amount: Amount) {
        self.balances.insert(&owner.to_string(), amount).expect("Failed to update balance");
    }
    
    /// Add a bet to user's bet list.
    pub async fn add_user_bet(&mut self, owner: &str, bet_id: BetId) {
        let mut bets = self.user_bets.get(&owner.to_string()).await.ok().flatten().unwrap_or_default();
        bets.push(bet_id);
        self.user_bets.insert(&owner.to_string(), bets).expect("Failed to add user bet");
    }
    
    /// Add a bet to market's bet list.
    pub async fn add_market_bet(&mut self, market_id: MarketId, bet_id: BetId) {
        let mut bets = self.market_bets.get(&market_id).await.ok().flatten().unwrap_or_default();
        bets.push(bet_id);
        self.market_bets.insert(&market_id, bets).expect("Failed to add market bet");
    }
    
    /// Add market to active markets list.
    pub async fn add_active_market(&mut self, market_id: MarketId) {
        let mut markets = self.active_markets.get().clone();
        markets.push(market_id);
        self.active_markets.set(markets);
    }
    
    /// Remove market from active markets list.
    pub async fn remove_active_market(&mut self, market_id: MarketId) {
        let mut markets = self.active_markets.get().clone();
        markets.retain(|&id| id != market_id);
        self.active_markets.set(markets);
    }
    
    /// Calculate odds for an option based on current pool distribution.
    /// Returns odds scaled by 1000 (e.g., 1500 = 1.5x).
    pub fn calculate_odds(total_pool: Amount, option_pool: Amount) -> u32 {
        if option_pool == 0 {
            return 2000; // Default 2x odds for empty pool
        }
        
        // Odds = total_pool / option_pool, scaled by 1000
        let odds = (total_pool as u64 * 1000) / (option_pool as u64);
        odds.min(10000) as u32 // Cap at 10x
    }
    
    /// Calculate potential payout for a bet.
    pub fn calculate_payout(amount: Amount, odds: u32, fee_rate_bps: u32) -> Amount {
        let gross_payout = (amount as u64 * odds as u64) / 1000;
        let fee = (gross_payout * fee_rate_bps as u64) / 10000;
        (gross_payout - fee) as Amount
    }
}
