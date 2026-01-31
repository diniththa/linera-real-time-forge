// Copyright (c) Live Play Predictor
// SPDX-License-Identifier: Apache-2.0

//! Service implementation for the Live Play Predictor application.
//!
//! The service exposes a GraphQL API for querying markets, bets, and user data.

#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use std::sync::Arc;

use async_graphql::{Context, EmptySubscription, Object, Request, Response, Schema};
use linera_sdk::{linera_base_types::WithServiceAbi, views::View, Service, ServiceRuntime};
use live_predict::{Amount, Bet, BetId, LivePredictAbi, Market, MarketId, MarketStatus, Operation};

use self::state::LivePredictState;

/// The Live Play Predictor service.
pub struct LivePredictService {
    state: Arc<LivePredictState>,
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(LivePredictService);

impl WithServiceAbi for LivePredictService {
    type Abi = LivePredictAbi;
}

impl Service for LivePredictService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = LivePredictState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        LivePredictService {
            state: Arc::new(state),
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, request: Request) -> Response {
        let schema = Schema::build(
            QueryRoot {
                state: self.state.clone(),
            },
            MutationRoot {
                runtime: self.runtime.clone(),
            },
            EmptySubscription,
        )
        .finish();
        schema.execute(request).await
    }
}

/// GraphQL query root.
struct QueryRoot {
    state: Arc<LivePredictState>,
}

#[Object]
impl QueryRoot {
    /// Get a market by ID.
    async fn market(&self, id: MarketId) -> Option<Market> {
        self.state.get_market(id).await
    }

    /// Get all active (open) markets.
    async fn active_markets(&self) -> Vec<Market> {
        let market_ids = self.state.active_markets.get().clone();
        let mut markets = Vec::new();
        for id in market_ids {
            if let Some(market) = self.state.get_market(id).await {
                markets.push(market);
            }
        }
        markets
    }

    /// Get markets by match ID.
    async fn markets_by_match(&self, match_id: String) -> Vec<Market> {
        let market_ids = self.state.active_markets.get().clone();
        let mut markets = Vec::new();
        for id in market_ids {
            if let Some(market) = self.state.get_market(id).await {
                if market.match_id == match_id {
                    markets.push(market);
                }
            }
        }
        markets
    }

    /// Get a bet by ID.
    async fn bet(&self, id: BetId) -> Option<Bet> {
        self.state.get_bet(id).await
    }

    /// Get user balance.
    async fn balance(&self, owner: String) -> Amount {
        self.state.get_balance(&owner).await
    }

    /// Get user's bets.
    async fn user_bets(&self, owner: String) -> Vec<Bet> {
        if let Ok(Some(bet_ids)) = self.state.user_bets.get(&owner).await {
            let mut bets = Vec::new();
            for id in bet_ids {
                if let Some(bet) = self.state.get_bet(id).await {
                    bets.push(bet);
                }
            }
            bets
        } else {
            Vec::new()
        }
    }

    /// Get all bets for a market.
    async fn market_bets(&self, market_id: MarketId) -> Vec<Bet> {
        if let Ok(Some(bet_ids)) = self.state.market_bets.get(&market_id).await {
            let mut bets = Vec::new();
            for id in bet_ids {
                if let Some(bet) = self.state.get_bet(id).await {
                    bets.push(bet);
                }
            }
            bets
        } else {
            Vec::new()
        }
    }

    /// Get total betting volume.
    async fn total_volume(&self) -> Amount {
        *self.state.total_volume.get()
    }

    /// Get protocol fee rate (basis points).
    async fn fee_rate(&self) -> u32 {
        *self.state.fee_rate_bps.get()
    }

    /// Get accumulated protocol fees.
    async fn protocol_fees(&self) -> Amount {
        *self.state.protocol_fees.get()
    }

    /// Calculate potential payout for a hypothetical bet.
    async fn calculate_payout(
        &self,
        market_id: MarketId,
        option_id: u8,
        amount: Amount,
    ) -> Option<PotentialPayout> {
        let market = self.state.get_market(market_id).await?;
        
        if market.status != MarketStatus::Open {
            return None;
        }

        let option = market.options.get(option_id as usize)?;
        let total_pool: Amount = market.options.iter().map(|o| o.pool).sum();
        
        let odds = LivePredictState::calculate_odds(total_pool + amount, option.pool + amount);
        let fee_rate = *self.state.fee_rate_bps.get();
        let payout = LivePredictState::calculate_payout(amount, odds, fee_rate);

        Some(PotentialPayout {
            odds,
            potential_payout: payout,
            fee_rate,
        })
    }
}

/// Potential payout calculation result.
#[derive(async_graphql::SimpleObject)]
struct PotentialPayout {
    /// Odds (scaled by 1000).
    odds: u32,
    /// Potential payout after fees.
    potential_payout: Amount,
    /// Fee rate in basis points.
    fee_rate: u32,
}

/// GraphQL mutation root.
struct MutationRoot {
    runtime: Arc<ServiceRuntime<LivePredictService>>,
}

#[Object]
impl MutationRoot {
    /// Create a new market.
    async fn create_market(
        &self,
        match_id: String,
        market_type: String,
        title: String,
        options: Vec<String>,
        locks_at: u64,
    ) -> [u8; 0] {
        let operation = Operation::CreateMarket {
            match_id,
            market_type,
            title,
            options,
            locks_at,
        };
        self.runtime.schedule_operation(&operation);
        []
    }

    /// Place a bet on a market.
    async fn place_bet(
        &self,
        market_id: MarketId,
        option_id: u8,
        amount: Amount,
    ) -> [u8; 0] {
        let operation = Operation::PlaceBet {
            market_id,
            option_id,
            amount,
        };
        self.runtime.schedule_operation(&operation);
        []
    }

    /// Lock a market.
    async fn lock_market(&self, market_id: MarketId) -> [u8; 0] {
        let operation = Operation::LockMarket { market_id };
        self.runtime.schedule_operation(&operation);
        []
    }

    /// Resolve a market.
    async fn resolve_market(&self, market_id: MarketId, winning_option: u8) -> [u8; 0] {
        let operation = Operation::ResolveMarket {
            market_id,
            winning_option,
        };
        self.runtime.schedule_operation(&operation);
        []
    }

    /// Cancel a market.
    async fn cancel_market(&self, market_id: MarketId) -> [u8; 0] {
        let operation = Operation::CancelMarket { market_id };
        self.runtime.schedule_operation(&operation);
        []
    }

    /// Claim winnings.
    async fn claim_winnings(&self, bet_id: BetId) -> [u8; 0] {
        let operation = Operation::ClaimWinnings { bet_id };
        self.runtime.schedule_operation(&operation);
        []
    }

    /// Deposit tokens.
    async fn deposit(&self, amount: Amount) -> [u8; 0] {
        let operation = Operation::Deposit { amount };
        self.runtime.schedule_operation(&operation);
        []
    }

    /// Withdraw tokens.
    async fn withdraw(&self, amount: Amount) -> [u8; 0] {
        let operation = Operation::Withdraw { amount };
        self.runtime.schedule_operation(&operation);
        []
    }
}
