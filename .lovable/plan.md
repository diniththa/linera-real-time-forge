
# Live Play Predictor - Linera Buildathon Project Plan

## 🎯 Project Vision
A real-time micro-betting platform where users predict outcomes of individual plays/events during live esports matches (CS2/Valorant focus). Users earn or lose tokens based on instant predictions like "Will this round end in a clutch?" or "First blood in next 30 seconds?".

---

## 📐 Architecture Overview

### Two-Part Development:

**1. Linera Smart Contracts (Rust)** - You'll develop separately
- Betting pool management
- Instant settlement logic
- User balance tracking
- Market creation/resolution

**2. Frontend dApp (Lovable)** - We'll build together
- Real-time match visualization
- Betting interface
- Wallet integration (CheCko/Croissant)
- Live odds display
- User dashboard

---

## 🔧 Core Features (MVP)

### 1. **Match Lobby**
- Browse live esports matches
- See current round/game state
- Real-time viewer count & betting volume

### 2. **Live Betting Interface**
- Active micro-markets for current game moment
- Countdown timers for each bet window
- One-click betting with preset amounts
- Live odds that update in real-time

### 3. **Prediction Types (CS2/Valorant)**
- Round winner prediction
- First blood in the round
- Bomb plant success (yes/no)
- Clutch attempt outcome
- Total kills in round (over/under)

### 4. **Wallet & Funds**
- Connect CheCko/Croissant wallet
- View testnet token balance
- Deposit/withdraw from betting pool
- Transaction history

### 5. **Real-Time Data Feed**
- Integration with PandaScore or Abios API for esports data
- Simulated match replay mode for demos
- WebSocket updates for instant state changes

### 6. **User Dashboard**
- Betting history
- Win/loss statistics
- Leaderboard position
- Active bets tracker

---

## 🏗️ Technical Implementation

### Frontend Stack (Lovable)
- React + TypeScript + Tailwind CSS
- WebSocket connections for real-time updates
- Linera Web Client Library integration
- Responsive design (mobile + desktop)

### Data Sources
- **Primary**: PandaScore API (free tier) for live esports data
- **Fallback**: Pre-recorded match replay with simulated timing
- **Demo Mode**: Synthetic events for reliable demonstrations

### Linera Integration Points
- Wallet connection via CheCko SDK
- Transaction signing for bets
- Reading contract state (balances, active markets)
- Event subscriptions for instant updates

---

## 📱 Key Screens to Build

1. **Landing Page** - Hero with live matches, "Connect Wallet" CTA
2. **Match List** - Grid of live/upcoming matches with betting status
3. **Live Match View** - Main betting interface with game state visualization
4. **Betting Slip** - Selected bets, stake input, confirm button
5. **Wallet Dashboard** - Balance, transactions, deposits
6. **Leaderboard** - Top predictors with stats
7. **How It Works** - Tutorial/onboarding for new users

---

## 🗓️ Development Phases

### Phase 1: Core UI (Week 1)
- Landing page with wallet connection mockup
- Match listing with sample data
- Basic betting interface layout
- Mobile-responsive design

### Phase 2: Real Data Integration (Week 2)
- PandaScore API integration for live matches
- WebSocket setup for real-time updates
- Match state visualization
- Dynamic odds display

### Phase 3: Linera Integration (Week 3)
- CheCko wallet connection
- Contract interaction hooks
- Transaction signing flow
- Balance display & updates

### Phase 4: Polish & Demo (Week 4)
- Demo mode for reliable presentations
- Animations & micro-interactions
- Error handling & loading states
- Documentation & README

---

## 🏆 Why This Wins

| Criteria | How We Score High |
|----------|-------------------|
| **Working Demo (30%)** | Real wallet connection, live data, actual transactions on testnet |
| **Linera Integration (30%)** | Showcases sub-second finality for instant bet settlement |
| **Creativity & UX (20%)** | Unique micro-betting concept, polished interface |
| **Scalability (10%)** | Clear path to real sports, multiple games |
| **Vision (10%)** | Roadmap to mainnet, revenue model documented |

---

## 📦 Deliverables for Submission

- ✅ Public GitHub repo with full README
- ✅ Live frontend on Testnet Conway
- ✅ Working Linera contract (basic betting logic)
- ✅ Wallet integration (CheCko)
- ✅ Demo video/walkthrough
- ✅ Changelog for each wave

---

## ⚠️ Important Notes

1. **Linera Contract**: You'll need to write the Rust smart contract separately using Linera SDK. I can guide you on the logic but can't execute Rust code.

2. **Testnet Deployment**: The final app must run against Testnet Conway - we'll use the Linera Web Client Library.

3. **Esports API**: PandaScore has a free tier that should work for the MVP. We'll implement fallback demo mode for reliable demos.

Ready to start building the frontend and I'll guide you through the Linera integration points!
