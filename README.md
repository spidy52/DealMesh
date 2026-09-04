# DealMesh — Autonomous AI Commerce Network

> **One AI Buyer. Every Store. Better Decisions.**  
> *Track 01: AI Growth & Agentic Commerce*

[![DMCP Protocol](https://img.shields.io/badge/Protocol-DMCP%201.0-blue.svg)](https://github.com/spidy52/DealMesh)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python%203.11-009688.svg)](https://fastapi.tiangolo.com)
[![Electron](https://img.shields.io/badge/Desktop-Electron%20%2B%20React%20%2B%20Vite-47848F.svg)](https://www.electronjs.org)
[![Payments](https://img.shields.io/badge/Payments-Razorpay%20Test%20Mode-0C2340.svg)](https://razorpay.com)
[![Security](https://img.shields.io/badge/Security-Zero--Knowledge%20Policy%20Firewall-green.svg)](https://github.com/spidy52/DealMesh)

---

## 🌟 Overview

**DealMesh** is a two-sided autonomous commerce platform where AI Buyer Agents and AI Merchant Agents discover each other, negotiate terms, resolve product variants, and settle transactions safely.

Instead of an LLM blindly purchasing products with unrestricted payment access, DealMesh introduces **DMCP (DealMesh Commerce Protocol)** and a strict **Propose-Validate-Execute** separation. AI reasoning proposes actions, while deterministic policy, risk, inventory, and escrow firewalls guarantee that private budgets are never leaked and financial authority is never exceeded.

```text
                                 DEALMESH NETWORK
                                        │
           ┌────────────────────────────┴────────────────────────────┐
           ▼                                                         ▼
     BUYER ECOSYSTEM                                         MERCHANT ECOSYSTEM
  ┌───────────────────────┐                               ┌───────────────────────┐
  │ 🐾 Omni Companion Pet │                               │ 🏪 Merchant Studio    │
  │ • Floating Electron UI│                               │ • Policy Floors       │
  │ • Real-time Voice/VAD │                               │ • Live Concession API │
  │ • Local Budget Limits │                               │ • Dynamic Inventory   │
  └──────────┬────────────┘                               └───────────┬───────────┘
             │                                                        │
             ▼                                                        ▼
      Buyer AI Agent                                           Merchant AI Agent
      (Proposes Offer)                                        (Evaluates Margins)
             │                                                        │
             └─────────────► [ DMCP 1.0 SECURE PROTOCOL ] ◄───────────┘
                                        │
                                        ▼
                      Deterministic Safety & Policy Firewall
                          (Zero-Leakage Budget & Margin)
                                        │
                                        ▼
                         Headed / Live Web Automation
                         (Dynamic Variant Disambiguation)
                                        │
                                        ▼
                          Razorpay Test Mode Settlement
                                        │
                                        ▼
                          Minted Transaction Passport
```

---

## 🚀 Key Features & Innovations

### 1. 🐾 Persistent Desktop Companion (Omni)
* **Frameless Floating Pet**: Custom transparent Electron window with real-time physics, screen docking, and click-through detection.
* **Full-Duplex Voice Pipeline**: Low-latency Silero Voice Activity Detection (VAD) with instant barge-in (assistant truncates audio when user interrupts).
* **Multi-Window Sync**: Native IPC bridge synchronizing floating pet states with the full Buyer Web Dashboard.

### 2. 🤝 DMCP (DealMesh Commerce Protocol)
* **Standardized Agent Handshake**: Discovery via `/.well-known/agent-card.json`, offer exchanges, counteroffers, and atomic deal locking.
* **Zero-Knowledge Negotiation**: Buyer maximum willingness-to-pay and merchant floor prices are private and **never transmitted over the wire**.
* **Mathematical Concession Curves**: Agents negotiate along polynomial and time-decayed concession curves rather than unpredictable LLM prompt outputs.

### 3. 🛡️ Deterministic Safety Firewalls (No Direct LLM Spending)
* **Propose-Validate-Execute Model**: LLMs can only propose structured JSON actions (`make_offer`, `counter_offer`, `accept`).
* **Policy Firewall**: Deterministically enforces user-defined daily spending caps, product match filters, and authorized merchant lists.
* **Risk Engine**: Blocks price-tampering exploits, duplicate orders, and stale/expired counteroffers.

### 4. 🌐 Real-World Live Market Crawler & Variant Resolution
* **Dynamic E-Commerce Automation**: Playwright stealth browser driver navigating real stores (Myntra, Nike, Amazon).
* **Variant Disambiguation Loop**: When shopping apparel/shoes, the crawler automatically detects missing size/color selections, prompts the user via voice or UI, and completes carting seamlessly.
* **Composite Value Scoring**: Evaluates trust, review depth, delivery window, and 30-day return policy over raw price sorting.

### 5. 💳 Razorpay Test Mode & Recovery Engine
* **HMAC-SHA256 Signature Verification**: Cryptographically validates payment capture tokens and webhooks (`order.paid`, `payment.failed`).
* **Bounded Deal Recovery**: Automatically recovers from network hiccups, expired locks, or payment failures without infinite retry loops.
* **Minted Transaction Passport**: Immutable audit timeline recording every offer, verification check, and settlement event.

---

## 📂 Architecture & Monorepo Structure

```text
DealMesh/
├── apps/
│   ├── desktop/             # Electron + React floating desktop companion
│   │   ├── electron/        # Main process, transparent overlay & native IPC
│   │   └── src/             # Companion UI, sound effects, dock physics & VAD
│   ├── buyer-web/           # Full Buyer Portal, split-screen live stream & search
│   └── merchant-web/        # Merchant Studio (KPIs, floor margins & live audit)
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI REST & WebSocket routers (DMCP, voice, pet)
│   │   ├── agents/          # Buyer, Merchant, Ranking & Recovery agents
│   │   ├── commerce/        # Live Playwright crawler & Firecrawl integration
│   │   ├── security/        # Deterministic Policy, Risk & Trust firewalls
│   │   └── database/        # Async SQLAlchemy models & mock store dataset
│   └── tests/               # Pytest automated test suite
├── .env.example             # Template for local environment configuration
├── .gitignore               # Multi-layer protection (secrets, node_modules, cache)
└── package.json             # Monorepo management scripts
```

---

## ⚡ Quick Start Guide

### Prerequisites
* **Python 3.10+**
* **Node.js 18+** & **npm**

---

### Step 1: Clone and Configure Environment

```bash
git clone https://github.com/spidy52/DealMesh.git
cd DealMesh

# Copy environment template
cp .env.example .env
```

Open `.env` and configure your API keys (all optional / test credentials supported):
```ini
# OpenRouter / LLM (Optional: fallback deterministic agents built-in)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Razorpay Test Mode Credentials
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_secret_here

# Live Web Search (Firecrawl / Playwright)
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
```

---

### Step 2: Install Dependencies & Seed Database

```bash
# 1. Install root & frontend dependencies
npm install

# 2. Install backend Python dependencies
pip install -r backend/requirements.txt

# 3. Seed demo store data (12 merchants + 100+ products)
python -m backend.app.database.seed
```

---

### Step 3: Run the Complete Full Stack

Run all services concurrently in a single command:

```bash
npm run dev:all
```

This launches:
* 🟢 **Backend API & WebSockets**: `http://localhost:8000`
* 🟣 **Buyer Web Portal**: `http://localhost:5173`
* 🟠 **Merchant Studio**: `http://localhost:5174`
* 🐾 **Electron Desktop Pet Companion**: Native Windows floating assistant

*(Alternatively, run services individually via `npm run dev:backend`, `npm run dev:buyer`, `npm run dev:merchant`, or `npm run dev:desktop`)*.

---

## 🧪 Running Automated Tests

Run backend tests verifying protocol boundaries, policy engines, and payment security:

```bash
npm run test:backend
```

```text
======================= 17 passed in 4.23s =======================
✓ test_policy_firewall_blocks_unauthorized_spend
✓ test_zero_leakage_private_reservation_prices
✓ test_dmcp_negotiation_round_concessions
✓ test_risk_engine_tamper_detection
✓ test_razorpay_hmac_signature_verification
✓ test_bounded_recovery_flow
```

---

## 🎭 5-Minute Live Demo Flow

| Step | Action | What to Observe |
|:---|:---|:---|
| **1. Voice Intent** | Speak to Omni: *"Find me Nike running shoes under ₹5,000"* | Omni animates, parses intent with local VAD, and queries the live market. |
| **2. Multi-Store Search** | System searches 12+ stores simultaneously | Displays real-time store availability with trust & value scores. |
| **3. Live Web Automation** | Select a store (e.g. Myntra) | Real headed browser launches, routes to live search, and detects product sizes. |
| **4. Variant Resolution** | Omni asks: *"Which size should I pick: 8, 9, or 10?"* | Say *"UK 9"*. Omni automatically clicks size 9 and adds to bag on-screen. |
| **5. DMCP Negotiation** | Open Split-Screen view | Watch Omni negotiate price concessions with TitanBot in structured DMCP rounds. |
| **6. Deterministic Checkout**| Complete test purchase | Policy engine validates caps $\rightarrow$ Razorpay modal opens $\rightarrow$ Transaction Passport is minted. |

---

## 🔒 Security & Privacy Commitments

1. **Zero Data Leakage**: Private buyer caps and merchant profit margins are kept strictly local.
2. **Deterministic Spending Caps**: No LLM can authorize funds without policy pass and human confirmation.
3. **Cryptographic Integrity**: All DMCP offers are versioned with cryptographic hashes and expiring TTLs.
4. **Local Hardware Privacy**: Audio activity is gated with client-side VAD, processing speech only when active.

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.
