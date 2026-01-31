// Copyright (c) Live Play Predictor
// SPDX-License-Identifier: Apache-2.0

//! ABI (Application Binary Interface) for the Live Play Predictor application.
//!
//! This module defines the operations and messages that can be sent to the contract,
//! as well as the GraphQL query interface for the service.

use async_graphql::{Request, Response};
use linera_sdk::linera_base_types::{ContractAbi, ServiceAbi};
use serde::{Deserialize, Serialize};

/// The main ABI struct for the Live Play Predictor application.
pub struct LivePredictAbi;

/// Unique identifier for a market (betting opportunity).
pub type MarketId = u64;

/// Unique identifier for a user's bet.
pub type BetId = u64;

/// Amount in tokens (with 6 decimal precision).
pub type Amount = u128;

/// Timestamp in milliseconds since Unix epoch.
pub type Timestamp = u64;

/// Represents the status of a betting market.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum MarketStatus {
    /// Market is open for betting.
    Open,
    /// Market is locked, no more bets accepted.
    Locked,
    /// Market has been resolved with an outcome.
    Resolved,
    /// Market was cancelled, all bets refunded.
    Cancelled,
}

/// Represents a betting option within a market.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketOption {
    /// Option identifier (0, 1, 2, etc.).
    pub id: u8,
    /// Human-readable label (e.g., "NAVI wins", "Over 6.5 kills").
    pub label: String,
    /// Total amount bet on this option.
    pub pool: Amount,
}

/// Represents a betting market (a specific prediction opportunity).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Market {
    /// Unique market identifier.
    pub id: MarketId,
    /// Match identifier this market belongs to.
    pub match_id: String,
    /// Type of market (e.g., "round_winner", "first_blood").
    pub market_type: String,
    /// Human-readable title.
    pub title: String,
    /// Available betting options.
    pub options: Vec<MarketOption>,
    /// Current market status.
    pub status: MarketStatus,
    /// Timestamp when market was created.
    pub created_at: Timestamp,
    /// Timestamp when market locks (no more bets).
    pub locks_at: Timestamp,
    /// Winning option ID (if resolved).
    pub winning_option: Option<u8>,
}

/// Represents a user's bet on a market.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bet {
    /// Unique bet identifier.
    pub id: BetId,
    /// User's chain ID (owner).
    pub owner: String,
    /// Market this bet is for.
    pub market_id: MarketId,
    /// Selected option ID.
    pub option_id: u8,
    /// Amount wagered.
    pub amount: Amount,
    /// Odds at time of bet (scaled by 1000, e.g., 1500 = 1.5x).
    pub odds: u32,
    /// Timestamp when bet was placed.
    pub placed_at: Timestamp,
    /// Whether bet has been settled.
    pub settled: bool,
    /// Payout amount (if won and settled).
    pub payout: Option<Amount>,
}

/// Operations that can be executed on the contract.
#[derive(Debug, Deserialize, Serialize)]
pub enum Operation {
    /// Create a new betting market.
    CreateMarket {
        match_id: String,
        market_type: String,
        title: String,
        options: Vec<String>,
        locks_at: Timestamp,
    },
    
    /// Place a bet on a market option.
    PlaceBet {
        market_id: MarketId,
        option_id: u8,
        amount: Amount,
    },
    
    /// Lock a market (stop accepting bets).
    LockMarket {
        market_id: MarketId,
    },
    
    /// Resolve a market with the winning option.
    ResolveMarket {
        market_id: MarketId,
        winning_option: u8,
    },
    
    /// Cancel a market and refund all bets.
    CancelMarket {
        market_id: MarketId,
    },
    
    /// Claim winnings for a bet.
    ClaimWinnings {
        bet_id: BetId,
    },
    
    /// Deposit tokens to user balance.
    Deposit {
        amount: Amount,
    },
    
    /// Withdraw tokens from user balance.
    Withdraw {
        amount: Amount,
    },
}

/// Response types for operations.
#[derive(Debug, Serialize, Deserialize)]
pub enum OperationResponse {
    /// Market created successfully.
    MarketCreated { market_id: MarketId },
    /// Bet placed successfully.
    BetPlaced { bet_id: BetId, odds: u32 },
    /// Market locked.
    MarketLocked { market_id: MarketId },
    /// Market resolved.
    MarketResolved { market_id: MarketId, winning_option: u8 },
    /// Market cancelled.
    MarketCancelled { market_id: MarketId },
    /// Winnings claimed.
    WinningsClaimed { bet_id: BetId, amount: Amount },
    /// Deposit successful.
    Deposited { amount: Amount, new_balance: Amount },
    /// Withdrawal successful.
    Withdrawn { amount: Amount, new_balance: Amount },
    /// Operation failed.
    Error { message: String },
}

/// Cross-chain messages for the application.
#[derive(Debug, Deserialize, Serialize)]
pub enum Message {
    /// Sync market state to another chain.
    SyncMarket { market: Market },
    /// Notify about market resolution.
    MarketResolved { market_id: MarketId, winning_option: u8 },
}

impl ContractAbi for LivePredictAbi {
    type Operation = Operation;
    type Response = OperationResponse;
}

impl ServiceAbi for LivePredictAbi {
    type Query = Request;
    type QueryResponse = Response;
}
