# RangePilot Product Architecture Spec

## 0. Document Status

**Product name:** RangePilot  
**Working subtitle:** Guided prediction terminal for DeepBook Predict  
**Target event:** Sui Overflow 2026 / DeepBook Predict Track  
**Document version:** v0.1  
**Primary goal:** Define a product, business, UX, and technical architecture for building a hackathon-ready DeepBook Predict application.

---

## 1. Executive Summary

RangePilot is a user-facing prediction product built on top of DeepBook Predict.

DeepBook Predict provides powerful on-chain primitives for expiry-based prediction markets: `Predict`, `PredictManager`, `OracleSVI`, `OracleConfig`, `Vault`, `PLP`, `MarketKey`, and `RangeKey`. However, these primitives are difficult for normal users to understand and interact with directly.

RangePilot turns those primitives into a guided product experience:

> Users express a market view, choose a range or direction, preview post-trade pricing, mint a DeepBook Predict position, monitor it in a portfolio, and redeem or claim after settlement.

The product focuses on three user groups:

1. **Prediction users** who want to express views on asset prices.
2. **Creators / traders / KOLs** who want to publish shareable prediction strategies.
3. **LPs** who want to understand vault risk and provide liquidity through PLP.

RangePilot does not attempt to rewrite DeepBook Predict. It uses official DeepBook Predict entrypoints as the source of truth for pricing, settlement, risk, and payouts. RangePilot’s value is productization: UX, transaction building, read models, portfolio visualization, creator strategy pages, fee routing, and risk explanation.

---

## 2. Product Thesis

### 2.1 Problem

DeepBook Predict is powerful but difficult to use directly.

A raw user must understand:

- `PredictManager`
- quote deposits
- `MarketKey`
- `RangeKey`
- binary positions
- vertical ranges
- oracle state
- expiry
- settlement rules
- post-trade ask / bid pricing
- vault utilization
- PLP liquidity
- redeem versus settled claim behavior

This is too much for a normal user.

### 2.2 Opportunity

Most prediction market products are built around simple Yes / No markets. DeepBook Predict supports more expressive range-based positions.

Range prediction is easier to gamify:

- “SUI will settle between $4 and $5.”
- “BTC will stay above $90k this week.”
- “ETH will not enter this danger zone.”
- “I expect a volatility squeeze inside this range.”

This creates a strong product surface for trading, sharing, creator strategies, and social competition.

### 2.3 Core Product Claim

> RangePilot makes DeepBook Predict usable by turning complex prediction primitives into guided, shareable, and monetizable prediction flows.

---

## 3. Goals and Non-Goals

### 3.1 Goals

RangePilot should:

1. Provide a simple guided interface for minting DeepBook Predict range positions.
2. Make win conditions and payout conditions clear before users trade.
3. Use official DeepBook Predict pricing, oracle, vault, and settlement logic.
4. Surface post-trade cost, fees, vault impact, and oracle freshness in a user-friendly way.
5. Provide a portfolio view for active and settled predictions.
6. Support creator strategy pages for shareable predictions and follow trades.
7. Provide a basic LP / vault dashboard for PLP users.
8. Demonstrate a credible business model based on transaction volume, creator fees, and LP analytics.
9. Be hackathon-feasible and demo-ready.

### 3.2 Non-Goals

RangePilot should not:

1. Reimplement DeepBook Predict pricing.
2. Reimplement DeepBook Predict vault risk logic.
3. Create a competing oracle system.
4. Create a custom prediction market protocol from scratch.
5. Expose raw Move concepts as the primary user experience.
6. Position itself as an AI price prediction system.
7. Depend on complex off-chain settlement logic for the MVP.
8. Require users to understand `StrikeMatrix`, `OracleConfig`, or `range_qty`.

---

## 4. User Roles

## 4.1 Prediction User

The prediction user wants to express a view on price movement and potentially earn a payout.

### Needs

- Simple market selection.
- Clear win condition.
- Clear maximum loss.
- Clear potential payout.
- Easy wallet flow.
- Portfolio tracking.
- Claim / redeem flow.
- Shareable result.

### Example Intent

> “I think SUI will be between $4 and $5 next week.”

### Product Translation

RangePilot converts this into:

- asset: SUI
- expiry: selected oracle expiry
- lower strike: $4
- upper strike: $5
- position type: range
- amount: user quote amount
- DeepBook Predict action: `mint_range`

---

## 4.2 Creator / Trader / KOL

The creator wants to publish predictions and let followers participate.

### Needs

- Create public prediction thesis.
- Select asset, expiry, and range.
- Add explanation.
- Share strategy page.
- Earn creator fee from follow trades.
- Track volume, participants, and win rate.

### Example Intent

> “I want to publish a SUI $4-$5 range bounce strategy and let followers join it.”

### Product Translation

RangePilot creates a public strategy page:

- title
- creator
- thesis
- asset
- expiry
- lower / upper strike
- creator fee
- participants
- total volume
- current status
- follow trade button

---

## 4.3 LP / Liquidity Provider

The LP wants to provide liquidity and understand vault risk.

### Needs

- Vault balance overview.
- PLP position overview.
- Utilization.
- Total MTM.
- Max payout exposure.
- Risk by expiry.
- Supply / withdraw flow.
- Rate-limit explanation.

### Product Translation

RangePilot provides a vault dashboard:

- vault balance
- PLP supply
- user PLP share
- total MTM
- total max payout
- utilization
- open interest by expiry
- active ranges by strike bucket

---

## 5. Business Model

RangePilot’s business model should align revenue with prediction activity and liquidity growth.

## 5.1 Transaction Service Fee

RangePilot charges a small service fee on user trades.

Example:

```text
User trade amount: 100 USDC
DeepBook Predict cost: 98.80 USDC
RangePilot service fee: 1.20 USDC
Total user spend: 100 USDC
```

This is the clearest business model because revenue scales with transaction volume.

### Why It Works

- Easy for users to understand.
- Easy for judges to understand.
- Directly tied to product usage.
- Works for normal predictions and creator follow trades.

---

## 5.2 Creator Fee

Creators can publish prediction strategies and set a creator fee.

Example:

```text
Follower trade: 100 USDC
Creator fee: 1 USDC
Platform cut: 0.3 USDC
Creator receives: 0.7 USDC
```

### Why It Works

- Turns predictions into shareable content.
- Gives KOLs an incentive to bring users.
- Creates a growth loop.
- Makes RangePilot more than a trading terminal.

---

## 5.3 LP Analytics Premium

RangePilot can provide advanced dashboards for LPs.

Premium features may include:

- vault utilization alerts
- exposure heatmaps
- expiry risk comparison
- PLP yield simulation
- withdrawal timing hints
- historical vault PnL

For hackathon MVP, this can be presented as a future monetization path rather than a fully implemented paid feature.

---

## 5.4 Business Model Summary

RangePilot revenue sources:

| Revenue Source | MVP Priority | Description |
|---|---:|---|
| Transaction service fee | High | Fee on prediction trades |
| Creator fee split | High | Fee on public strategy follow trades |
| LP analytics premium | Medium | Advanced risk dashboards |
| Referral / campaign fee | Medium | Partner campaigns and social growth |
| Market creation fee | Low | Fee for creating custom strategy pages |

---

## 6. Core User Flows

## 6.1 First-Time User Flow

```text
Open RangePilot
→ Connect wallet
→ Check PredictManager
→ If missing, create PredictManager
→ Deposit quote asset
→ Choose prediction template
→ Select asset and expiry
→ Select range or direction
→ Preview quote
→ Confirm transaction
→ Mint DeepBook Predict position
→ View portfolio receipt
```

### UX Requirement

The user should not need to understand what `PredictManager` is. The UI can explain it as:

> Your Predict Account holds funds and prediction positions for DeepBook Predict.

---

## 6.2 Range Prediction Flow

```text
Choose “Predict a Range”
→ Select asset
→ Select expiry
→ Enter lower strike
→ Enter upper strike
→ Enter amount
→ Preview win condition and payout
→ Mint range position
```

### Confirmation Card

The confirmation card must show:

```text
Prediction:
SUI settles above $4.00 and at or below $5.00.

Expiry:
June 21, 2026

Cost:
100 USDC

Estimated payout:
238 USDC

Maximum loss:
100 USDC

Settlement source:
DeepBook Predict oracle

Pricing note:
This quote uses post-trade pricing and may include vault utilization impact.
```

---

## 6.3 Creator Strategy Flow

```text
Creator connects wallet
→ Creates strategy page
→ Selects asset, expiry, range, and explanation
→ Sets creator fee
→ Publishes strategy
→ Followers open strategy page
→ Followers preview and follow trade
→ Creator earns fee from volume
```

### Creator Strategy Page

Required sections:

- Strategy title
- Creator identity
- Thesis
- Asset
- Expiry
- Range
- Win condition
- Total volume
- Participants
- Creator fee
- Follow button
- Risk warning

---

## 6.4 Portfolio Flow

```text
User opens portfolio
→ RangePilot loads PredictManager
→ Reads active positions and range positions
→ Shows active / settled status
→ Shows estimated redeem value or claimable payout
→ User redeems or claims
```

### Portfolio Card

```text
SUI Range Prediction
Range: $4.00 - $5.00
Expiry: June 21, 2026
Status: Active
Current SUI price: $4.42
Win condition: currently in range
Estimated redeem value: 126 USDC
Action: Redeem
```

---

## 6.5 LP Flow

```text
Open Vault Dashboard
→ View vault metrics
→ Enter supply amount
→ Supply quote asset to Predict Vault
→ Receive PLP
→ Monitor PLP position
→ Withdraw PLP when desired
```

### LP Risk Card

```text
Vault Balance: 1,250,000 USDC
Total MTM: 620,000 USDC
Max Payout: 980,000 USDC
Utilization: 49.6%
Open Interest: 2,140,000 USDC
Largest Expiry Risk: SUI / June 21
```

---

## 7. DeepBook Predict Integration Principles

## 7.1 Use Official Entry Points

RangePilot should call official DeepBook Predict entrypoints:

- `create_manager`
- `mint`
- `redeem`
- `mint_range`
- `redeem_range`
- `supply`
- `withdraw`

RangePilot should not bypass these entrypoints or directly manipulate internal vault state.

---

## 7.2 Treat PredictManager as User Account

The product should treat `PredictManager` as the user’s prediction account.

UX abstraction:

```text
PredictManager = Predict Account
quote balance = available balance
positions = active predictions
range_positions = active range predictions
```

---

## 7.3 Respect Post-Trade Pricing

RangePilot must explain that quotes are post-trade and can include vault utilization impact.

This matters because:

- mint pricing reflects the liability after the new position is inserted
- redeem pricing reflects the liability after the position is removed
- large trades can move the effective quote
- vault risk limits can reject trades

---

## 7.4 Do Not Recalculate Official Pricing

RangePilot may display pricing outputs, but should not create a competing pricing engine.

Allowed:

- call official quote / read functions
- display implied probability
- display estimated payout
- display utilization warning

Not allowed in core architecture:

- custom SVI pricing
- custom vault risk calculation
- custom settlement logic
- custom oracle fallback for payout

---

## 7.5 Use Read Model, Events, and Direct Reads Together

Recommended data sources:

1. DeepBook Predict public read model / server, if available.
2. Sui events and checkpoint stream.
3. Direct object reads for wallet-critical state.
4. Optional RangePilot cache for history and creator strategy stats.

---

## 8. System Architecture

## 8.1 High-Level Architecture

```text
RangePilot Frontend
  ├─ Market Explorer
  ├─ Range Builder
  ├─ Quote Preview
  ├─ Portfolio
  ├─ Creator Strategy Page
  └─ Vault / LP Dashboard

RangePilot SDK / Transaction Builder
  ├─ loadOrCreateManager()
  ├─ depositQuote()
  ├─ buildMarketKey()
  ├─ buildRangeKey()
  ├─ previewMintRange()
  ├─ mintRange()
  ├─ redeemRange()
  ├─ supplyPLP()
  └─ withdrawPLP()

RangePilot Read API / Indexer
  ├─ markets
  ├─ expiries
  ├─ oracle status
  ├─ quotes
  ├─ user positions
  ├─ portfolio history
  ├─ creator strategy stats
  └─ vault risk summaries

Optional RangePilot Move Layer
  ├─ CreatorStrategy
  ├─ StrategyReceipt
  ├─ FeeSplitter
  └─ Referral / Campaign Tracking

DeepBook Predict
  ├─ Predict
  ├─ PredictManager
  ├─ OracleSVI / OracleConfig
  ├─ Vault / PLP
  └─ Events
```

---

## 8.2 Frontend Architecture

Suggested stack:

- React / Vite or Next.js
- TypeScript
- Tailwind / shadcn-ui / HeroUI
- `@mysten/sui`
- `@mysten/dapp-kit`
- React Query
- Zustand
- lightweight charting library

### Frontend Modules

| Module | Responsibility |
|---|---|
| Wallet module | Connect wallet, network state, account info |
| Manager module | Load/create PredictManager, balance display |
| Market module | Assets, expiries, oracle state |
| Range builder | Convert user input into RangeKey |
| Quote module | Preview cost, payout, fee, warnings |
| Trade module | Build and submit mint/redeem transactions |
| Portfolio module | Display active and settled positions |
| Creator module | Strategy pages and follow flow |
| Vault module | LP dashboard and PLP actions |
| Error module | Translate Move aborts into user messages |

---

## 8.3 Transaction Builder Architecture

RangePilot should isolate transaction construction into a dedicated SDK layer.

Example SDK functions:

```ts
loadOrCreateManager(params)
depositQuote(params)
buildRangeKey(params)
previewMintRange(params)
mintRange(params)
redeemRange(params)
supplyPLP(params)
withdrawPLP(params)
```

### Why This Matters

- Keeps UI clean.
- Makes transaction flows testable.
- Enables future bot / Telegram integration.
- Reduces risk of inconsistent transaction construction.
- Makes Demo Day more reliable.

---

## 8.4 Read API / Indexer Architecture

The read layer provides product-friendly data.

### Responsibilities

- Normalize markets and expiries.
- Track oracle freshness.
- Track user positions.
- Track creator strategy volume.
- Track portfolio history.
- Track vault risk metrics.
- Cache expensive object reads.

### MVP Implementation Options

Option A: Frontend-only MVP

```text
Frontend → Sui RPC + DeepBook Predict read server
```

Option B: Lightweight API MVP

```text
Frontend → RangePilot API → Sui RPC / Predict server
```

Option C: Indexed MVP

```text
Frontend → RangePilot API → Event indexer + database + Sui RPC
```

Recommended for hackathon:

> Start with Option B. Use a lightweight API to normalize market, portfolio, and strategy data, but avoid building a heavy indexer unless necessary.

---

## 8.5 Optional Move Layer

RangePilot may include a small Move package, but only for product-level extensions.

### Allowed Move Scope

```move
module rangepilot::creator_strategy;
module rangepilot::strategy_receipt;
module rangepilot::fee_splitter;
module rangepilot::referral;
```

### Responsibilities

- Store public creator strategies.
- Track creator fee configuration.
- Emit follow-trade events.
- Store campaign / referral metadata.
- Optionally issue strategy receipts.

### Not Responsibilities

The RangePilot Move layer should not:

- price options
- manage vault risk
- replace DeepBook Predict Vault
- replace OracleSVI
- define custom payout rules
- settle predictions independently

---

## 9. Core Data Models

## 9.1 Frontend Types

```ts
type Asset = {
  symbol: string;
  name: string;
  iconUrl?: string;
  decimals: number;
};

type PredictMarket = {
  oracleId: string;
  underlying: string;
  expiryMs: number;
  status: 'inactive' | 'active' | 'pending_settlement' | 'settled';
  minStrike: number;
  maxStrike: number;
  tickSize: number;
  quoteAssetType: string;
};

type RangeInput = {
  oracleId: string;
  expiryMs: number;
  lowerStrike: number;
  upperStrike: number;
  amount: bigint;
};

type QuotePreview = {
  cost: bigint;
  estimatedPayout: bigint;
  maxLoss: bigint;
  impliedProbability?: number;
  fee?: bigint;
  warnings: QuoteWarning[];
};

type QuoteWarning =
  | 'ORACLE_STALE'
  | 'OUTSIDE_STRIKE_GRID'
  | 'ASK_OUT_OF_BOUNDS'
  | 'VAULT_EXPOSURE_HIGH'
  | 'INSUFFICIENT_MANAGER_BALANCE';
```

---

## 9.2 Creator Strategy Model

```ts
type CreatorStrategy = {
  id: string;
  creatorAddress: string;
  creatorName?: string;
  title: string;
  thesis: string;
  oracleId: string;
  underlying: string;
  expiryMs: number;
  lowerStrike: number;
  upperStrike: number;
  creatorFeeBps: number;
  totalVolume: bigint;
  participantCount: number;
  status: 'draft' | 'active' | 'settled' | 'expired';
  createdAtMs: number;
};
```

---

## 9.3 Portfolio Position Model

```ts
type PortfolioRangePosition = {
  managerId: string;
  oracleId: string;
  underlying: string;
  expiryMs: number;
  lowerStrike: number;
  upperStrike: number;
  quantity: bigint;
  status: 'active' | 'settled';
  estimatedRedeemValue?: bigint;
  claimablePayout?: bigint;
  settlementPrice?: number;
};
```

---

## 9.4 Vault Risk Model

```ts
type VaultRiskSummary = {
  vaultBalance: bigint;
  totalMtm: bigint;
  totalMaxPayout: bigint;
  utilization: number;
  plpSupply: bigint;
  openInterest: bigint;
  expiryRisks: ExpiryRisk[];
};

type ExpiryRisk = {
  oracleId: string;
  underlying: string;
  expiryMs: number;
  mtm: bigint;
  maxPayout: bigint;
  openInterest: bigint;
};
```

---

## 10. Transaction Flows

## 10.1 Create or Load PredictManager

```text
Input:
- wallet address
- Predict object ID

Steps:
1. Query existing PredictManager objects owned by or associated with wallet.
2. If found, load manager ID and balances.
3. If not found, build create_manager transaction.
4. Submit transaction.
5. Store manager ID locally.
```

UX copy:

> Create your Predict Account to hold funds and positions for DeepBook Predict.

---

## 10.2 Deposit Quote Asset

```text
Input:
- manager ID
- quote coin
- amount

Steps:
1. Validate quote asset type.
2. Check wallet balance.
3. Build deposit transaction.
4. Submit transaction.
5. Refresh manager balance.
```

UX copy:

> Deposit USDC into your Predict Account before opening predictions.

---

## 10.3 Preview Range Mint

```text
Input:
- oracle ID
- expiry
- lower strike
- upper strike
- amount

Steps:
1. Validate lower < upper.
2. Validate strikes are inside grid.
3. Check oracle status and freshness.
4. Fetch official quote / trade amount.
5. Display post-trade cost and warnings.
```

Important UX notes:

- Show `(lower, upper]` win condition.
- Show maximum loss.
- Show estimated payout.
- Show quote freshness.
- Show vault utilization warning if available.

---

## 10.4 Mint Range

```text
Input:
- manager ID
- range key
- quantity / amount
- quote asset type

Steps:
1. Check manager balance.
2. Re-fetch preview or quote timestamp.
3. Build mint_range transaction.
4. Submit transaction.
5. Show success digest.
6. Refresh portfolio.
```

Success state:

```text
Position created
SUI settles above $4.00 and at or below $5.00
Expiry: June 21, 2026
Tx digest: ...
```

---

## 10.5 Redeem Range

```text
Input:
- manager ID
- range key
- quantity

Steps:
1. Load user range position.
2. Check whether market is live or settled.
3. Preview redeem value if live.
4. Build redeem_range transaction.
5. Submit transaction.
6. Refresh portfolio and manager balance.
```

UX copy for live redeem:

> You are closing this prediction before expiry. The redeem value uses current DeepBook Predict pricing.

UX copy for settled claim:

> This prediction has settled. Your payout is determined by the settlement price.

---

## 10.6 Follow Creator Strategy

```text
Input:
- strategy ID
- follower amount

Steps:
1. Load strategy parameters.
2. Validate strategy still active.
3. Preview quote for same range.
4. Calculate creator fee and platform fee.
5. Build follow transaction or transaction bundle.
6. Submit transaction.
7. Emit / index follow event.
8. Update strategy volume and participant count.
```

MVP simplification:

- Creator strategy can initially be off-chain metadata.
- Follow trade can still call official DeepBook Predict directly.
- Fee tracking can be shown in demo mode or implemented in a thin Move wrapper.

---

## 11. Error Handling

RangePilot must translate low-level failures into product language.

| Error Type | User Message |
|---|---|
| Oracle stale | Market data is stale. Please wait for the next oracle update. |
| Invalid strike | This price is outside the supported strike grid. Try a nearby valid price. |
| Ask out of bounds | This prediction is not currently mintable due to protocol price limits. |
| Insufficient manager balance | Deposit more USDC into your Predict Account. |
| Vault exposure exceeded | Vault risk limit reached. Try a smaller amount or a different range. |
| Manager owner mismatch | This Predict Account does not belong to the connected wallet. |
| Trading paused | This market is temporarily paused. |
| Withdraw rate-limited | LP withdrawals are temporarily rate-limited. Try again later. |
| Quote asset disabled | This quote asset is no longer accepted for new deposits. Existing outflows may still be available. |

---

## 12. UX Design Principles

## 12.1 Hide Protocol Complexity, Not Protocol Truth

Do not expose raw Move names as primary UI concepts, but do not lie about settlement or pricing.

Example:

- Good: “Predict Account” with tooltip “Powered by PredictManager.”
- Bad: showing only “Account” with no explanation of where funds are held.

---

## 12.2 Every Trade Must Explain the Win Condition

Before minting, the user must see:

- asset
- expiry
- range
- exact boundary rule
- maximum loss
- potential payout
- settlement source

---

## 12.3 Preview Before Action

Every risky action should have a preview:

- deposit
- mint
- redeem
- supply
- withdraw
- follow strategy

---

## 12.4 Make Status Obvious

Markets and positions should always show:

- active
- stale
- pending settlement
- settled
- claimable
- expired

---

## 12.5 Use Social Sharing as a Growth Loop

Every prediction should be shareable:

```text
I predicted SUI would settle between $4 and $5 on RangePilot.
```

Every settled win should generate a share card:

```text
SUI settled at $4.62. My RangePilot prediction won 2.38x.
```

---

## 13. MVP Scope

## 13.1 Must-Have

### Product

- Wallet connection.
- PredictManager load/create.
- Quote deposit display.
- Market and expiry selection.
- Range builder.
- Quote preview.
- `mint_range` transaction.
- Portfolio display.
- Basic redeem / claim flow.
- Basic creator strategy page.
- Basic vault metrics page.

### Technical

- DeepBook Predict integration.
- Transaction builder SDK.
- Read API or normalized read hooks.
- Error translator.
- Event or transaction history display.

### Demo

- One clear SUI range prediction flow.
- One creator strategy follow flow.
- One portfolio claim/redeem flow.
- One vault risk dashboard view.

---

## 13.2 Should-Have

- AI natural language strategy composer.
- Social share card.
- Creator fee tracking.
- PLP supply / withdraw.
- Position history chart.
- Implied probability display.
- Oracle freshness indicator.
- Vault utilization warning.

---

## 13.3 Could-Have

- Telegram bot.
- Leaderboard.
- Referral campaigns.
- Advanced LP analytics.
- Multi-asset strategy pages.
- AI-generated market explanations.
- Creator win-rate tracking.

---

## 13.4 Not for MVP

- Custom pricing engine.
- Custom oracle.
- Custom vault.
- Multi-leg strategy vaults.
- Automated trading agent.
- Leveraged positions.
- Complex secondary market.

---

## 14. Suggested Page Structure

## 14.1 Landing Page

Sections:

- Hero: “Turn market views into range predictions on DeepBook Predict.”
- Three cards:
  - Predict a Range
  - Follow a Creator
  - Provide Liquidity
- Featured markets
- Featured creator strategies
- Protocol stats

---

## 14.2 Trade Page

Components:

- asset selector
- expiry selector
- range input
- amount input
- win condition card
- quote preview card
- wallet / manager status
- mint button

---

## 14.3 Strategy Page

Components:

- creator profile
- thesis
- range and expiry
- current status
- total volume
- participants
- follow form
- risk disclosure
- comments or updates, optional

---

## 14.4 Portfolio Page

Components:

- manager balance
- active predictions
- settled predictions
- claimable payouts
- transaction history
- share cards

---

## 14.5 Vault Page

Components:

- vault balance
- total MTM
- max payout
- utilization
- PLP supply
- user PLP share
- open interest by expiry
- supply / withdraw forms

---

## 15. Demo Script

## 15.1 30-Second Pitch

> DeepBook Predict gives Sui powerful range-based prediction primitives, but direct interaction is too complex for normal users. RangePilot turns those primitives into a guided prediction product. Users choose a market view, preview post-trade pricing, mint a range position, track it in a portfolio, and claim after settlement. Creators can publish shareable strategies, and LPs can monitor vault risk.

---

## 15.2 3-Minute Demo

### Step 1: Open Trade Page

Show:

```text
Predict SUI range
```

Input:

```text
SUI will settle between $4.00 and $5.00 by June 21.
```

### Step 2: Preview Quote

Show:

- cost
- max loss
- estimated payout
- oracle status
- vault utilization warning

### Step 3: Mint Range

Submit transaction and show success.

### Step 4: Portfolio

Show active range position.

### Step 5: Creator Strategy

Open a public strategy page and show follow trade.

### Step 6: Vault Dashboard

Show LP metrics and explain how PLP users understand risk.

---

## 15.3 Final Demo Message

> RangePilot does not replace DeepBook Predict. It makes DeepBook Predict usable, shareable, and monetizable.

---

## 16. Technical Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Predict testnet APIs change | High | Isolate contract calls in SDK layer |
| Oracle state unavailable or stale | Medium | Add oracle status indicators and retry messaging |
| Quote mismatch before transaction | High | Re-preview before submit |
| Event indexing complexity | Medium | Start with direct reads and transaction history |
| Creator fee wrapper complexity | Medium | Start with off-chain metadata and add Move wrapper later |
| Vault metrics hard to decode | Medium | Show only metrics that can be reliably read |
| UX too complex | High | Use guided flow instead of pro terminal first |

---

## 17. Implementation Milestones

## Milestone 1: Protocol Integration Spike

Deliverables:

- load market data
- load/create PredictManager
- deposit quote asset
- preview range quote
- mint range transaction

Success criteria:

- One wallet can mint one DeepBook Predict range position from the UI.

---

## Milestone 2: Portfolio MVP

Deliverables:

- read manager balance
- read active range positions
- show expiry and status
- redeem or claim flow

Success criteria:

- User can see and manage active predictions.

---

## Milestone 3: Creator Strategy MVP

Deliverables:

- create strategy metadata
- public strategy page
- follow trade flow
- basic volume tracking

Success criteria:

- A creator can publish a prediction and another user can follow it.

---

## Milestone 4: Vault Dashboard MVP

Deliverables:

- vault balance
- PLP supply
- basic utilization
- risk summary

Success criteria:

- LP-facing page explains protocol liquidity and risk.

---

## Milestone 5: Demo Polish

Deliverables:

- landing page
- demo script
- error messages
- social share card
- short video
- English README

Success criteria:

- Judges can understand the product in under 60 seconds.

---

## 18. Open Questions

1. Which quote asset should be used for the MVP?
2. Which underlying asset and expiry are most reliable on the available Predict deployment?
3. Is the official predict-server available and stable enough for MVP reads?
4. Which metrics are directly readable from Vault without fragile decoding?
5. Should creator strategy metadata be on-chain or off-chain for the first version?
6. Should RangePilot charge real fees in the MVP or only simulate the business model?
7. Should AI composer be included in the first demo or saved as a follow-up feature?
8. How much of PLP supply / withdraw should be implemented versus shown as dashboard-only?

---

## 19. Recommended MVP Decision

For the hackathon version, RangePilot should prioritize the following:

```text
Primary MVP:
Guided SUI range prediction flow

Secondary MVP:
Creator strategy follow page

Tertiary MVP:
Vault / LP risk dashboard
```

The first version should not attempt to support every asset, every expiry, every position type, or every LP function.

The strongest demo is:

> A normal user turns a simple market opinion into a DeepBook Predict range position, follows a creator strategy, and tracks the prediction through portfolio and settlement.

---

## 20. Final Positioning

RangePilot should be positioned as:

> A guided prediction terminal and creator strategy layer for DeepBook Predict.

Not:

> A new prediction market protocol.

Not:

> An AI trading bot.

Not:

> A generic DeFi dashboard.

The winning angle is:

> DeepBook Predict already provides the hard protocol primitives. RangePilot provides the user experience, creator distribution, transaction flow, and risk visualization needed to turn those primitives into real usage.


---

## 21. Page Information Architecture

This section translates the product architecture into concrete pages, components, and user-facing information hierarchy.

RangePilot should avoid starting as a professional trading terminal. The MVP should start as a guided prediction product, then progressively expose advanced data for creators and LPs.

---

## 21.1 Global Navigation

Recommended top navigation:

```text
RangePilot
├─ Trade
├─ Strategies
├─ Portfolio
├─ Vault
└─ Docs / About
```

Secondary wallet area:

```text
Wallet Button
Network Badge
Predict Account Status
Manager Balance
```

### Global Status Elements

These should be visible across key pages:

- connected wallet
- current network
- PredictManager status
- quote balance
- oracle data freshness, when relevant
- transaction status drawer

---

## 21.2 Landing Page

### Purpose

The landing page should explain RangePilot in less than 30 seconds and route users into one of three flows:

1. Make a prediction.
2. Follow a creator strategy.
3. Provide liquidity.

### Hero Section

Headline:

```text
Turn market views into range predictions on DeepBook Predict.
```

Subheadline:

```text
RangePilot helps users create, follow, and manage range-based prediction positions with clear win conditions, post-trade pricing, and portfolio tracking.
```

Primary CTA:

```text
Predict a Range
```

Secondary CTA:

```text
Explore Strategies
```

### Three Product Cards

```text
Predict a Range
Choose an asset, expiry, and price range. Preview your cost and payout before minting.

Follow a Creator
Join public prediction strategies from traders, creators, and communities.

Provide Liquidity
Monitor vault risk and supply liquidity through PLP.
```

### Protocol Stats

MVP stats can include:

- total prediction volume
- active strategies
- active predictions
- vault balance
- number of participants

If real stats are not available in the first version, show only the values that can be reliably read or clearly label demo data.

---

## 21.3 Trade Page

### Purpose

The Trade Page is the core product experience. It turns a user’s market opinion into a DeepBook Predict range position.

### Layout

```text
┌──────────────────────────────────────────────┐
│ Header: Predict a Range                       │
│ Subcopy: Win if settlement lands in your range│
├───────────────────────┬──────────────────────┤
│ Left: Range Builder   │ Right: Preview Card   │
│                       │                      │
│ Asset selector        │ Win condition         │
│ Expiry selector       │ Cost                  │
│ Lower strike          │ Estimated payout      │
│ Upper strike          │ Max loss              │
│ Amount                │ Oracle status         │
│                       │ Vault/risk warnings   │
│ CTA: Preview          │ CTA: Mint Prediction  │
└───────────────────────┴──────────────────────┘
```

### Core Components

#### AssetSelector

Displays available underlying markets.

Fields:

- asset symbol
- asset icon
- active expiries
- market status

#### ExpirySelector

Displays expiry choices.

Fields:

- expiry date
- time remaining
- market status
- settlement state

#### RangeInput

Accepts lower and upper strike.

Validation:

- lower strike must be below upper strike
- strikes must be inside supported grid
- strikes should snap to valid tick size where possible

#### AmountInput

Accepts quote amount.

Displays:

- wallet balance
- Predict Account balance
- max amount button

#### WinConditionCard

Shows the human-readable condition.

Example:

```text
You win if SUI settles above $4.00 and at or below $5.00 on June 21, 2026.
```

Important: use explicit boundary language because DeepBook Predict range settlement uses `(lower, upper]`.

#### QuotePreviewCard

Displays:

- post-trade cost
- estimated payout
- max loss
- implied probability, if safely computed
- fees
- oracle status
- vault utilization warning
- strike grid warning
- quote timestamp

#### TransactionButton

Button states:

```text
Connect Wallet
Create Predict Account
Deposit USDC
Preview Prediction
Mint Prediction
Minting...
Prediction Created
```

---

## 21.4 Strategies Page

### Purpose

The Strategies Page turns individual predictions into shareable content and supports the creator economy business model.

### Layout

```text
┌─────────────────────────────────────────────┐
│ Header: Creator Strategies                   │
│ Filters: Asset / Expiry / Status / Creator   │
├─────────────────────────────────────────────┤
│ Strategy Cards Grid                          │
│ - title                                      │
│ - creator                                    │
│ - range                                      │
│ - expiry                                     │
│ - volume                                     │
│ - participants                               │
│ - current status                             │
└─────────────────────────────────────────────┘
```

### Strategy Card

Fields:

- strategy title
- creator address or handle
- asset
- range
- expiry
- thesis summary
- total volume
- participant count
- status badge
- follow button

Example:

```text
SUI Range Bounce
By @creator
SUI settles above $4.00 and at or below $5.00 by June 21
Volume: 24,300 USDC
Participants: 128
Follow Strategy
```

---

## 21.5 Strategy Detail Page

### Purpose

A public page that lets users understand and follow a creator’s prediction.

### Layout

```text
┌─────────────────────────────────────────────┐
│ Strategy Header                              │
│ Title / Creator / Status                     │
├───────────────────────┬─────────────────────┤
│ Left: Thesis           │ Right: Follow Card   │
│ Market view            │ Amount input         │
│ Range                  │ Quote preview        │
│ Expiry                 │ Fees                 │
│ Risk explanation       │ Follow button        │
├─────────────────────────────────────────────┤
│ Strategy Stats                              │
│ Participants / Volume / Current status       │
└─────────────────────────────────────────────┘
```

### Follow Card

Shows:

- amount input
- creator fee
- platform fee
- total cost
- expected payout
- win condition
- mint button

MVP simplification:

- creator strategy metadata can be off-chain
- follow trade can call DeepBook Predict directly
- fee logic may be simulated for demo, then moved on-chain later

---

## 21.6 Portfolio Page

### Purpose

The Portfolio Page is the user’s home for active and settled predictions.

### Layout

```text
┌─────────────────────────────────────────────┐
│ Header: My Predictions                       │
│ Predict Account Balance                      │
├─────────────────────────────────────────────┤
│ Tabs: Active / Settled / History             │
├─────────────────────────────────────────────┤
│ Position Cards                               │
└─────────────────────────────────────────────┘
```

### Position Card

Fields:

- asset
- range
- expiry
- quantity
- active / settled status
- current spot, if available
- in range / out of range indicator
- estimated redeem value
- claimable payout
- action button

Example:

```text
SUI Range Prediction
Range: $4.00 - $5.00
Expiry: June 21, 2026
Status: Active
Current status: In range
Estimated redeem value: 126 USDC
Action: Redeem
```

### Settled Position Card

Example:

```text
SUI settled at $4.62
Your prediction was correct
Claimable payout: 238 USDC
Action: Claim
```

---

## 21.7 Vault Page

### Purpose

The Vault Page helps LPs understand liquidity, PLP, and protocol risk.

### Layout

```text
┌─────────────────────────────────────────────┐
│ Header: Predict Vault                        │
├─────────────────────────────────────────────┤
│ Metrics Row                                  │
│ Vault Balance / Total MTM / Max Payout       │
│ Utilization / PLP Supply / Open Interest     │
├───────────────────────┬─────────────────────┤
│ Risk Panels           │ Supply / Withdraw    │
│ Expiry risk           │ PLP form             │
│ Range heatmap         │ User PLP share       │
└───────────────────────┴─────────────────────┘
```

### LP Metrics

Minimum viable metrics:

- vault balance
- total MTM
- total max payout
- utilization
- PLP supply
- user PLP balance

Advanced metrics:

- exposure by expiry
- exposure by strike range
- historical utilization
- vault PnL
- largest risk bucket

---

## 22. Component Specification

This section defines reusable frontend components for the MVP.

---

## 22.1 WalletStatus

### Responsibility

Show wallet connection and network state.

### States

```text
Disconnected
Connected wrong network
Connected correct network
Transaction pending
```

### Actions

- connect wallet
- switch network, if supported
- copy address
- open explorer

---

## 22.2 PredictAccountStatus

### Responsibility

Show the user’s PredictManager state.

### States

```text
No Predict Account
Creating Predict Account
Predict Account Ready
Needs Deposit
```

### Fields

- manager ID
- quote balance
- active positions count
- create account CTA
- deposit CTA

---

## 22.3 MarketStatusBadge

### Responsibility

Show oracle / market status.

### States

```text
Active
Stale
Pending Settlement
Settled
Paused
Unavailable
```

### UX Rule

If status is stale or paused, the mint button should be disabled and the UI should explain why.

---

## 22.4 RangeBuilder

### Responsibility

Convert user inputs into a valid range position.

### Inputs

- asset
- expiry
- lower strike
- upper strike
- amount

### Outputs

- normalized range input
- validation result
- win condition string

---

## 22.5 QuotePreview

### Responsibility

Display official or official-derived quote information.

### Inputs

- market
- range input
- quote result
- oracle status
- vault risk status

### Outputs

- cost
- max loss
- estimated payout
- fees
- warnings
- CTA eligibility

---

## 22.6 PositionCard

### Responsibility

Represent one active or settled range position.

### Fields

- asset
- range
- expiry
- status
- quantity
- estimated redeem value
- claimable payout
- action button

---

## 22.7 StrategyCard

### Responsibility

Summarize a public creator strategy.

### Fields

- title
- creator
- thesis
- range
- expiry
- volume
- participants
- status

---

## 22.8 VaultMetricCard

### Responsibility

Show one LP metric with explanation.

### Examples

```text
Vault Balance
Total MTM
Max Payout
Utilization
PLP Supply
```

Each card should include a tooltip explaining the metric in product language.

---

## 22.9 TransactionDrawer

### Responsibility

Show transaction lifecycle across the app.

### States

```text
Preparing transaction
Waiting for wallet approval
Transaction submitted
Confirming
Success
Failed
```

### Data

- transaction digest
- explorer link
- error explanation
- retry CTA

---

## 23. Technical Implementation Plan

This section turns the product specification into buildable engineering modules.

---

## 23.1 Repository Structure

Recommended monorepo layout:

```text
rangepilot/
├─ apps/
│  ├─ web/                  # frontend app
│  └─ api/                  # lightweight read API, optional for MVP
├─ packages/
│  ├─ sdk/                  # transaction builder and protocol bindings
│  ├─ ui/                   # reusable UI components
│  ├─ config/               # network and contract config
│  └─ types/                # shared TypeScript types
├─ move/                    # optional RangePilot Move layer
│  └─ sources/
├─ docs/
│  ├─ architecture.md
│  ├─ demo-script.md
│  └─ integration-notes.md
└─ README.md
```

If time is limited, start with:

```text
apps/web
packages/sdk
packages/config
```

Add `apps/api` and `move` only after the core trade flow works.

---

## 23.2 Frontend Implementation Modules

### apps/web routes

```text
/
/trade
/strategies
/strategies/:id
/portfolio
/vault
```

### Suggested frontend folders

```text
apps/web/src/
├─ app/ or pages/
├─ components/
│  ├─ wallet/
│  ├─ manager/
│  ├─ market/
│  ├─ trade/
│  ├─ quote/
│  ├─ portfolio/
│  ├─ strategies/
│  └─ vault/
├─ hooks/
├─ stores/
├─ lib/
└─ styles/
```

---

## 23.3 SDK Modules

### packages/sdk

```text
packages/sdk/src/
├─ client.ts
├─ manager.ts
├─ markets.ts
├─ range.ts
├─ quote.ts
├─ trade.ts
├─ portfolio.ts
├─ vault.ts
├─ strategies.ts
├─ errors.ts
└─ index.ts
```

### SDK Responsibilities

| Module | Responsibility |
|---|---|
| client.ts | Sui client initialization |
| manager.ts | load/create PredictManager, deposit helpers |
| markets.ts | load markets, expiries, oracle status |
| range.ts | build and validate range inputs |
| quote.ts | fetch or compute display quote from official sources |
| trade.ts | build mint/redeem transactions |
| portfolio.ts | read user positions and balances |
| vault.ts | read vault and PLP metrics |
| strategies.ts | creator strategy metadata helpers |
| errors.ts | map abort codes to product errors |

---

## 23.4 Configuration Layer

### Network Config

```ts
export type NetworkConfig = {
  network: 'testnet' | 'mainnet' | 'localnet';
  packageIds: {
    predict: string;
    deepbook?: string;
    rangepilot?: string;
  };
  objectIds: {
    predict: string;
    registry?: string;
  };
  quoteAssets: QuoteAssetConfig[];
  apiBaseUrl?: string;
};
```

### Quote Asset Config

```ts
export type QuoteAssetConfig = {
  symbol: string;
  coinType: string;
  decimals: number;
  iconUrl?: string;
};
```

### Principle

No package ID, object ID, or coin type should be hardcoded inside UI components. All protocol addresses should go through config.

---

## 23.5 Read Strategy

### MVP Read Strategy

Use a hybrid approach:

```text
Critical wallet state:
Direct Sui object reads

Market list and summaries:
Official Predict read model, if available

Portfolio history:
Sui events or transaction history

Creator strategies:
RangePilot metadata store
```

### Read Priority

1. Correctness for wallet-critical state.
2. Fast enough UX for market browsing.
3. Simple implementation for hackathon demo.
4. Replaceable architecture for future indexer.

---

## 23.6 Transaction Strategy

Every write action should follow the same lifecycle:

```text
validate inputs
→ refresh relevant state
→ build transaction
→ ask wallet to sign
→ submit
→ wait for confirmation
→ refresh local queries
→ show result
```

### Transaction Types

| Action | DeepBook Predict Call | MVP Priority |
|---|---|---:|
| Create Predict Account | `create_manager` | P0 |
| Deposit Quote | manager deposit path | P0 |
| Mint Range | `mint_range` | P0 |
| Redeem Range | `redeem_range` | P0 |
| Mint Single-Leg | `mint` | P2 |
| Redeem Single-Leg | `redeem` | P2 |
| Supply PLP | `supply` | P1 |
| Withdraw PLP | `withdraw` | P1 |

---

## 23.7 Error Translation Layer

Implement a dedicated error translator in the SDK.

```ts
type RangePilotError = {
  code: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  retryable: boolean;
};
```

Example mapping:

```ts
const ERROR_MESSAGES = {
  ORACLE_STALE: {
    title: 'Market data is stale',
    message: 'Please wait for the next oracle update before minting this prediction.',
    retryable: true,
  },
  INVALID_STRIKE: {
    title: 'Unsupported price level',
    message: 'This strike is outside the supported grid. Try a nearby valid price.',
    retryable: true,
  },
  VAULT_EXPOSURE_EXCEEDED: {
    title: 'Vault risk limit reached',
    message: 'Try a smaller amount or choose a different range.',
    retryable: true,
  },
};
```

---

## 24. Build Priority Plan

## 24.1 P0: Must Work Before Anything Else

### Objective

One user can mint one DeepBook Predict range position through RangePilot.

### Tasks

1. Set up project and wallet integration.
2. Configure DeepBook Predict package/object IDs.
3. Load available market or hardcode one reliable market for first spike.
4. Load or create PredictManager.
5. Deposit quote asset.
6. Build RangeKey from UI input.
7. Preview quote.
8. Mint range.
9. Show success transaction.
10. Read position into portfolio.

### Success Criteria

```text
A judge can connect wallet, choose SUI range, preview, mint, and see the position.
```

---

## 24.2 P1: Make It a Product

### Objective

Turn the raw flow into a polished, understandable prediction product.

### Tasks

1. Landing page.
2. Clear Trade Page UX.
3. Win condition card.
4. Post-trade quote explanation.
5. Portfolio cards.
6. Error translation.
7. Strategy detail page with follow flow.
8. Basic vault dashboard.
9. Demo data fallbacks where real metrics are unavailable.

### Success Criteria

```text
A non-technical judge understands what the user is doing and why it matters.
```

---

## 24.3 P2: Make It Differentiated

### Objective

Add features that make RangePilot stand out from a generic protocol frontend.

### Tasks

1. Creator strategy publishing.
2. Creator fee model.
3. AI natural language range composer.
4. Social share card.
5. LP risk explanation.
6. Strategy leaderboard.
7. Historical prediction page.

### Success Criteria

```text
RangePilot feels like a product with distribution and business model, not just a contract UI.
```

---

## 25. Hackathon Delivery Checklist

## 25.1 Product Checklist

- [ ] Landing page explains product in under 30 seconds.
- [ ] Trade flow has guided range builder.
- [ ] Win condition is explicit.
- [ ] Quote preview is visible before transaction.
- [ ] User can create or load Predict Account.
- [ ] User can deposit quote asset.
- [ ] User can mint a range prediction.
- [ ] User can view active prediction in portfolio.
- [ ] User can understand settlement condition.
- [ ] Creator strategy page exists.
- [ ] Vault dashboard exists.

---

## 25.2 Technical Checklist

- [ ] Contract IDs and object IDs are config-driven.
- [ ] SDK layer isolates transaction construction.
- [ ] UI does not hardcode protocol internals.
- [ ] Error translator exists.
- [ ] Query invalidation works after transactions.
- [ ] Transaction digest and explorer link are shown.
- [ ] Read fallbacks are available for demo.
- [ ] README explains setup and demo flow.
- [ ] Demo video can be recorded without manual recovery steps.

---

## 25.3 Demo Checklist

- [ ] One reliable wallet funded with quote asset.
- [ ] One reliable market / expiry selected.
- [ ] One creator strategy prepared.
- [ ] Portfolio has at least one position.
- [ ] Vault dashboard has meaningful values or clearly labeled demo values.
- [ ] Browser bookmarks and explorer links prepared.
- [ ] English pitch script prepared.
- [ ] Fallback screenshots prepared.

---

## 26. Recommended Next Build Step

The next practical step is not to implement every page. The next step is a protocol integration spike.

### Spike Goal

```text
Can RangePilot create/load a PredictManager and mint one range position from a web UI?
```

### Spike Deliverables

1. Minimal Vite or Next.js app.
2. Wallet connection.
3. Network config.
4. Hardcoded known Predict market.
5. PredictManager load/create.
6. Deposit flow.
7. Range input form.
8. Mint range transaction.
9. Position display.

### Why This Comes First

If this works, every other product layer can be built around it.

If this fails, the project must adjust scope before spending time on creator pages, dashboards, or AI features.

---

## 27. Updated Product Architecture Summary

RangePilot should be built as three progressively stronger layers:

```text
Layer 1: Guided DeepBook Predict Trading
- create manager
- deposit
- preview
- mint range
- portfolio

Layer 2: Creator Strategy Distribution
- public strategy pages
- follow trades
- creator fees
- social sharing

Layer 3: Vault and LP Intelligence
- PLP dashboard
- utilization
- MTM / max payout
- risk summaries
```

This architecture gives the project a credible progression:

1. It works as a real DeepBook Predict frontend.
2. It has a business model through trading and creators.
3. It becomes defensible through risk intelligence and LP tooling.

The MVP should ship Layer 1 completely, show Layer 2 convincingly, and include a lightweight Layer 3 dashboard.


---

## 28. Protocol Integration Spike Task Plan

The protocol integration spike is the first real engineering milestone.

The goal is not to build the full RangePilot product. The goal is to prove that the product can execute the most important DeepBook Predict path from a web UI.

---

## 28.1 Spike Objective

### Primary Question

```text
Can RangePilot create/load a PredictManager, deposit quote asset, mint one range position, and display it back in the portfolio?
```

### Required End-to-End Flow

```text
Connect wallet
→ Load or create PredictManager
→ Deposit quote asset
→ Select one known market
→ Enter lower and upper strike
→ Preview quote
→ Mint range position
→ Confirm transaction
→ Read position into portfolio
```

### Non-Goals for the Spike

Do not build these during the first spike:

- full landing page
- creator strategy system
- AI composer
- PLP supply / withdraw
- advanced vault dashboard
- leaderboard
- social sharing
- custom Move wrapper
- full indexer

The spike should be intentionally narrow.

---

## 28.2 Assumptions to Validate

Before implementation, validate these assumptions.

| Assumption | Why It Matters | Validation Method |
|---|---|---|
| A usable DeepBook Predict deployment exists | Needed for real transactions | Confirm package IDs, object IDs, and network |
| At least one active oracle market exists | Needed for `mint_range` | Read market/oracle status |
| Quote asset is available to the test wallet | Needed for deposit and mint | Check wallet coin balance |
| PredictManager creation works from wallet | Needed for user onboarding | Execute create flow |
| RangeKey format is known and constructable | Needed for range mint | Build from market + lower + upper |
| Quote preview path is callable | Needed for safe UX | Call official read or dry-run transaction |
| User range positions are readable | Needed for portfolio | Read PredictManager object or event history |

If any of these assumptions fail, adjust scope immediately instead of building UI around a broken path.

---

## 28.3 Spike Repository Scope

For the spike, keep the repository small.

```text
rangepilot/
├─ apps/
│  └─ web/
├─ packages/
│  ├─ sdk/
│  ├─ config/
│  └─ types/
└─ README.md
```

Do not add `apps/api` or `move/` until the spike path works.

---

## 28.4 Spike Routes

The web app only needs three routes during the spike.

```text
/
/trade
/portfolio
```

### `/`

Temporary landing page.

Required elements:

- product name
- short description
- link to Trade
- link to Portfolio
- wallet connect button

### `/trade`

Core integration page.

Required elements:

- wallet status
- Predict Account status
- quote balance
- market selector, can be hardcoded initially
- lower strike input
- upper strike input
- amount input
- preview button
- mint button
- transaction drawer

### `/portfolio`

Minimal portfolio page.

Required elements:

- manager ID
- quote balance
- active range positions
- last transaction digest
- refresh button

---

## 28.5 Spike SDK Task Breakdown

Create `packages/sdk` before building UI logic.

### File: `packages/sdk/src/client.ts`

Responsibilities:

- create Sui client
- expose network helpers
- expose explorer URL builder

Functions:

```ts
export function createRangePilotClient(config: NetworkConfig): SuiClient;
export function getExplorerTxUrl(digest: string, network: string): string;
export function getExplorerObjectUrl(objectId: string, network: string): string;
```

Acceptance criteria:

- UI can initialize a Sui client from config.
- Transaction digest can be linked to explorer.

---

### File: `packages/sdk/src/manager.ts`

Responsibilities:

- find existing PredictManager
- build create manager transaction
- read manager quote balance
- expose deposit helper

Functions:

```ts
export async function findPredictManager(params: FindPredictManagerParams): Promise<PredictManagerRef | null>;
export function buildCreateManagerTx(params: CreateManagerParams): Transaction;
export async function getManagerBalance(params: GetManagerBalanceParams): Promise<bigint>;
export function buildDepositQuoteTx(params: DepositQuoteParams): Transaction;
```

Open issue:

- Confirm whether manager discovery should use owner object query, event history, or a known registry pattern.

Acceptance criteria:

- User can create a manager if none exists.
- User can see manager ID after creation.
- User can see quote balance.
- User can deposit quote asset into manager.

---

### File: `packages/sdk/src/markets.ts`

Responsibilities:

- load available markets
- load oracle status
- expose a fallback hardcoded market for spike

Functions:

```ts
export async function getMarkets(params: GetMarketsParams): Promise<PredictMarket[]>;
export async function getMarket(params: GetMarketParams): Promise<PredictMarket>;
export async function getOracleStatus(params: GetOracleStatusParams): Promise<OracleStatus>;
export function getSpikeMarket(config: NetworkConfig): PredictMarket;
```

Spike simplification:

- Start with one hardcoded known market.
- Replace with dynamic market discovery after the main transaction path works.

Acceptance criteria:

- Trade page can render one active market.
- Market includes oracle ID, expiry, strike grid, and quote asset.

---

### File: `packages/sdk/src/range.ts`

Responsibilities:

- validate lower and upper strikes
- snap strikes to grid
- build user-facing win condition
- construct RangeKey-compatible data

Functions:

```ts
export function validateRangeInput(input: RangeInput, market: PredictMarket): RangeValidationResult;
export function snapStrikeToGrid(strike: number, market: PredictMarket): number;
export function formatWinCondition(input: RangeInput, market: PredictMarket): string;
export function buildRangeKey(input: RangeInput, market: PredictMarket): RangeKeyInput;
```

Validation rules:

- lower strike must be less than upper strike
- lower and upper must be inside market grid
- lower and upper must align with tick size
- amount must be positive
- market must be active

Acceptance criteria:

- UI prevents invalid range submissions.
- UI clearly displays `(lower, upper]` win condition.

---

### File: `packages/sdk/src/quote.ts`

Responsibilities:

- preview range mint cost
- preview range redeem value, if possible
- expose quote warnings

Functions:

```ts
export async function previewMintRange(params: PreviewMintRangeParams): Promise<QuotePreview>;
export async function previewRedeemRange(params: PreviewRedeemRangeParams): Promise<QuotePreview>;
export function deriveQuoteWarnings(params: DeriveQuoteWarningsParams): QuoteWarning[];
```

Preferred implementation order:

1. Use official quote/read function if available.
2. If unavailable, use dry-run transaction to estimate result.
3. If neither is reliable during spike, show preview as unavailable and still test mint flow with clear warning.

Acceptance criteria:

- Trade page shows a quote preview before minting.
- If quote cannot be fetched, the UI explains why.
- The mint button is disabled unless the user explicitly accepts unavailable preview, if this fallback is used.

---

### File: `packages/sdk/src/trade.ts`

Responsibilities:

- build mint range transaction
- build redeem range transaction later
- handle transaction result parsing

Functions:

```ts
export function buildMintRangeTx(params: MintRangeParams): Transaction;
export function buildRedeemRangeTx(params: RedeemRangeParams): Transaction;
export function parseTradeResult(result: SuiTransactionBlockResponse): TradeResult;
```

Spike priority:

- `buildMintRangeTx` first.
- `buildRedeemRangeTx` can be added after portfolio reads work.

Acceptance criteria:

- User can submit `mint_range` from the UI.
- Success state shows digest and explorer link.
- Query cache refreshes after success.

---

### File: `packages/sdk/src/portfolio.ts`

Responsibilities:

- read active range positions
- read quote balance
- normalize manager data into UI-friendly structures

Functions:

```ts
export async function getPortfolio(params: GetPortfolioParams): Promise<Portfolio>;
export async function getRangePositions(params: GetRangePositionsParams): Promise<PortfolioRangePosition[]>;
export function normalizeRangePosition(raw: unknown): PortfolioRangePosition;
```

Open issue:

- Confirm exact object layout for reading `range_positions` from `PredictManager`.
- If direct table reads are difficult, use event-based fallback for spike.

Acceptance criteria:

- After minting, the position appears in `/portfolio`.
- Portfolio shows range, expiry, quantity, and status.

---

### File: `packages/sdk/src/errors.ts`

Responsibilities:

- translate transaction errors into product messages
- normalize SDK errors

Functions:

```ts
export function translateSuiError(error: unknown): RangePilotError;
export function isRetryableError(error: RangePilotError): boolean;
```

Acceptance criteria:

- Failed transactions show human-readable messages.
- Common validation failures do not appear as raw Move aborts.

---

## 28.6 Spike Frontend Task Breakdown

---

## 28.6.1 Wallet Setup

Tasks:

1. Install Sui wallet libraries.
2. Add wallet provider.
3. Add connect button.
4. Display wallet address.
5. Display network.
6. Disable trade actions when wallet is disconnected.

Acceptance criteria:

- User can connect wallet.
- UI shows connected address.
- UI blocks actions on wrong or unsupported network.

---

## 28.6.2 Predict Account Panel

Tasks:

1. Call `findPredictManager` after wallet connects.
2. If manager exists, show manager ID and quote balance.
3. If not, show `Create Predict Account` button.
4. On create success, refresh manager state.
5. Add `Deposit` button or input.

UI states:

```text
No wallet
No Predict Account
Creating Predict Account
Predict Account Ready
Needs Deposit
Ready to Trade
```

Acceptance criteria:

- User understands the account requirement.
- User can create manager without reading protocol docs.

---

## 28.6.3 Trade Form

Tasks:

1. Render hardcoded spike market.
2. Render lower strike input.
3. Render upper strike input.
4. Render amount input.
5. Validate range on every change.
6. Display win condition.
7. Display validation errors.

Acceptance criteria:

- Invalid ranges cannot be previewed.
- Valid range produces a clear win condition.

---

## 28.6.4 Quote Preview Card

Tasks:

1. Add preview button.
2. Call `previewMintRange`.
3. Show loading state.
4. Show cost, max loss, estimated payout if available.
5. Show warnings.
6. Store quote timestamp.

Acceptance criteria:

- User sees quote information before minting.
- UI explains post-trade pricing.

---

## 28.6.5 Mint Transaction

Tasks:

1. Add `Mint Prediction` button.
2. Before minting, revalidate wallet, manager, balance, range, and market.
3. Build transaction using SDK.
4. Request wallet signature.
5. Submit transaction.
6. Show transaction drawer.
7. Show digest and explorer link.
8. Refresh manager and portfolio queries.

Acceptance criteria:

- One successful `mint_range` transaction can be executed from UI.
- Success state is understandable and demo-ready.

---

## 28.6.6 Portfolio Read

Tasks:

1. Create `/portfolio` route.
2. Load manager state.
3. Read range positions.
4. Render position cards.
5. Show fallback if no position is found.
6. Add manual refresh button.

Acceptance criteria:

- Minted range appears in portfolio.
- Portfolio can be shown during demo.

---

## 28.7 Spike Data and Config Tasks

### Network Config

Create:

```text
packages/config/src/networks.ts
```

Fields:

- network
- RPC URL
- Predict package ID
- Predict object ID
- registry object ID, if needed
- quote asset coin type
- quote asset decimals
- explorer base URL
- fallback market config

### Fallback Market Config

For the spike, define one market manually:

```ts
export const SPIKE_MARKET = {
  underlying: 'SUI',
  oracleId: '0x...',
  expiryMs: 0,
  minStrike: 0,
  maxStrike: 0,
  tickSize: 0,
  quoteAssetType: '0x...::coin::COIN',
};
```

Replace zeros with validated deployment values.

Acceptance criteria:

- The app can run without dynamic market discovery.
- All hardcoded values are isolated in config.

---

## 28.8 Spike Testing Plan

### Unit Tests

Target files:

- `range.ts`
- `errors.ts`
- `config`

Test cases:

- lower >= upper rejects
- strike outside grid rejects
- strike snaps to valid tick
- win condition formats correctly
- error translation returns product message

### Integration Tests

Manual or scripted:

```text
connect wallet
create manager
deposit quote
preview range
mint range
open portfolio
confirm position appears
```

### Demo Recovery Tests

Before recording or demoing:

- test with fresh wallet
- test with wallet that already has manager
- test with insufficient balance
- test with invalid range
- test quote unavailable fallback
- test failed transaction message

---

## 28.9 Spike Acceptance Criteria

The spike is complete when all of the following are true:

- [ ] Wallet connects.
- [ ] App loads supported network config.
- [ ] App can create or load PredictManager.
- [ ] App can display manager quote balance.
- [ ] App can deposit quote asset.
- [ ] App renders one valid Predict market.
- [ ] App validates lower and upper strikes.
- [ ] App displays a clear win condition.
- [ ] App previews or gracefully handles unavailable quote.
- [ ] App builds and submits `mint_range` transaction.
- [ ] App shows transaction success with digest.
- [ ] App shows minted range in portfolio or event-based fallback.
- [ ] README documents how to reproduce the flow.

---

## 28.10 Spike Failure Modes and Fallbacks

| Failure | Likely Cause | Fallback |
|---|---|---|
| Cannot find active market | Deployment unavailable or config wrong | Use localnet or official simulation data for UI while fixing integration |
| Cannot discover manager | Object query pattern unclear | Store manager ID locally after creation and document limitation |
| Cannot read range positions | Table layout difficult to decode | Use event-based portfolio fallback for spike |
| Quote preview unavailable | Official read path missing | Use dry-run or show preview unavailable with clear warning |
| Mint fails with stale oracle | Oracle not fresh | Add market freshness badge and choose another market |
| Mint fails with ask bounds | Range not mintable | Try different strike range or smaller amount |
| Mint fails with vault exposure | Vault risk limit reached | Reduce amount or choose wider/different range |
| Deposit path unclear | Manager deposit API mismatch | Implement deposit after confirming exact entrypoint; temporarily pre-fund manager if possible |

---

## 29. Engineering Issue List

This section can be copied into GitHub Issues.

---

## 29.1 Issue: Initialize RangePilot Web App

### Description

Create the initial frontend app with wallet provider, routing, and base layout.

### Tasks

- [ ] Create app scaffold.
- [ ] Add TypeScript.
- [ ] Add styling system.
- [ ] Add Sui wallet provider.
- [ ] Add routes: `/`, `/trade`, `/portfolio`.
- [ ] Add base navigation.

### Acceptance Criteria

- App runs locally.
- Wallet connect button appears.
- User can navigate between pages.

---

## 29.2 Issue: Add Network and Protocol Config

### Description

Centralize all network, package, object, and quote asset configuration.

### Tasks

- [ ] Create `packages/config`.
- [ ] Define `NetworkConfig`.
- [ ] Add testnet config.
- [ ] Add fallback spike market.
- [ ] Add explorer URL config.

### Acceptance Criteria

- UI imports config without hardcoded object IDs.
- Network can be switched by config.

---

## 29.3 Issue: Build SDK Client Module

### Description

Create Sui client helpers and explorer utilities.

### Tasks

- [ ] Add `packages/sdk/src/client.ts`.
- [ ] Implement Sui client factory.
- [ ] Implement explorer URL helpers.
- [ ] Export SDK index.

### Acceptance Criteria

- Frontend can create a Sui client from config.
- Transaction and object explorer links work.

---

## 29.4 Issue: Implement PredictManager Load/Create Flow

### Description

Allow users to create or load their Predict Account.

### Tasks

- [ ] Implement `findPredictManager`.
- [ ] Implement `buildCreateManagerTx`.
- [ ] Add Predict Account panel.
- [ ] Show manager ID.
- [ ] Refresh after creation.

### Acceptance Criteria

- User can create manager.
- Existing manager can be displayed or locally restored.

---

## 29.5 Issue: Implement Quote Deposit Flow

### Description

Allow users to deposit quote asset into PredictManager.

### Tasks

- [ ] Confirm deposit entrypoint.
- [ ] Implement `buildDepositQuoteTx`.
- [ ] Add deposit UI.
- [ ] Show wallet balance and manager balance.
- [ ] Refresh after deposit.

### Acceptance Criteria

- User can deposit quote asset.
- Manager balance updates after deposit.

---

## 29.6 Issue: Implement Range Validation and Win Condition

### Description

Create range input validation and user-facing win condition copy.

### Tasks

- [ ] Implement `validateRangeInput`.
- [ ] Implement `snapStrikeToGrid`.
- [ ] Implement `formatWinCondition`.
- [ ] Add validation UI.
- [ ] Add win condition card.

### Acceptance Criteria

- Invalid range is blocked.
- Valid range displays clear `(lower, upper]` condition.

---

## 29.7 Issue: Implement Quote Preview

### Description

Show cost and payout preview before minting.

### Tasks

- [ ] Investigate official quote function or read path.
- [ ] Implement `previewMintRange`.
- [ ] Add quote preview card.
- [ ] Add loading and error states.
- [ ] Explain post-trade pricing.

### Acceptance Criteria

- User sees preview or an explicit unavailable-preview warning.
- Mint button behavior matches preview state.

---

## 29.8 Issue: Implement Mint Range Transaction

### Description

Allow users to mint one range prediction.

### Tasks

- [ ] Implement `buildMintRangeTx`.
- [ ] Wire Trade Page mint button.
- [ ] Add transaction drawer.
- [ ] Show digest and explorer link.
- [ ] Refresh queries after success.

### Acceptance Criteria

- User can submit a successful `mint_range` transaction.
- UI shows success state.

---

## 29.9 Issue: Implement Portfolio Read

### Description

Display the user’s active range positions.

### Tasks

- [ ] Investigate PredictManager range position read path.
- [ ] Implement `getPortfolio`.
- [ ] Implement `getRangePositions`.
- [ ] Create PositionCard component.
- [ ] Add fallback event-based display if direct read is unavailable.

### Acceptance Criteria

- Minted position appears in portfolio.
- Portfolio displays range, expiry, quantity, and status.

---

## 29.10 Issue: Add Error Translation Layer

### Description

Map protocol errors and validation failures to user-friendly product messages.

### Tasks

- [ ] Define `RangePilotError`.
- [ ] Implement `translateSuiError`.
- [ ] Add common validation errors.
- [ ] Add transaction failure display.

### Acceptance Criteria

- Failed transactions do not show raw unreadable errors only.
- User gets a next-step suggestion.

---

## 29.11 Issue: Write Spike README

### Description

Document how to run and test the protocol integration spike.

### Tasks

- [ ] Add setup instructions.
- [ ] Add required wallet and quote asset notes.
- [ ] Add config instructions.
- [ ] Add demo flow.
- [ ] Add known limitations.

### Acceptance Criteria

- Another developer can reproduce the spike flow locally.

---

## 30. Spike Completion Summary Template

When the spike is finished, summarize it with this template.

```text
## Protocol Integration Spike Result

### Working
- Wallet connection:
- PredictManager create/load:
- Deposit quote:
- Market loading:
- Quote preview:
- Mint range:
- Portfolio read:

### Not Working Yet
-

### Workarounds Used
-

### Contract / API Assumptions Confirmed
-

### Contract / API Assumptions Still Unclear
-

### Next Recommended Work
-
```

