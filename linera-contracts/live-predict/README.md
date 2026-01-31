# Live Play Predictor - Linera Smart Contracts

Real-time micro-betting smart contracts for esports on the Linera blockchain.

## Overview

This application implements a parimutuel betting system where:
- Users bet against each other, not the house
- Odds are determined by the distribution of bets
- Winners share the losing pool proportionally
- A small protocol fee is collected on winnings

## Features

- **Market Creation**: Create betting markets for live esports events
- **Real-time Betting**: Place bets with dynamically calculated odds
- **Instant Settlement**: Claim winnings immediately after resolution
- **Cross-chain Messaging**: Markets can be synced across microchains

## Project Structure

```
src/
├── lib.rs       # ABI definitions (operations, messages, types)
├── state.rs     # Application state (views)
├── contract.rs  # Contract logic (mutations)
└── service.rs   # Service logic (queries)
```

## Building

Ensure you have the Linera SDK installed:

```bash
# Install wasm32 target
rustup target add wasm32-unknown-unknown

# Build the application
cargo build --release --target wasm32-unknown-unknown
```

## Deployment

Deploy to Linera testnet:

```bash
# Initialize wallet
linera wallet init --faucet https://faucet.testnet-conway.linera.net

# Publish and create application (fee rate: 100 = 1%)
linera publish-and-create \
  target/wasm32-unknown-unknown/release/live-predict_{contract,service}.wasm \
  --json-argument "100"
```

## GraphQL API

### Queries

```graphql
# Get active markets
query {
  activeMarkets {
    id
    title
    options { id label pool }
    status
    locksAt
  }
}

# Get user balance
query {
  balance(owner: "chain_id_here")
}

# Calculate potential payout
query {
  calculatePayout(marketId: 1, optionId: 0, amount: 100) {
    odds
    potentialPayout
    feeRate
  }
}
```

### Mutations

```graphql
# Place a bet
mutation {
  placeBet(marketId: 1, optionId: 0, amount: 100)
}

# Claim winnings
mutation {
  claimWinnings(betId: 1)
}

# Deposit tokens
mutation {
  deposit(amount: 1000)
}
```

## Market Types

- `round_winner` - Predict which team wins the round
- `first_blood` - Predict which team gets first kill
- `bomb_plant` - Predict if bomb will be planted
- `total_kills` - Predict over/under total kills
- `map_winner` - Predict map winner

## Security

- Only market creators can lock/resolve/cancel markets
- Users can only claim their own bets
- Bets are locked after market locks
- Refunds are automatic on market cancellation

## License

Apache-2.0
