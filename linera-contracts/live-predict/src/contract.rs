// Copyright (c) Live Play Predictor
// SPDX-License-Identifier: Apache-2.0

//! Contract implementation for the Live Play Predictor application.
//!
//! This contract handles all betting operations including market creation,
//! bet placement, resolution, and payouts.

#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    linera_base_types::WithContractAbi,
    views::{RootView, View},
    Contract, ContractRuntime,
};
use live_predict::{
    Amount, Bet, LivePredictAbi, Market, MarketOption, MarketStatus, Message, Operation,
    OperationResponse, Timestamp,
};

use self::state::LivePredictState;

/// The Live Play Predictor contract.
pub struct LivePredictContract {
    state: LivePredictState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(LivePredictContract);

impl WithContractAbi for LivePredictContract {
    type Abi = LivePredictAbi;
}

impl Contract for LivePredictContract {
    type Message = Message;
    type InstantiationArgument = u32; // Fee rate in basis points
    type Parameters = ();
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = LivePredictState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        LivePredictContract { state, runtime }
    }

    async fn instantiate(&mut self, fee_rate_bps: u32) {
        // Validate fee rate (max 5%)
        assert!(fee_rate_bps <= 500, "Fee rate cannot exceed 5%");
        
        self.state.fee_rate_bps.set(fee_rate_bps);
        self.state.next_market_id.set(1);
        self.state.next_bet_id.set(1);
        self.state.total_volume.set(0);
        self.state.protocol_fees.set(0);
        self.state.active_markets.set(vec![]);
    }

    async fn execute_operation(&mut self, operation: Operation) -> OperationResponse {
        match operation {
            Operation::CreateMarket {
                match_id,
                market_type,
                title,
                options,
                locks_at,
            } => self.create_market(match_id, market_type, title, options, locks_at).await,

            Operation::PlaceBet {
                market_id,
                option_id,
                amount,
            } => self.place_bet(market_id, option_id, amount).await,

            Operation::LockMarket { market_id } => self.lock_market(market_id).await,

            Operation::ResolveMarket {
                market_id,
                winning_option,
            } => self.resolve_market(market_id, winning_option).await,

            Operation::CancelMarket { market_id } => self.cancel_market(market_id).await,

            Operation::ClaimWinnings { bet_id } => self.claim_winnings(bet_id).await,

            Operation::Deposit { amount } => self.deposit(amount).await,

            Operation::Withdraw { amount } => self.withdraw(amount).await,
        }
    }

    async fn execute_message(&mut self, message: Message) {
        match message {
            Message::SyncMarket { market } => {
                // Store synced market from another chain
                self.state
                    .markets
                    .insert(&market.id, market)
                    .expect("Failed to sync market");
            }
            Message::MarketResolved {
                market_id,
                winning_option,
            } => {
                // Update local market state based on cross-chain resolution
                if let Some(mut market) = self.state.get_market(market_id).await {
                    market.status = MarketStatus::Resolved;
                    market.winning_option = Some(winning_option);
                    self.state
                        .markets
                        .insert(&market_id, market)
                        .expect("Failed to update resolved market");
                }
            }
        }
    }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

impl LivePredictContract {
    /// Get current timestamp (simulated for now).
    fn current_time(&self) -> Timestamp {
        // In production, this would use the block timestamp
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as Timestamp
    }

    /// Get the caller's chain ID as owner identifier.
    fn caller_id(&self) -> String {
        format!("{:?}", self.runtime.chain_id())
    }

    /// Create a new betting market.
    async fn create_market(
        &mut self,
        match_id: String,
        market_type: String,
        title: String,
        options: Vec<String>,
        locks_at: Timestamp,
    ) -> OperationResponse {
        // Validate inputs
        if options.len() < 2 || options.len() > 10 {
            return OperationResponse::Error {
                message: "Market must have 2-10 options".into(),
            };
        }

        if locks_at <= self.current_time() {
            return OperationResponse::Error {
                message: "Lock time must be in the future".into(),
            };
        }

        let market_id = self.state.allocate_market_id().await;
        
        let market_options: Vec<MarketOption> = options
            .into_iter()
            .enumerate()
            .map(|(i, label)| MarketOption {
                id: i as u8,
                label,
                pool: 0,
            })
            .collect();

        let market = Market {
            id: market_id,
            match_id,
            market_type,
            title,
            options: market_options,
            status: MarketStatus::Open,
            created_at: self.current_time(),
            locks_at,
            winning_option: None,
        };

        self.state
            .markets
            .insert(&market_id, market)
            .expect("Failed to create market");
        
        self.state.add_active_market(market_id).await;

        OperationResponse::MarketCreated { market_id }
    }

    /// Place a bet on a market option.
    async fn place_bet(
        &mut self,
        market_id: u64,
        option_id: u8,
        amount: Amount,
    ) -> OperationResponse {
        let owner = self.caller_id();

        // Validate amount
        if amount == 0 {
            return OperationResponse::Error {
                message: "Bet amount must be greater than 0".into(),
            };
        }

        // Check user balance
        let balance = self.state.get_balance(&owner).await;
        if balance < amount {
            return OperationResponse::Error {
                message: "Insufficient balance".into(),
            };
        }

        // Get and validate market
        let mut market = match self.state.get_market(market_id).await {
            Some(m) => m,
            None => {
                return OperationResponse::Error {
                    message: "Market not found".into(),
                }
            }
        };

        if market.status != MarketStatus::Open {
            return OperationResponse::Error {
                message: "Market is not open for betting".into(),
            };
        }

        if self.current_time() >= market.locks_at {
            return OperationResponse::Error {
                message: "Market has been locked".into(),
            };
        }

        // Validate option
        let option = match market.options.get_mut(option_id as usize) {
            Some(o) => o,
            None => {
                return OperationResponse::Error {
                    message: "Invalid option".into(),
                }
            }
        };

        // Calculate total pool and current odds
        let total_pool: Amount = market.options.iter().map(|o| o.pool).sum();
        let odds = LivePredictState::calculate_odds(total_pool + amount, option.pool + amount);

        // Deduct from balance
        self.state.set_balance(&owner, balance - amount).await;

        // Update option pool
        option.pool += amount;

        // Create bet
        let bet_id = self.state.allocate_bet_id().await;
        let bet = Bet {
            id: bet_id,
            owner: owner.clone(),
            market_id,
            option_id,
            amount,
            odds,
            placed_at: self.current_time(),
            settled: false,
            payout: None,
        };

        // Store bet and update indices
        self.state.bets.insert(&bet_id, bet).expect("Failed to create bet");
        self.state.markets.insert(&market_id, market).expect("Failed to update market");
        self.state.add_user_bet(&owner, bet_id).await;
        self.state.add_market_bet(market_id, bet_id).await;

        // Update total volume
        let new_volume = self.state.total_volume.get() + amount;
        self.state.total_volume.set(new_volume);

        OperationResponse::BetPlaced { bet_id, odds }
    }

    /// Lock a market (stop accepting bets).
    async fn lock_market(&mut self, market_id: u64) -> OperationResponse {
        let mut market = match self.state.get_market(market_id).await {
            Some(m) => m,
            None => {
                return OperationResponse::Error {
                    message: "Market not found".into(),
                }
            }
        };

        if market.status != MarketStatus::Open {
            return OperationResponse::Error {
                message: "Market is not open".into(),
            };
        }

        market.status = MarketStatus::Locked;
        self.state.markets.insert(&market_id, market).expect("Failed to lock market");
        self.state.remove_active_market(market_id).await;

        OperationResponse::MarketLocked { market_id }
    }

    /// Resolve a market with the winning option.
    async fn resolve_market(&mut self, market_id: u64, winning_option: u8) -> OperationResponse {
        let mut market = match self.state.get_market(market_id).await {
            Some(m) => m,
            None => {
                return OperationResponse::Error {
                    message: "Market not found".into(),
                }
            }
        };

        if market.status == MarketStatus::Resolved {
            return OperationResponse::Error {
                message: "Market already resolved".into(),
            };
        }

        if winning_option as usize >= market.options.len() {
            return OperationResponse::Error {
                message: "Invalid winning option".into(),
            };
        }

        market.status = MarketStatus::Resolved;
        market.winning_option = Some(winning_option);
        self.state.markets.insert(&market_id, market).expect("Failed to resolve market");
        self.state.remove_active_market(market_id).await;

        OperationResponse::MarketResolved {
            market_id,
            winning_option,
        }
    }

    /// Cancel a market and refund all bets.
    async fn cancel_market(&mut self, market_id: u64) -> OperationResponse {
        let mut market = match self.state.get_market(market_id).await {
            Some(m) => m,
            None => {
                return OperationResponse::Error {
                    message: "Market not found".into(),
                }
            }
        };

        if market.status == MarketStatus::Resolved {
            return OperationResponse::Error {
                message: "Cannot cancel resolved market".into(),
            };
        }

        // Refund all bets for this market
        if let Ok(Some(bet_ids)) = self.state.market_bets.get(&market_id).await {
            for bet_id in bet_ids {
                if let Some(mut bet) = self.state.get_bet(bet_id).await {
                    if !bet.settled {
                        // Refund the bet amount
                        let balance = self.state.get_balance(&bet.owner).await;
                        self.state.set_balance(&bet.owner, balance + bet.amount).await;
                        bet.settled = true;
                        bet.payout = Some(bet.amount); // Refund = original amount
                        self.state.bets.insert(&bet_id, bet).expect("Failed to refund bet");
                    }
                }
            }
        }

        market.status = MarketStatus::Cancelled;
        self.state.markets.insert(&market_id, market).expect("Failed to cancel market");
        self.state.remove_active_market(market_id).await;

        OperationResponse::MarketCancelled { market_id }
    }

    /// Claim winnings for a bet.
    async fn claim_winnings(&mut self, bet_id: u64) -> OperationResponse {
        let owner = self.caller_id();

        let mut bet = match self.state.get_bet(bet_id).await {
            Some(b) => b,
            None => {
                return OperationResponse::Error {
                    message: "Bet not found".into(),
                }
            }
        };

        if bet.owner != owner {
            return OperationResponse::Error {
                message: "Not your bet".into(),
            };
        }

        if bet.settled {
            return OperationResponse::Error {
                message: "Bet already settled".into(),
            };
        }

        let market = match self.state.get_market(bet.market_id).await {
            Some(m) => m,
            None => {
                return OperationResponse::Error {
                    message: "Market not found".into(),
                }
            }
        };

        if market.status != MarketStatus::Resolved {
            return OperationResponse::Error {
                message: "Market not yet resolved".into(),
            };
        }

        let winning_option = market.winning_option.unwrap();
        let fee_rate = *self.state.fee_rate_bps.get();

        let payout = if bet.option_id == winning_option {
            // Winner! Calculate payout
            LivePredictState::calculate_payout(bet.amount, bet.odds, fee_rate)
        } else {
            // Lost
            0
        };

        // Update balance
        if payout > 0 {
            let balance = self.state.get_balance(&owner).await;
            self.state.set_balance(&owner, balance + payout).await;
            
            // Track protocol fees
            let gross = (bet.amount as u64 * bet.odds as u64) / 1000;
            let fee = gross - payout as u64;
            let current_fees = *self.state.protocol_fees.get();
            self.state.protocol_fees.set(current_fees + fee as Amount);
        }

        // Mark as settled
        bet.settled = true;
        bet.payout = Some(payout);
        self.state.bets.insert(&bet_id, bet).expect("Failed to settle bet");

        OperationResponse::WinningsClaimed {
            bet_id,
            amount: payout,
        }
    }

    /// Deposit tokens to user balance.
    async fn deposit(&mut self, amount: Amount) -> OperationResponse {
        let owner = self.caller_id();
        let balance = self.state.get_balance(&owner).await;
        let new_balance = balance + amount;
        self.state.set_balance(&owner, new_balance).await;

        OperationResponse::Deposited {
            amount,
            new_balance,
        }
    }

    /// Withdraw tokens from user balance.
    async fn withdraw(&mut self, amount: Amount) -> OperationResponse {
        let owner = self.caller_id();
        let balance = self.state.get_balance(&owner).await;

        if balance < amount {
            return OperationResponse::Error {
                message: "Insufficient balance".into(),
            };
        }

        let new_balance = balance - amount;
        self.state.set_balance(&owner, new_balance).await;

        OperationResponse::Withdrawn {
            amount,
            new_balance,
        }
    }
}
