# 📋 DealMesh — Version & Workflow Gap Analysis

**Current Version:** `v1.0.0-rc1` (Release Candidate)  
**Specification:** Master Build Specification ([workflow.md](file:///c:/Users/Ravindranadh/Desktop/Dealmesh/workflow.md))  
**Protocol Standard:** DMCP 1.0 (Decentralized Merchant-Consumer Protocol)  
**Payment Engine:** Razorpay Test Mode & Bounded Recovery  
**Repository:** [spidy52/DealMesh](https://github.com/spidy52/DealMesh)

---

## 🎯 Purpose of this Document

This document is a **strict workflow audit and engineering gap analysis** comparing the live DealMesh codebase against the authoritative requirements in `workflow.md` (Sections 0 through 89 and the Critical Architecture Correction).

Rather than cataloging previous cosmetic or asset updates, this document focuses entirely on:
1. **Critical workflow gaps** that must be resolved to meet 100% specification compliance.
2. **Race conditions, multi-agent competition, and edge cases** (e.g., low-stock collisions, external checkout carting, payment gateway finalization).
3. **Actionable engineering tasks** required for production readiness.

---

## 🚨 Critical Workflow Gaps & Required Fixes

### 1. ⚡ Low Stock & Scarcity-Aware Multi-Buyer Collision (`workflow.md` §28 & §29)

> *"Buyer-to-buyer competition ONLY activates when inventory is scarce (Inventory ≤ 2). If two buyers are negotiating for the same product at the same place at the same time, the merchant agent must handle atomic deal locking without leaking private information."*

```text
               [ INVENTORY = 1 ]
                      │
        ┌─────────────┴─────────────┐
        │                           │
  [ Buyer Agent A ]           [ Buyer Agent B ]
  Offer: ₹2,350               Offer: ₹2,400
        │                           │
        └─────────────┬─────────────┘
                      ▼
             [ Merchant TitanBot ]
  Holds tighter margin (Scarcity Concession)
  Buyer B offer exceeds Buyer A
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
[ Buyer B Wins Lock ]       [ Buyer A Notified ]
• 15-min atomic reservation • "Another valid buyer has submitted
• Deal token minted           a higher authorized offer"
• Inventory decremented (0) • Zero privacy leakage of Buyer B
                            • Omni auto-pivots to 2nd best store
```

#### 🔍 Current Status vs. Required Workflow
- **Current Behavior:** The backend provides 1-on-1 negotiation via `/api/negotiations/start` and `/agent/offer`. However, when two concurrent buyer agents simultaneously submit offers for a product with `inventory = 1`, the system lacks a **distributed concurrency lock** (e.g., Redis mutex or database row-level `SELECT ... FOR UPDATE`).
- **Observed Bug:** When stock reached 0 during concurrent checkout simulations, TitanBot returned `reject_below_floor` with reason *"Item is currently out of stock"* instead of an explicit `OUT_OF_STOCK` / `SCARCITY_LOCKED` action, causing client state confusion.
- **Workflow Gaps to Fix:**
  1. **Scarcity Concession Hardening (§28):** When `inventory <= scarcity_threshold` (default: 2), TitanBot must automatically flatten its concession curve (demanding prices closer to `preferred_price` rather than `auto_negotiation_floor`).
  2. **Multi-Buyer Collision Resolution:** If Buyer A and Buyer B negotiate on the same scarce SKU concurrently:
     - Merchant must broadcast a privacy-preserving notice to the lower bidder: *"Another valid buyer has submitted a higher authorized offer."*
     - Never reveal the other buyer's identity, maximum budget, or reservation price.
  3. **Atomic Deal Locking (§29):** The first buyer to reach agreement must atomically obtain a 15-minute reservation lock (`DEAL_LOCKED`). The losing buyer's agent must immediately receive a `SCARCITY_HOLD` / `DEAL_LOST` event.
  4. **Autonomous Alternative Pivot:** Upon losing a scarce deal, Omni must automatically evaluate the next-best product from the Trust/Value Ranking list and prompt the user: *"Watch Titan Neo was locked by another buyer. Shall I secure the Citizen Eco-Drive at ₹2,499 instead?"*
  5. **Automated Lock Expiration & Inventory Release:** If Buyer A locks the deal but fails to complete payment within the 15-minute TTL, a background worker must release the reservation lock and notify Buyer B that the item is available again.

---

### 2. 🛒 Real External Website Cart Integration & Headed Checkout Flow (`workflow.md` §40, §55 & Critical Architecture §5, §18)

> *"Search snippets are NOT sufficient for price claims. Open the actual page using Playwright with controlled Chromium. The permission hierarchy must follow: READ → SEARCH → NAVIGATE → OPEN_PRODUCT → ADD_TO_CART → CHECKOUT → PAYMENT."*

```text
Discovery & Verification         External Store Action             Final Handshake
  [ Headed Playwright ]         [ External Store (Amazon) ]      [ DealMesh / Omni ]
            │                               │                             │
    1. Navigate to URL ────────────────────>│                             │
    2. Read DOM & Verify Price <────────────│                             │
    3. Select Variant (Size/Color) ────────>│                             │
    4. Click "Add to Cart" ────────────────>│                             │
    5. Proceed to Checkout ────────────────>│                             │
    6. Encounter Auth/CAPTCHA ─────────────>│                             │
            │                               │                             │
            └────────────── Request Human-in-Loop ───────────────────────>│
                                                                          │ (User solves OTP/MFA)
            ┌────────────── User Confirms Completion <────────────────────┤
            ▼                                                             │
    7. Final Payment Confirmation ────────────────────────────────────────┘
```

#### 🔍 Current Status vs. Required Workflow
- **Current Behavior:** `backend/app/commerce/live_web_search_provider.py` and `browser_automation.py` successfully launch headed Playwright Chromium, navigate to real store URLs (Amazon India, Flipkart, Croma, Nike), and verify live prices from DOM/Accessibility trees.
- **Workflow Gaps to Fix:**
  1. **Carting Pipeline (`ADD_TO_CART`):** The automated flow currently stops after price and stock verification. It must execute the next stage in Section 40's permission hierarchy: clicking the verified store's "Add to Cart" or "Buy Now" button.
  2. **Product Variant Disambiguation:** When an external merchant page requires variant selection (e.g. shoe size UK 9 vs 10, strap color, or storage configuration), Playwright must:
     - Detect unselected mandatory variant dropdowns/chips.
     - Have Omni ask the user: *"Nike Air Max requires a size selection. What size do you wear?"*
     - Click the matching option on the live page before proceeding to checkout.
  3. **Anti-Bot & Login Wall Human-in-the-Loop Handover:** Major retailers (Amazon/Flipkart) frequently trigger login interstitials or CAPTCHA challenges during cart addition. 
     - The automation must not crash or hang.
     - When an anti-bot challenge or login prompt is detected, Omni must pause autonomous navigation, bring the headed browser window to focus, and inform the user: *"Please enter your Amazon OTP or login credentials in the opened window."*
     - Once the user completes the challenge, Omni resumes the checkout pipeline.
  4. **Window Management & Visual Trust:** As mandated by Section 18 (*"Real Browser Windows"*), the browser must visibly highlight the active product and cart status so the user maintains full visual trust.

---

### 3. 💳 Payment Gateway Finalization, Webhook Idempotency & Passport Minting (`workflow.md` §33, §34, §35 & §50)

> *"Flow: Deal Lock → Policy Check → Risk Check → Authorization → Razorpay → Webhook Capture → Transaction Passport. When payment fails, the Recovery Agent must trigger bounded recovery."*

```text
[ Deal Locked ] ──> [ Policy Check ] ──> [ Risk Firewall ] ──> [ Razorpay Modal ]
                                                                      │
                                                     ┌────────────────┴────────────────┐
                                                     ▼                                 ▼
                                              [ Payment Success ]              [ Payment Failure ]
                                                     │                                 │
                                                     ▼                                 ▼
                                          [ Webhook: order.paid ]             [ Recovery Agent ]
                                          • Verify HMAC signature             • Check lock expiry
                                          • Idempotency key check             • Auto-renew if valid
                                          • Atomic stock decrement            • Max 3 retries
                                                     │                                 │
                                                     ▼                                 ▼
                                         [ Transaction Passport ]             [ Alt Store Pivot ]
                                         • Cryptographic SHA-256
                                         • Deal provenance & terms
```

#### 🔍 Current Status vs. Required Workflow
- **Current Behavior:** Razorpay order creation (`/api/payments/create-order`), mock checkout simulation, and HMAC-SHA256 signature verification (`/api/payments/verify`) exist and pass automated risk checks.
- **Workflow Gaps to Fix:**
  1. **Webhook Replay-Attack Prevention (Idempotency Key):** Webhooks received at `/api/webhooks/razorpay` currently verify signatures but must store processed `event_id`s in a persistent database table (`processed_webhook_events`) to guarantee idempotency during network retries.
  2. **Race Condition Between Deal Expiration and Payment Gateway:** If a buyer spends 14 minutes in the Razorpay checkout modal and the 15-minute deal lock expires seconds before payment capture, the webhook handler must invoke `/agent/renew` to atomically validate deal terms before capturing funds.
  3. **Public Transaction Passport Verification:** While `TransactionPassport` is created with a SHA-256 hash of the negotiation transcript, a public verification endpoint (`GET /api/passport/verify/{passport_id}`) is required so external parties or merchants can verify receipt authenticity without logging in.
  4. **Payment Failure Recovery Backoff:** The Recovery Agent (`backend/app/api/recovery.py`) must implement exponential backoff with jitter (1s, 2s, 4s) across its 3 bounded retry attempts.

---

### 4. ⚖️ Two-Sided Authority & Dynamic Concession Curves (`workflow.md` §10, §11, §21 & §22)

> *"Neither side reveals its private reservation price. If the merchant counters above the buyer's auto cap, the agent must pause and request explicit user approval."*

#### 🔍 Current Status vs. Required Workflow
- **Zero-Knowledge Privacy:** Verified and passing. Private floors (`absolute_floor`) and buyer caps are never transmitted across DMCP proposals.
- **Workflow Gaps to Fix:**
  1. **Non-Linear Concession Curves (Boulware vs. Conceder):** 
     - The current concession algorithm steps down linearly (`progress = round / max_rounds`).
     - `workflow.md` specifies that concession curves should reflect seller inventory decay: high stock allows early concessions (Conceder strategy), whereas aged/scarce stock holds firm until the final round (Boulware strategy).
  2. **Multi-Merchant Concurrent Reverse Auction:**
     - Currently, Omni negotiates with one merchant at a time.
     - Section 15 and Section 27 require Omni to orchestrate multi-merchant negotiations in parallel, playing competing merchant counters against each other in real-time.

---

### 5. 🐾 Persistent Desktop Companion (Omni) & Real-Time Voice Pipeline (`workflow.md` §4, §36–§39)

> *"The pet is always visible on the desktop. The pet state machine must seamlessly transition: SLEEPING → WAKING → LISTENING → UNDERSTANDING → SEARCHING → BROWSING → NEGOTIATING → COMPARING → WAITING_FOR_APPROVAL → PAYING → COMPLETED → RECOVERING."*

#### 🔍 Current Status vs. Required Workflow
- **Desktop Window:** Floating frameless Electron window with transparent background and drag-docking.
- **Workflow Gaps to Fix:**
  1. **Client-Side VAD (Voice Activity Detection) Barge-In:** 
     - When Omni is speaking TTS audio and the buyer begins talking, the client must immediately truncate audio playback locally via client-side VAD rather than waiting for cloud API latency.
  2. **Offline Speech Fallback:**
     - The desktop app currently depends on external OpenRouter API keys for STT/TTS. When internet connectivity drops or API keys are unavailable, it should fall back to local Web Speech API or an embedded lightweight on-device model.
  3. **Multi-Monitor Coordinate Clamping:**
     - When dragged near display edges or secondary monitors, the pet window must clamp coordinates to prevent rendering off-screen.

---

### 6. 🏪 Merchant Studio & TitanBot Autopilot Guardrails (`workflow.md` §41–§49)

> *"The merchant dashboard is a full application: Overview, Products, Inventory, Merchant AI, Live Negotiations, Orders, Revenue, Analytics, AI Commerce Settings."*

#### 🔍 Current Status vs. Required Workflow
- **Dashboard Features:** Product catalog, policy editing, TitanBot pause switch, and live negotiation feed are functional.
- **Workflow Gaps to Fix:**
  1. **Real-Time Merchant Intervention (Human-in-the-Loop Steerability):**
     - When viewing an active negotiation in Merchant Studio, the store manager should have an "Intervene" button to override TitanBot's next counter-offer with a custom price or personalized bundle before the round expires.
  2. **Inventory TTL Auto-Replenishment:**
     - Products locked under temporary 15-minute deals must be tracked with a background scheduler (`APScheduler` or Redis key expiration). If no payment webhook is received within 900 seconds, the reserved inventory count must be atomically incremented back.

---

## 📊 Workflow Gap Analysis Matrix

| Workflow Area | Specification Section | Current Implementation Status | What Still Needs to Be Fixed |
| :--- | :--- | :--- | :--- |
| **Scarcity Competition** | §28, §29 | Basic 1:1 stock check | Distributed mutex locking for concurrent buyers; privacy-preserving outbid alert; auto-pivot to alternatives. |
| **External Carting** | §40, §55, Crit. Arch | Real price & DOM verification | Headed Playwright `ADD_TO_CART` action; variant picker (size/color); human-in-the-loop takeover on CAPTCHA/login. |
| **Payment Gateway** | §33, §34, §35 | Order create & verify functional | Webhook idempotency table (`event_id`); deal lock expiration handling during payment; public passport verification endpoint. |
| **Concession Strategy**| §10, §21 | Linear round step-down | Non-linear Boulware/Conceder decay curves based on stock velocity; multi-merchant concurrent auction dispatch. |
| **Desktop Companion** | §36, §39 | Electron floating pet active | Real-time client-side VAD barge-in; offline speech fallback; multi-monitor boundary clamping. |
| **Merchant Studio** | §41, §45, §48 | Live feed & policy controls | Real-time human intervention in live feed; automated inventory release for abandoned deals. |

---

## 🛠️ Step-by-Step Action Plan to 100% Compliance

### Phase 1: Concurrency & Scarcity-Aware Deal Locking (Immediate Priority)
- [ ] Implement atomic inventory locking with Redis/SQL row locking in `backend/app/api/dmcp.py`.
- [ ] Add `SCARCITY_HOLD` status and broadcast outbid alert when two buyers compete for `inventory = 1`.
- [ ] Connect Omni's decision engine to automatically present alternative ranked stores upon losing a scarce deal.
- [ ] Set up background task to release expired deal locks and restore inventory.

### Phase 2: Headed Playwright Carting & Human Takeover Flow
- [ ] Extend `backend/app/commerce/browser_automation.py` to execute `ADD_TO_CART` and `CHECKOUT` clicks.
- [ ] Implement variant selector detection (sizes, colors) with voice prompt fallback.
- [ ] Add anti-bot challenge detection with automatic human-in-the-loop window focus.

### Phase 3: Payment Resilience & Public Passport Verification
- [ ] Create `ProcessedWebhookEvent` model to guarantee idempotent webhook processing.
- [ ] Add `/api/passport/verify/{passport_id}` public verification endpoint.
- [ ] Integrate deal lock renewal check inside webhook handler for payments completed near TTL expiration.

### Phase 4: Voice Pipeline & Desktop Polish
- [ ] Implement client-side Web Audio API VAD in Electron for instant barge-in cutoff.
- [ ] Add offline text/voice fallback when OpenRouter API keys are not provided.
- [ ] Enforce coordinate clamping across virtual desktop display boundaries.
