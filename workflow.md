# DEALMESH — FINAL MASTER BUILD PROMPT

## Build a complete two-sided AI commerce network with personal Buyer Agents, Merchant Agents, multi-store discovery, negotiation, trust-aware purchasing and Razorpay payments.

---

# 0. ROLE

You are a senior full-stack engineer, AI-agent architect, product designer and security engineer.

Build **DealMesh** as a polished, fully runnable hackathon product.

Do not build a static mockup.

The important workflows must actually function end-to-end in **Demo Mode**, with Razorpay Test Mode integration where credentials are available.

The product must be designed so that Live Web Mode can be added without rewriting the core architecture.

Prioritize:

1. Reliable end-to-end functionality
2. Strong agent architecture
3. Security and authorization
4. Excellent UX
5. Hackathon demo reliability
6. Clean, maintainable code

Do not over-engineer infrastructure that is unnecessary for the MVP.

---

# 1. PRODUCT IDENTITY

## Platform

**DealMesh**

## Default AI Pet

**Omni**

Users can rename their pet during onboarding.

Examples:

```text
Omni
Mochi
Milo
Nova
Kiko
```

## Protocol

**DMCP — DealMesh Commerce Protocol**

## Payment

**Razorpay Test Mode**

## Primary positioning

**Razorpay AI Buildathon — Track 01: AI Growth & Agentic Commerce**

## Main tagline

> **DealMesh — Your AI buyer, everywhere.**

Supporting tagline:

> **One AI buyer. Every store. Better decisions.**

---

# 2. CORE IDEA

DealMesh is a **two-sided AI commerce network**.

On the buyer side, every user gets a personal AI Buyer Agent represented by a persistent desktop pet.

On the merchant side, every participating merchant gets a Merchant Agent controlled through a merchant dashboard.

These agents can communicate through DMCP.

```text
                    DEALMESH
                       │
          ┌────────────┴────────────┐
          │                         │
     BUYER PLATFORM            MERCHANT PLATFORM
          │                         │
     🐾 Personal Pet             🏪 Dashboard
          │                         │
     Buyer Agent               Merchant Agent
          │                         │
          └────────── DMCP ────────┘
                       │
                Agent Commerce
                       │
                  Policy Layer
                       │
                  Risk Firewall
                       │
                    Razorpay
```

The buyer agent can search multiple merchants simultaneously.

It can:

* compare products
* evaluate trust
* compare delivery and returns
* detect AI-native merchants
* negotiate with AI merchants
* maintain private financial limits
* operate within delegated authority
* handle scarce inventory
* ask the user only when necessary
* complete an approved purchase
* recover from bounded failures

The merchant agent can:

* expose products to AI buyers
* negotiate
* manage inventory
* operate within merchant-defined authority
* reserve products
* respond to offers
* handle scarcity
* track AI-originated revenue
* provide analytics
* maintain a merchant-side audit trail

---

# 3. THE CORE DIFFERENTIATION

Do NOT pitch DealMesh as merely:

* an AI shopping chatbot
* a voice assistant
* a browser agent
* a price comparison website
* an AI checkout
* an AI payment assistant
* a web scraper

Those are components.

The actual innovation is:

```text
MULTI-MERCHANT DISCOVERY
        +
CONCURRENT SEARCH
        +
TRUST-AWARE VALUE RANKING
        +
AI BUYER ↔ AI MERCHANT NEGOTIATION
        +
PRIVATE RESERVATION PRICES
        +
DELEGATED AUTHORITY
        +
SCARCITY-AWARE BUYER COMPETITION
        +
FINANCIAL AUTHORITY FIREWALL
        +
RAZORPAY TRANSACTION
        +
BOUNDED FAILURE RECOVERY
        +
TRANSACTION PASSPORT
```

The core statement:

> **DealMesh doesn't search one store. It searches the market.**

And:

> **It doesn't blindly choose the cheapest product. It chooses the best trustworthy deal within the user's authority.**

And:

> **When a merchant supports AI commerce, your AI negotiates with theirs.**

---

# 4. COMPLETE USER JOURNEY

A user registers.

They create their personal pet:

```text
Name: Omni
Personality: Playful
Species: Fox
```

The pet remains visible on the desktop.

The user says:

> "Omni, find me the best formal watch between ₹1,000 and ₹3,000."

The pet wakes.

The Buyer Agent:

```text
1. Understands intent
2. Creates search policy
3. Searches multiple merchants concurrently
4. Opens relevant merchant pages in browser
5. Detects AI-native merchants
6. Compares fixed-price offers
7. Negotiates with AI-native merchants
8. Evaluates trust
9. Ranks all offers
10. Presents recommendation
```

User:

> "Can you get it cheaper?"

Agent negotiates again within delegated authority.

User:

> "Buy it."

Then:

```text
Deal Lock
↓
Policy Check
↓
Risk Check
↓
Authorization
↓
Razorpay
↓
Payment
↓
Transaction Passport
```

After completion:

```text
🐾
💤
```

The pet returns to sleep.

---

# 5. BUYER AND MERCHANT ARE EQUAL FIRST-CLASS SYSTEMS

Do NOT build a buyer application and add a token merchant dashboard at the end.

Both sides must be functional.

```text
BUYER SIDE

Registration
Pet
Voice
Search
Browser
Comparison
Trust
Negotiation
Approval
Payment
Transactions


MERCHANT SIDE

Registration
Store setup
Products
Inventory
Merchant Agent
Negotiation rules
AI commerce settings
Live negotiations
Orders
Revenue
Analytics
Audit
DMCP configuration
```

---

# 6. BUYER ONBOARDING

Create:

```text
Create your AI Buyer
```

Allow:

```text
Pet name
Pet species
Pet personality
Pet appearance
```

Default:

```text
Name: Omni
```

Store:

```text
pet_id
user_id
name
species
personality
appearance
```

---

# 7. BUYER FINANCIAL POLICY

During onboarding or before the first purchase, let the user define:

```text
Target Price
Automatic Negotiation Cap
Absolute Maximum
```

Example:

```text
Target price: ₹2,000
Automatic negotiation cap: ₹2,700
Absolute maximum: ₹3,000
```

Meaning:

```text
Agent can negotiate automatically up to ₹2,700.

Agent must NEVER exceed ₹3,000.

Final purchase requires explicit user approval in MVP.
```

The user's absolute maximum is private.

---

# 8. MERCHANT ONBOARDING

Create a separate merchant registration flow.

Merchant enters:

```text
Store name
Store description
Business category
Website
Contact information
```

Then:

```text
Create your Merchant AI
```

Merchant chooses:

```text
Agent name
Agent personality
```

Example:

```text
Store:
Titan Demo Store

Agent:
TitanBot
```

---

# 9. MERCHANT AI AUTHORITY

Every merchant product can have its own pricing authority.

Example:

```text
Listed Price:
₹2,799

Preferred Price:
₹2,500

Automatic Negotiation Floor:
₹2,400

Absolute Floor:
₹2,300
```

The merchant's absolute floor is private.

The Buyer Agent NEVER receives it.

The merchant can also define:

```text
Maximum automatic discount
Human approval threshold
Negotiation enabled
Inventory reservation allowed
AI alternative suggestions
Scarcity behavior
```

Example:

```text
Maximum automatic discount:
10%

Human approval required below:
₹2,400
```

---

# 10. TWO-SIDED AUTHORITY MODEL

Both parties have delegated authority.

Buyer:

```text
Target
Auto Cap
Absolute Max
```

Merchant:

```text
Listed Price
Preferred Price
Auto Floor
Absolute Floor
```

Neither side sees the other's private reservation price.

This is a central DealMesh feature.

---

# 11. PRIVATE INFORMATION MODEL

## Buyer private

```text
target_price
auto_negotiation_cap
absolute_max
private_valuation
risk_preferences
```

## Merchant private

```text
preferred_price
auto_negotiation_floor
absolute_floor
margin
private_valuation
```

## Shared

```text
product
current_offer
current_counter
inventory
offer_expiry
public product information
authorization proof
```

Never transmit private reservation prices between agents.

---

# 12. BUYER AGENT

Implement a dedicated Buyer Agent.

Responsibilities:

```text
Intent interpretation
Search planning
Merchant discovery
Product comparison
Trust evaluation
Negotiation
Offer evaluation
Alternative discovery
Purchase recommendation
Policy-aware action planning
Failure recovery
User communication
```

The Buyer Agent should produce structured action proposals.

Example:

```json
{
  "action": "accept_offer",
  "deal_id": "deal_123",
  "price": 2450,
  "reason": "Within delegated negotiation authority"
}
```

The Buyer Agent does NOT directly execute payment.

---

# 13. MERCHANT AGENT

Implement a dedicated Merchant Agent.

Responsibilities:

```text
Product discovery
Offer handling
Counter-offers
Inventory validation
Pricing policy
Negotiation
Deal locking
Scarcity handling
Alternative recommendations
Merchant-side explanations
```

Example:

```json
{
  "action": "counter_offer",
  "product_id": "watch_001",
  "price": 2500,
  "reason": "Within merchant delegated authority"
}
```

The Merchant Agent does NOT directly modify private policy.

---

# 14. LLM RESPONSIBILITY

The LLM is responsible for:

```text
Reasoning
Intent understanding
Natural-language explanation
Product reasoning
Negotiation strategy
Alternative selection
Failure diagnosis
```

The LLM is NOT responsible for:

```text
Final authorization
Financial limit enforcement
Risk approval
Direct payment execution
Database security
Secret management
```

---

# 15. MULTI-WEBSITE CONCURRENT SEARCH

This must be a real feature.

When the user asks for a product, search multiple merchants concurrently.

Example:

```text
Searching 12 stores...

Store A       ✓
Store B       ✓
Store C       🤖 AI
Store D       ✓
Store E       🤖 AI
Store F       ✓
...
```

Use asynchronous task execution.

Requirements:

```text
bounded concurrency
per-merchant timeout
partial result streaming
retry policy
cancellation
error isolation
```

One failed merchant must NOT stop the whole search.

---

# 16. SEARCH ARCHITECTURE

Create a replaceable interface:

```text
SearchProvider
```

Possible implementations:

```text
DemoSearchProvider
WebSearchProvider
```

Demo Mode must be deterministic.

Live Web Mode may use a real search provider.

Do not hardwire the entire application to one search vendor.

---

# 17. TRADITIONAL MERCHANT MODE

Traditional merchants do not expose DMCP.

DealMesh uses the browser adapter.

Collect:

```text
Product
Price
Brand
Specifications
Rating
Review count
Seller
Delivery
Returns
Availability
```

Do NOT pretend traditional merchants can negotiate.

They remain fixed-price options.

---

# 18. AI-NATIVE MERCHANT MODE

If the merchant supports DMCP:

```text
Buyer Agent
      ↕
Merchant Agent
```

The merchant page should ALSO open visibly in the browser.

The browser is the human-visible trust surface.

DMCP is the structured agent communication layer.

Therefore:

```text
Browser
→ user sees product/store

DMCP
→ agents negotiate
```

---

# 19. MERCHANT CAPABILITY DISCOVERY

Do not let the LLM guess whether a merchant is AI-native.

Use deterministic capability discovery.

Preferred:

```text
/.well-known/dealmesh-agent
```

Fallback:

```text
/agent/capabilities
```

Example:

```json
{
  "merchant": "Titan Demo Store",
  "agent_supported": true,
  "search": true,
  "negotiation": true,
  "inventory": true,
  "offer_expiry": true
}
```

---

# 20. DMCP — DEALMESH COMMERCE PROTOCOL

Implement:

```text
GET  /.well-known/dealmesh-agent

GET  /agent/capabilities

POST /agent/search

GET  /agent/inventory

POST /agent/offer

POST /agent/counter

POST /agent/accept

POST /agent/renew

POST /agent/deal-lock
```

Offer example:

```json
{
  "product_id": "watch_001",
  "offer": 2450,
  "currency": "INR",
  "authorization": "valid",
  "expires_at": "...",
  "agent_id": "buyer_123"
}
```

Never include:

```text
buyer_absolute_max
merchant_absolute_floor
merchant_margin
private_valuation
```

---

# 21. NEGOTIATION

Example:

```text
Merchant:
₹2,799

Buyer:
₹2,300

Merchant:
₹2,600

Buyer:
₹2,450

Merchant:
₹2,500

Buyer:
ACCEPT
```

Buyer can autonomously negotiate while:

```text
offer <= buyer_auto_cap
```

Merchant can autonomously negotiate while:

```text
offer >= merchant_auto_floor
```

Neither side needs a human popup for every valid counter.

---

# 22. ABOVE-AUTHORITY OFFER

If merchant counters:

```text
₹2,750
```

while buyer auto cap is:

```text
₹2,700
```

the agent stops.

Pet wakes.

Show:

```text
The merchant offered ₹2,750.

That's above your automatic negotiation limit of ₹2,700.

Continue?
```

Buttons:

```text
[Approve ₹2,750]
[Reject]
```

Absolute maximum still cannot be exceeded.

---

# 23. TRUST ENGINE

Create a deterministic Trust Engine.

Inputs:

```text
Seller reputation
Review volume
Review quality
Rating
Return policy
Delivery reliability
Merchant history
Payment reliability
Product authenticity signals
Source reliability
Data freshness
```

Output:

```text
trust_score: 0–100
```

Also produce:

```text
trust_reasons[]
```

Example:

```text
Trust: 94/100

✓ 3,100 reviews
✓ Strong seller history
✓ 30-day returns
✓ Reliable delivery
✓ Verified merchant
```

---

# 24. DATA FRESHNESS

Every important external product fact should have:

```text
source
last_verified_at
confidence
price_verified
inventory_verified
```

The system should distinguish:

```text
verified
stale
unknown
```

Do not confidently present stale inventory or prices as current.

---

# 25. VALUE RANKING

The winner is NOT necessarily the cheapest product.

Create a Value Ranking Engine.

Consider:

```text
Price
Negotiated savings
Trust
Rating
Review quality
Product quality
Specifications
Delivery
Returns
Availability
User preferences
```

The user can choose:

```text
CHEAPEST
CHEAPEST_TRUSTED
BEST_VALUE
BEST_QUALITY
FASTEST
BEST_RETURNS
CUSTOM
```

---

# 26. EXAMPLE

Products:

```text
Store A
₹2,100
Trust 62

Store B
₹2,299
Trust 94

Store C
₹2,050
Trust 71
```

DealMesh may select Store B.

Explain:

> "Store C is cheaper, but Store B has significantly stronger seller reliability, reviews and returns."

Never hide why the recommendation won.

---

# 27. NEGOTIATION + MARKET COMPARISON

Example:

```text
Store A
₹2,399 fixed
Trust 91

Store B
₹2,799 listed
Trust 94
AI-native

Store B negotiation:

₹2,799
↓
₹2,500
↓
₹2,350
↓
₹2,299
```

Final comparison:

```text
Store A → ₹2,399
Store B → ₹2,299
```

DealMesh recommends Store B.

---

# 28. SCARCITY-AWARE COMPETITION

Buyer-to-buyer competition ONLY activates when inventory is scarce.

Example:

```text
Inventory = 1

Buyer Agent A
Buyer Agent B
```

Merchant can say:

> "Another valid buyer has submitted a higher authorized offer."

Never reveal:

```text
other buyer identity
other buyer maximum
other buyer private policy
```

If the buyer loses:

```text
Search alternatives
↓
Rank alternatives
↓
Present next-best option
```

Do NOT turn normal inventory into an auction.

---

# 29. DEAL LOCK

When both agents agree:

```text
DEAL_LOCKED
```

Create:

```json
{
  "deal_id": "deal_123",
  "product_id": "watch_001",
  "final_price": 2450,
  "currency": "INR",
  "buyer_authorization": "valid",
  "merchant_authorization": "valid",
  "inventory_reserved": true,
  "expires_at": "...",
  "status": "locked"
}
```

Before payment verify:

```text
price
inventory
authorization
merchant
product
expiry
```

---

# 30. POLICY ENGINE

Build a deterministic Policy Engine.

Buyer policy:

```json
{
  "target_price": 2000,
  "auto_negotiation_cap": 2700,
  "absolute_max": 3000,
  "final_purchase_requires_user": true,
  "allowed_categories": ["watches"],
  "allowed_merchants": ["*"]
}
```

Merchant policy:

```json
{
  "listed_price": 2799,
  "preferred_price": 2500,
  "auto_negotiation_floor": 2400,
  "absolute_floor": 2300,
  "human_approval_required_below": 2400
}
```

Merchant private fields MUST remain server-side.

---

# 31. FINANCIAL AUTHORITY FIREWALL

Every financial action must follow:

```text
LLM
 ↓
Action Proposal
 ↓
Policy Engine
 ↓
Risk Engine
 ↓
Authorization
 ↓
Payment
```

Never:

```text
LLM → Razorpay
```

The LLM must never bypass policy.

---

# 32. RISK ENGINE

Evaluate:

```text
Suspicious merchant
Unexpected price
Expired offer
Inventory mismatch
Authorization mismatch
Duplicate payment
Repeated payment
Unusual amount
Unexpected product
Deal-lock changes
```

Return:

```text
ALLOW
REVIEW
BLOCK
```

Example:

```json
{
  "decision": "BLOCK",
  "risk_score": 0.96,
  "reasons": [
    "Transaction exceeds buyer absolute maximum"
  ]
}
```

---

# 33. RAZORPAY

Use Razorpay Test Mode.

Environment:

```text
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

Flow:

```text
Deal Lock
↓
Policy
↓
Risk
↓
Authorization
↓
Razorpay Order
↓
User Approval
↓
Payment
```

Backend owns payment execution.

---

# 34. RAZORPAY WEBHOOKS

Implement:

```text
payment.authorized
payment.captured
payment.failed
order.paid
```

Requirements:

```text
signature verification
event idempotency
duplicate event protection
API verification for critical state
```

Do not assume webhook ordering.

Use a public HTTPS backend for real webhook testing.

---

# 35. PAYMENT FAILURE RECOVERY

Create a Recovery Agent.

When payment fails:

```text
PAYMENT_FAILED
↓
RECOVERING
```

Check:

```text
Offer valid?
Inventory available?
Price unchanged?
Authorization valid?
```

If valid:

```text
Retry
```

If expired:

```text
Renew
```

If renewal changes price:

```text
Renegotiate
```

If new price exceeds auto cap:

```text
Ask user
```

Maximum retries:

```text
2
```

Never retry indefinitely.

---

# 36. PERSISTENT DESKTOP PET

The pet is always visible.

Use:

```text
Electron
React
TypeScript
Framer Motion
Tailwind CSS
```

Window requirements:

```text
transparent
frameless
always-on-top
draggable
resizable
lightweight
persistent
animated
```

The pet remains visible even when the main DealMesh application is closed/minimized.

---

# 37. PET SLEEP MODE

When idle:

```text
🐾💤
```

No active task.

Requirements:

```text
LLM calls = 0
Browser actions = 0
Continuous screenshots = 0
CPU = minimal
Network = minimal
```

Animations:

```text
breathing
blinking
sleeping
stretching
yawning
looking around
```

---

# 38. PET WAKE EVENTS

Wake on:

```text
voice request
click
keyboard shortcut
merchant response
better deal
counter-offer
offer expiry
payment failure
approval request
background completion
```

After completion:

```text
COMPLETED
↓
IDLE
↓
SLEEP
```

---

# 39. PET STATE MACHINE

Implement:

```text
SLEEPING
↓
WAKING
↓
LISTENING
↓
UNDERSTANDING
↓
SEARCHING
↓
BROWSING
↓
AI_MERCHANT_DETECTED
↓
NEGOTIATING
↓
COMPARING
↓
RECOMMENDING
↓
WAITING_FOR_APPROVAL
↓
PAYING
↓
COMPLETED
↓
SLEEPING
```

Failure:

```text
PAYMENT_FAILED
↓
RECOVERING
↓
SUCCESS / USER_REQUIRED
```

Every state must have:

```text
animation
status text
WebSocket event
```

---

# 40. BROWSER CONTROL

Use:

**Playwright + controlled Chromium**

Prefer a dedicated browser profile.

Permission hierarchy:

```text
READ
↓
SEARCH
↓
NAVIGATE
↓
OPEN_PRODUCT
↓
ADD_TO_CART
↓
CHECKOUT
↓
PAYMENT
```

Do not continuously capture the user's desktop.

Prefer:

```text
DOM
Accessibility Tree
Browser events
Structured page data
```

Vision should only be used when necessary for permitted browser tasks.

---

# 41. MERCHANT DASHBOARD

The merchant dashboard is a full application.

Sections:

```text
Overview
Products
Inventory
Merchant AI
Live Negotiations
Orders
Revenue
Analytics
AI Commerce Settings
Transactions
Audit
DMCP/API
Settings
```

---

# 42. MERCHANT OVERVIEW

Show actual metrics:

```text
AI buyers
AI-originated orders
Negotiations
Successful negotiations
Revenue
Average negotiated price
Average discount
Conversion
Active offers
Inventory
```

Example UI:

```text
Titan Demo Store

AI Commerce

AI Buyers              42
Negotiations            18
Successful Deals        11
Revenue             ₹27,500
Average Discount        8.4%
Conversion               61%
```

Never hardcode fake metrics.

Calculate them from actual demo transactions.

---

# 43. MERCHANT PRODUCT MANAGEMENT

Merchant can:

```text
Create product
Edit product
Set price
Set inventory
Set delivery
Set return policy
Enable AI commerce
Enable negotiation
```

Example:

```text
Titan Formal Watch

Listed Price:
₹2,799

Inventory:
12

AI Commerce:
ON

Negotiation:
ON
```

---

# 44. MERCHANT PRICING POLICY

Merchant configures:

```text
Preferred price
Auto negotiation floor
Absolute floor
Maximum discount
Human approval threshold
```

Example:

```text
Listed: ₹2,799
Preferred: ₹2,500
Auto floor: ₹2,400
Absolute floor: ₹2,300
```

Display absolute floor to merchant as:

```text
🔒 Private
```

It must never reach Buyer Agent APIs.

---

# 45. MERCHANT AGENT CONTROL

Merchant dashboard:

```text
🤖 TitanBot

Negotiation:
ON

Maximum automatic discount:
10%

Inventory reservation:
ON

Suggest alternatives:
ON

Scarcity mode:
ON

Human approval below:
₹2,400
```

Merchant should be able to pause the agent.

```text
[Pause Merchant Agent]
```

---

# 46. LIVE MERCHANT NEGOTIATIONS

Create a live negotiation screen.

Example:

```text
LIVE AI NEGOTIATION

Buyer:
Omni

Product:
Titan Formal Watch

Listed:
₹2,799

Buyer → ₹2,300

TitanBot → ₹2,600

Buyer → ₹2,450

TitanBot → ₹2,500

✓ DEAL AGREED
```

Merchant sees:

```text
Your private floor:
🔒 ₹2,300
```

Buyer sees:

```text
Merchant floor:
🔒 HIDDEN
```

This is a major demo feature.

---

# 47. MERCHANT INVENTORY

Display:

```text
Titan Formal Watch
Inventory: 12

Low inventory:
4

Critical:
1
```

When inventory reaches 1:

```text
SCARCITY MODE ACTIVE
```

Show interested buyer agents without exposing private buyer budgets.

---

# 48. MERCHANT REVENUE ANALYTICS

Show:

```text
AI Commerce Revenue
AI Buyer Orders
Average Order Value
Average Discount
Negotiation Conversion
Negotiation Success
Revenue by Product
Revenue by AI Buyer
```

All numbers must come from the transaction database.

---

# 49. MERCHANT AUDIT

Every merchant-agent action must be logged.

Example:

```text
09:41:12
Buyer discovered

09:41:14
Product requested

09:41:16
Offer ₹2,300

09:41:17
Merchant policy evaluated

09:41:18
Counter ₹2,600

09:41:23
Buyer ₹2,450

09:41:25
Accepted ₹2,500

09:41:27
Inventory reserved
```

---

# 50. BUYER TRANSACTION PASSPORT

Create a buyer-facing Transaction Passport.

Timeline:

```text
USER INTENT
↓
SEARCH
↓
MERCHANT DISCOVERY
↓
PRODUCT DISCOVERY
↓
AI CAPABILITY VERIFIED
↓
NEGOTIATION
↓
DEAL LOCK
↓
POLICY
↓
RISK
↓
RAZORPAY
↓
PAYMENT
↓
WEBHOOK
↓
RECOVERY IF NEEDED
↓
COMPLETED
```

Show:

```text
Original:
₹2,799

Final:
₹2,299

Savings:
₹500

Buyer maximum:
🔒 HIDDEN

Merchant floor:
🔒 HIDDEN

Policy:
✓ PASSED

Risk:
✓ PASSED

Payment:
✓ SUCCESS
```

---

# 51. BROWSER + AGENT VISUALIZATION

When an AI-native merchant is being negotiated with, show both:

```text
LEFT:
Merchant webpage

RIGHT:
Agent negotiation
```

Example:

```text
┌─────────────────────┬─────────────────────┐
│ Titan Store         │ Agent Communication │
│                     │                     │
│ Watch               │ Buyer → ₹2,300     │
│ ₹2,799              │ Merchant → ₹2,600  │
│                     │ Buyer → ₹2,450     │
│                     │ Merchant → ₹2,500  │
└─────────────────────┴─────────────────────┘
```

This makes the agentic layer visually obvious.

---

# 52. DEMO MERCHANTS

Create deterministic demo merchants.

AI-native:

```text
Titan Demo Store
```

Traditional:

```text
StyleKart
WatchHub
TimeMarket
```

These are synthetic merchants for Demo Mode.

Do not depend entirely on external websites.

---

# 53. DEMO CATALOG

Create:

```text
100–300 products
```

Primary category:

```text
Watches
```

Each product:

```text
id
name
brand
category
price
currency
features
rating
review_count
seller
delivery_days
return_days
inventory
merchant_type
source
last_verified_at
```

AI merchant private data:

```text
preferred_price
auto_negotiation_floor
absolute_floor
offer_expiry
```

Private fields remain server-side.

---

# 54. DEMO MODE

The complete demo must work without external websites.

Demo Mode must support:

```text
12+ merchants
30+ matching products
traditional merchants
AI-native merchants
concurrent search
negotiation
private limits
trust ranking
scarcity
deal lock
policy
risk
Razorpay Test Mode
payment failure
recovery
transaction passport
merchant dashboard
```

Use deterministic data for the main presentation.

Live Web Mode is an extension.

---

# 55. LIVE WEB MODE

Where permitted, DealMesh can search external websites.

The system should:

```text
discover
navigate
read
verify
compare
```

Do not fabricate information.

If a merchant does not support DMCP:

```text
fixed-price comparison
```

If a merchant supports DMCP:

```text
agent negotiation
```

External websites must never be the only demo dependency.

---

# 56. REAL-TIME ARCHITECTURE

Use WebSockets.

Events:

```text
agent.started
search.started
merchant.discovered
product.found
merchant.ai_detected
browser.opened
negotiation.started
offer.created
counter.received
deal.locked
approval.required
payment.started
payment.failed
recovery.started
payment.succeeded
transaction.completed
agent.sleep
```

Pet, dashboard and main UI should consume the same event stream.

---

# 57. DATABASE

Use PostgreSQL.

Tables:

```text
users
pets
agents
buyer_policies

merchants
merchant_agents
merchant_policies

products
inventory

search_sessions
search_results

offers
negotiations
deals

transactions
payments

risk_checks
audit_events

notifications
```

Important:

### Buyer Policy

```text
id
user_id
target_price
auto_negotiation_cap
absolute_max
allowed_categories
allowed_merchants
final_purchase_requires_user
```

### Pet

```text
id
user_id
name
species
personality
appearance
```

### Merchant Policy

```text
merchant_id
product_id
preferred_price
auto_negotiation_floor
absolute_floor
maximum_discount
human_approval_threshold
```

Private merchant fields must never be returned to buyer-facing APIs.

---

# 58. REDIS

Use Redis for:

```text
active negotiations
offer expiration
locks
temporary agent state
WebSocket sessions
background jobs
rate limits
```

---

# 59. BACKEND

Use:

```text
Python
FastAPI
PostgreSQL
Redis
WebSockets
```

Suggested structure:

```text
backend/

├── api/
│   ├── auth.py
│   ├── buyer.py
│   ├── merchant.py
│   ├── search.py
│   ├── negotiations.py
│   ├── offers.py
│   ├── deals.py
│   ├── policy.py
│   ├── risk.py
│   ├── payments.py
│   ├── recovery.py
│   └── audit.py
│
├── agents/
│   ├── buyer_agent.py
│   ├── merchant_agent.py
│   ├── ranking_agent.py
│   ├── negotiation_agent.py
│   └── recovery_agent.py
│
├── commerce/
│   ├── dmcp.py
│   ├── merchant_discovery.py
│   ├── browser_adapter.py
│   └── search_provider.py
│
├── security/
│   ├── policy_engine.py
│   ├── risk_engine.py
│   └── authorization.py
│
├── payments/
│   ├── razorpay.py
│   └── webhooks.py
│
├── models/
├── database/
├── services/
└── websocket/
```

---

# 60. DESKTOP APP

Use:

```text
Electron
React
TypeScript
Tailwind
Framer Motion
```

Structure:

```text
desktop/

├── electron/
└── src/
    ├── components/
    │   ├── Pet/
    │   ├── Search/
    │   ├── Browser/
    │   ├── Comparison/
    │   ├── Negotiation/
    │   ├── Approval/
    │   ├── Passport/
    │   └── Notifications/
    │
    ├── services/
    │   ├── api.ts
    │   ├── websocket.ts
    │   └── voice.ts
    │
    ├── state/
    │   └── agentStore.ts
    │
    └── App.tsx
```

---

# 61. MERCHANT APP

Create a separate merchant web application.

Structure:

```text
merchant/

├── frontend/
│   ├── pages/
│   │   ├── Dashboard
│   │   ├── Products
│   │   ├── Inventory
│   │   ├── Agent
│   │   ├── Negotiations
│   │   ├── Orders
│   │   ├── Analytics
│   │   ├── Audit
│   │   └── Settings
│   │
│   └── components/
│
├── agent/
└── catalog/
```

---

# 62. UI DESIGN

The buyer interface should feel like:

```text
AI companion
+
premium commerce OS
```

The merchant interface should feel like:

```text
AI-powered merchant control center
```

Avoid generic chatbot UI.

Use:

```text
clean cards
clear hierarchy
live status
subtle animation
trust indicators
negotiation timeline
financial controls
audit timeline
```

---

# 63. BUYER HOME SCREEN

Example:

```text
🐾 Omni

Good afternoon.

What should I find for you?

[ 🎙️ Speak ]

[ Type your request... ]

Recent activity
────────────────

Titan Watch
₹2,299
✓ Purchased

Running Shoes
Searching...

Pet:
💤 Sleeping
```

If renamed:

```text
🐾 Mochi
```

---

# 64. SEARCH SCREEN

Show concurrent activity:

```text
Searching 12 stores...

✓ Store A
✓ Store B
🤖 Store C — AI merchant
✓ Store D
🤖 Store E — Negotiating
✓ Store F
...
```

Display:

```text
Stores checked
Products found
AI merchants
Negotiations
```

All values come from actual execution.

---

# 65. COMPARISON SCREEN

Example:

```text
Watch A
₹2,100
Trust 62

Watch B
₹2,299
Trust 94
🏆 BEST VALUE

Watch C
₹2,050
Trust 71

Watch D
₹2,400
Trust 97
```

Allow sorting:

```text
Best
Cheapest
Most Trusted
Fastest
Best Returns
```

---

# 66. APPROVAL SCREEN

Before final purchase:

```text
Ready to buy?

Titan Formal Watch

Final:
₹2,299

Original:
₹2,799

Savings:
₹500

Trust:
94/100

Inventory:
✓ Reserved

Offer:
✓ Valid

Policy:
✓ Passed

Risk:
✓ Passed

[ BUY ₹2,299 ]
[ CANCEL ]
```

Final purchase requires explicit user approval in MVP.

---

# 67. MERCHANT DASHBOARD HOME

Example:

```text
Titan Demo Store

Good afternoon.

AI Commerce Overview

AI Buyers            42
Orders               18
Revenue          ₹27,500
Negotiations         31
Conversion            61%

Active Negotiations
────────────────────

Omni
Titan Formal Watch
₹2,799 → ₹2,500
Negotiating...
```

---

# 68. MERCHANT SETTINGS

Allow:

```text
AI Commerce ON/OFF
Negotiation ON/OFF
Maximum automatic discount
Human approval threshold
Inventory reservation
Scarcity mode
Alternative product suggestions
Agent personality
```

---

# 69. ERROR HANDLING

Implement graceful failure.

### Merchant unavailable

> "That store isn't responding. I found three alternatives."

### Negotiation rejected

> "The merchant won't go below ₹2,600. I found another offer at ₹2,450."

### Offer expired

> "The offer expired, so I didn't purchase it."

### Inventory gone

> "That item sold out. I'm checking the next-best option."

### Payment failed

> "Payment failed. I'm checking whether your deal can still be recovered."

### Above cap

> "The new offer is above your automatic negotiation limit. I need your approval."

---

# 70. SECURITY REQUIREMENTS

Implement:

```text
least privilege
server-side policy enforcement
private buyer policy
private merchant policy
authorization tokens
risk checks
audit trail
idempotency
offer expiry
inventory verification
bounded retries
secret isolation
```

Never:

```text
expose buyer maximum
expose merchant floor
allow LLM direct payment
allow unlimited retries
trust expired offers
trust stale inventory
```

---

# 71. PRIVACY

Do not continuously capture the user's entire desktop.

Do not behave like surveillance software.

Use:

```text
browser DOM
accessibility tree
structured browser data
explicit browser permissions
```

Only access information required for the active task.

---

# 72. AUTHORIZATION PROOF

Every agent offer/action should include an authorization reference.

Example:

```json
{
  "agent_id": "buyer_123",
  "action": "offer",
  "authorization_id": "auth_9832",
  "policy_version": "v4",
  "price": 2450,
  "timestamp": "..."
}
```

The receiving system can validate that the action was authorized without learning the private maximum.

---

# 73. IDEMPOTENCY

All financial and deal-changing operations must be idempotent.

Especially:

```text
deal lock
order creation
payment processing
webhook processing
recovery
inventory reservation
```

Prevent duplicate purchases.

---

# 74. OBSERVABILITY

Provide structured logs for:

```text
agent actions
policy decisions
risk decisions
negotiations
browser tasks
payments
webhooks
recovery
errors
```

Never log secrets or private financial limits.

---

# 75. TESTING

Create automated tests.

### Buyer policy

```text
within cap → ALLOW
above auto cap → REVIEW
above absolute max → BLOCK
```

### Merchant policy

```text
within floor → ALLOW
below auto floor → REVIEW
below absolute floor → BLOCK
```

### Privacy

```text
buyer max never transmitted
merchant floor never transmitted
```

### Negotiation

```text
bounded
authorized
expires correctly
```

### Scarcity

```text
competition activates only when inventory <= configured threshold
```

### Payment

```text
duplicate webhook ignored
expired deal rejected
invalid authorization rejected
duplicate order prevented
```

### Recovery

```text
max retries respected
expired offer renewed
new price above cap asks user
```

---

# 76. DEMO MODE FAILURE SIMULATION

Create controlled demo buttons:

```text
Simulate Payment Failure
Simulate Offer Expiry
Simulate Inventory Loss
Simulate Merchant Timeout
Simulate Above-Cap Counter
```

These are ONLY for Demo Mode.

They should allow the judge to see graceful recovery.

---

# 77. REAL METRICS

Calculate metrics from actual system events.

Buyer:

```text
stores checked
products found
AI merchants
negotiations
successful negotiations
average savings
best deal
trust score
payment success
recovery success
```

Merchant:

```text
AI buyers
AI orders
revenue
negotiations
conversion
average discount
inventory
active deals
```

Do not hardcode fake metrics.

---

# 78. SECURITY METRIC

Track:

```text
Buyer maximum disclosures
Merchant floor disclosures
Unauthorized actions blocked
Expired offers blocked
Duplicate payments prevented
```

If verified:

```text
Private reservation prices disclosed:
0
```

---

# 79. DEMO STORY

Create a polished five-minute demo.

## 0:00

Show desktop.

Pet is sleeping.

User:

> "Omni, find me the best formal watch between ₹1,000 and ₹3,000."

Pet wakes.

---

## 0:30

Search 12 merchants concurrently.

Show browser activity.

```text
12 stores
31 products
4 AI merchants
```

Use actual Demo Mode metrics.

---

## 1:15

Open Titan Demo Store.

Show:

```text
Listed:
₹2,799
```

Live negotiation:

```text
Buyer → ₹2,300
Merchant → ₹2,600
Buyer → ₹2,450
Merchant → ₹2,500
```

Show:

```text
Buyer maximum 🔒
Merchant floor 🔒
```

---

## 2:00

Compare all merchants.

Example:

```text
Fixed price → ₹2,399
AI merchant → ₹2,500
AI merchant → ₹2,299
```

Show trust.

DealMesh explains:

> "The ₹2,299 offer is the best overall deal because it combines the lowest verified price with a 94/100 trust score."

---

## 2:30

User:

> "Can you get it cheaper?"

Agent negotiates.

If within authority, no popup.

If above authority, ask the user.

---

## 3:00

User:

> "Buy it."

Show:

```text
Deal locked
✓ Policy
✓ Risk
✓ Inventory
✓ Authorization
```

Execute Razorpay Test Mode.

---

## 3:30

Simulate payment failure.

Pet wakes.

> "Payment failed. I'm checking whether the deal can still be recovered."

Recovery executes.

---

## 4:15

Show merchant dashboard.

Merchant sees:

```text
AI buyer
Negotiation
Final price
Revenue
Inventory
Agent audit
```

This demonstrates the two-sided network.

---

## 4:40

Show Transaction Passport.

```text
Intent
↓
Discovery
↓
Comparison
↓
Negotiation
↓
Deal Lock
↓
Policy
↓
Risk
↓
Razorpay
↓
Recovery
↓
Success
```

---

## 5:00

Pet returns to sleep.

Final statement:

> **"DealMesh isn't an AI that shops for you. It's an AI buyer that represents you across the market—and an AI merchant can represent the seller on the other side. They negotiate within private authority, and Razorpay safely turns the agreement into a transaction."**

---

# 80. FINAL ARCHITECTURE PRINCIPLE

The system must enforce this separation:

```text
🐾 PET
= user interface

🧠 BUYER AGENT
= buyer reasoning

🤖 MERCHANT AGENT
= merchant reasoning

🌐 BROWSER
= web interaction

🔗 DMCP
= agent communication

🔎 SEARCH ENGINE
= merchant/product discovery

🛡️ TRUST ENGINE
= merchant/product evaluation

💰 VALUE ENGINE
= purchasing decision

🔐 POLICY ENGINE
= authority

🛡️ RISK ENGINE
= transaction protection

💳 RAZORPAY
= money movement

📜 TRANSACTION PASSPORT
= accountability
```

Never mix these responsibilities.

---

# 81. PROJECT STRUCTURE

Use a monorepo:

```text
dealmesh/

├── apps/
│   ├── desktop/
│   ├── buyer-web/
│   └── merchant-web/
│
├── backend/
│
├── merchant/
│
├── shared/
│   ├── types/
│   ├── schemas/
│   └── dmcp/
│
├── database/
│
├── scripts/
│
├── tests/
│
├── docker-compose.yml
├── .env.example
├── README.md
└── package.json
```

---

# 82. ENVIRONMENT

Use:

```text
OPENAI_API_KEY=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

DATABASE_URL=
REDIS_URL=

SEARCH_API_KEY=
```

Never commit secrets.

---

# 83. DELIVERABLES

Provide:

```text
Complete source code
README
Environment example
Database migrations
Seed scripts
Demo data
Backend
Buyer interface
Desktop pet
Merchant dashboard
Merchant agent
Buyer agent
DMCP
Browser adapter
Policy engine
Risk engine
Razorpay integration
Webhook handling
Recovery
Transaction Passport
Tests
Docker configuration
API documentation
Demo instructions
```

---

# 84. BUILD ORDER

Implement in this order:

```text
PHASE 1
Database + demo catalog

PHASE 2
Merchant platform

PHASE 3
Merchant Agent

PHASE 4
DMCP

PHASE 5
Buyer Agent

PHASE 6
Multi-store search

PHASE 7
Product ranking + trust

PHASE 8
Negotiation

PHASE 9
Private authority

PHASE 10
Deal lock

PHASE 11
Policy Engine

PHASE 12
Risk Engine

PHASE 13
Razorpay

PHASE 14
Webhooks

PHASE 15
Recovery

PHASE 16
Buyer UI

PHASE 17
Browser adapter

PHASE 18
Persistent desktop pet

PHASE 19
Voice

PHASE 20
Scarcity

PHASE 21
Transaction Passport

PHASE 22
Analytics

PHASE 23
Polish
```

Do not begin by building the pet.

First make the commerce system work.

---

# 85. MVP COMPLETION CHECKLIST

The MVP is incomplete unless these work:

```text
[ ] Buyer registration
[ ] Merchant registration
[ ] Custom pet name
[ ] Pet personality
[ ] Persistent desktop pet
[ ] Sleep mode
[ ] Wake mode
[ ] Voice input
[ ] Text input
[ ] Concurrent multi-store search
[ ] Browser adapter
[ ] Traditional merchant mode
[ ] AI-native merchant mode
[ ] Merchant capability discovery
[ ] DMCP
[ ] Buyer Agent
[ ] Merchant Agent
[ ] AI-to-AI negotiation
[ ] Buyer private maximum
[ ] Merchant private floor
[ ] Delegated buyer authority
[ ] Delegated merchant authority
[ ] Trust scoring
[ ] Value ranking
[ ] Scarcity competition
[ ] Deal locking
[ ] Buyer Policy Engine
[ ] Merchant Policy Engine
[ ] Risk Firewall
[ ] Razorpay Test Mode
[ ] Webhooks
[ ] Payment failure
[ ] Bounded recovery
[ ] Buyer Transaction Passport
[ ] Merchant Audit
[ ] Merchant Dashboard
[ ] Revenue analytics
[ ] Inventory analytics
[ ] Demo Mode
[ ] Failure simulations
[ ] Automated tests
```

---

# 86. FINAL PRODUCT DEFINITION

The final product should feel like:

> **A personal AI representative for commerce.**

The user gives their agent an objective.

The agent searches the market.

It compares multiple merchants simultaneously.

It distinguishes traditional stores from AI-native merchants.

It negotiates when negotiation is supported.

It protects the user's private financial authority.

It evaluates trust rather than blindly choosing the cheapest price.

The merchant has its own AI representative with its own private authority.

Both agents communicate through DMCP.

Neither side reveals its private reservation price.

The transaction passes through deterministic policy and risk controls.

Razorpay handles the payment.

The entire transaction becomes auditable.

And the user's pet remains quietly on their desktop when nothing needs attention.

---

# 87. THE ONE-SENTENCE PITCH

Use this as the canonical pitch:

> **DealMesh is a two-sided AI commerce network where personal Buyer Agents search and compare the market, negotiate with Merchant Agents within private delegated authority, choose the best trustworthy deal, and safely complete approved purchases through Razorpay.**

---

# 88. THE CORE DEMO MOMENT

The most important moment of the demo should be:

```text
                🐾 BUYER AGENT
                     │
              searches 12 stores
                     │
          ┌──────────┼──────────┐
          ↓          ↓          ↓
       Store A    Store B     Store C
       Fixed      AI Agent    Fixed
                    │
                    ↕
               NEGOTIATION
                    │
              ₹2,799 → ₹2,299
                    │
                    ▼
              TRUST + VALUE
                    │
                    ▼
                 BUY
                    │
                    ▼
             POLICY FIREWALL
                    │
                    ▼
                 RAZORPAY
                    │
                    ▼
              TRANSACTION
                 PASSPORT
```

At the same time, the merchant dashboard shows:

```text
🏪 Titan Demo Store

🤖 TitanBot

Omni is negotiating...

₹2,799
↓
₹2,500

Inventory: 1

Private floor:
🔒

Deal:
ACTIVE
```

This should make the judge immediately understand:

**There are two AI agents participating in commerce—not one chatbot pretending to shop.**

---

# 89. FINAL PRODUCT PHILOSOPHY

Do not build a cute pet with commerce features.

Build a **real agentic commerce network** and use the pet as the human interface.

Do not build a price comparison website with AI.

Build an **AI buyer that reasons across the market**.

Do not build a negotiation demo where the buyer's maximum and merchant's minimum are visible.

Build **private delegated authority**.

Do not allow the LLM to control money.

Build a **financial authority firewall**.

Do not depend on live websites for the hackathon.

Build a **deterministic Demo Mode** and make Live Web Mode an extension.

Do not fabricate metrics.

Every displayed number must come from actual execution.

The final experience should communicate:

> **"You don't shop anymore. You delegate the shopping decision to an AI representative you control."**

And on the other side:

> **"Merchants don't just publish products anymore. They can give an AI representative bounded authority to sell."**

That is **DealMesh**.



# CRITICAL ARCHITECTURE CORRECTION — REMOVE ALL FAKE SHOPPING DATA

The current implementation is NOT acceptable.

I found that the shopping/search functionality is generating fabricated/static results such as:

```python
"bestStore": "DealMesh Partner"

{"name": "Amazon India", "price": int(base * 1.05)}

{"name": "Flipkart Deals", "price": int(base * 1.07)}
```

This must be completely removed.

These are NOT real search results.

Do not generate prices by multiplying another price.

Do not create fake Amazon/Flipkart prices.

Do not create fake savings.

Do not create fake ratings.

Do not create fake availability.

Do not create fake product results.

Do not create fake URLs and label them as verified.

Do not return "DealMesh Partner" as a substitute for actual web search.

Do not use prerecorded shopping results.

Do not use static products to answer a user's shopping query.

Do not make the UI LOOK like it searched the web when it did not.

---

# 1. NEW NON-NEGOTIABLE REQUIREMENT

The buyer's shopping search must use **REAL LIVE WEB DATA**.

When the user says:

> "Find me the best formal watch between ₹1,000 and ₹3,000."

the system must actually perform a web search and/or browser navigation.

The result must come from an actual execution of:

```text
User request
     ↓
Intent extraction
     ↓
Real web search
     ↓
Real search results
     ↓
Open real merchant pages
     ↓
Read real product information
     ↓
Verify current price
     ↓
Verify availability where possible
     ↓
Compare products
     ↓
Trust evaluation
     ↓
Recommendation
```

There must be no fabricated intermediate shopping data.

---

# 2. DEMO MODE MUST NOT BE THE DEFAULT SHOPPING MODE

Remove the current behavior where shopping automatically uses:

```text
DemoSearchProvider
synthetic products
synthetic merchants
fixed prices
pre-recorded deals
```

for normal user searches.

The default buyer experience must be:

```text
LIVE WEB MODE
```

If live web access is unavailable, the application must clearly tell the user:

> "Live web search is currently unavailable."

It must NOT silently fall back to fake data.

---

# 3. NO SILENT FALLBACK

This is extremely important.

NEVER do:

```text
Live search failed
       ↓
generate fake products
```

NEVER do:

```text
Amazon unavailable
       ↓
invent Amazon price
```

NEVER do:

```text
search API failed
       ↓
return demo catalog
```

Instead:

```text
Live search
     ↓
success → continue
     ↓
failure
     ↓
show failure
     ↓
retry / use another real source
```

If only 3 stores successfully respond, show 3 stores.

Do NOT pretend 12 stores responded.

---

# 4. REAL SEARCH PROVIDER

Implement a real search provider abstraction:

```text
SearchProvider
```

with a real implementation:

```text
LiveWebSearchProvider
```

The provider must execute an actual web search.

Use a configurable search API through environment variables.

Example:

```text
SEARCH_API_KEY=
SEARCH_PROVIDER=
```

Possible provider implementations can include:

```text
SerpAPI
Bing Web Search
Google Programmable Search
Brave Search
Tavily
```

Choose ONE practical provider and implement it properly.

Do not implement five fake providers.

The provider must return actual:

```text
title
url
snippet
source
```

from the real search response.

---

# 5. BROWSER VERIFICATION IS REQUIRED

Search snippets are NOT sufficient for price claims.

After discovering a candidate product, open the actual page using:

```text
Playwright
```

with a controlled Chromium instance.

Flow:

```text
Search engine
      ↓
candidate URL
      ↓
Playwright
      ↓
open page
      ↓
read DOM
      ↓
extract product information
      ↓
verify
```

Use:

```text
DOM
Accessibility Tree
structured page data
visible text
```

where possible.

Do not continuously screenshot the user's desktop.

---

# 6. REAL PRODUCT EXTRACTION

For every successfully opened product page, extract only information that actually exists on the page.

Possible fields:

```json
{
  "title": "...",
  "price": 0,
  "currency": "INR",
  "original_price": null,
  "discount": null,
  "brand": null,
  "rating": null,
  "review_count": null,
  "seller": null,
  "availability": null,
  "delivery": null,
  "returns": null,
  "url": "...",
  "source": "...",
  "last_verified_at": "...",
  "price_verified": true,
  "availability_verified": false,
  "data_confidence": 0.0
}
```

If a field cannot be verified:

```text
null
```

NOT:

```text
fake value
```

---

# 7. PRICE INTEGRITY

This rule is absolute.

The system may ONLY display a price if it came from:

1. the actual page DOM,
2. structured product data from the page,
3. a trusted search provider response when explicitly marked as snippet-level data.

For purchase recommendations, the price must be verified against the actual merchant page whenever possible.

Example:

```text
Search result:
₹2,499

Open product page:
₹2,699
```

Final displayed price:

```text
₹2,699
```

NOT ₹2,499.

---

# 8. CURRENT DATA

Every live product result must have:

```text
source
url
last_verified_at
price_verified
availability_verified
data_confidence
```

Example:

```text
Amazon
₹2,699

Price:
✓ Verified

Verified:
15:23:14

Availability:
✓ In stock
```

If the page cannot confirm availability:

```text
Availability:
? Unknown
```

Never claim:

```text
✓ In stock
```

without evidence.

---

# 9. REAL MULTI-STORE SEARCH

When the user asks for a product, do NOT search one website.

Search the web for multiple real merchants.

Example:

```text
User:
"best formal watch ₹1,000–₹3,000"

              ↓

        Search Engine

       ┌──────┼──────┐
       ↓      ↓      ↓

    Store A Store B Store C
       ↓      ↓      ↓
    Browser Browser Browser
       ↓      ↓      ↓
    Product Product Product
```

Use bounded asynchronous concurrency.

For example:

```text
MAX_CONCURRENT_BROWSERS = 4
```

Do not open 50 browsers simultaneously.

---

# 10. SEARCH EXECUTION EVENTS MUST BE REAL

The UI currently shows things such as:

```text
Searching 12 stores...
Store A ✓
Store B ✓
Store C 🤖
```

This is only allowed if those operations actually occurred.

For every merchant:

```text
SEARCH_STARTED
PAGE_OPENED
PAGE_READ
PRODUCT_FOUND
PRICE_VERIFIED
SEARCH_FAILED
```

must correspond to real execution.

Example:

```json
{
  "merchant": "Example Store",
  "url": "https://example.com/...",
  "status": "success",
  "products_found": 4,
  "price_verified": true,
  "timestamp": "..."
}
```

---

# 11. NEVER FABRICATE MERCHANTS

Delete any hardcoded shopping merchants such as:

```text
DealMesh Partner
StyleKart
WatchHub
TimeMarket
```

from LIVE WEB MODE.

Real merchant names must come from actual search results/pages.

If Demo Mode exists for testing the agent architecture, it must be clearly labelled:

```text
DEMO DATA
```

and must NEVER appear in the normal live shopping flow.

---

# 12. NEVER FABRICATE AMAZON / FLIPKART / OTHER PRICES

Absolutely remove code patterns such as:

```python
base * 1.05
base * 1.07
```

or:

```python
price = generated_price
```

or:

```python
original_price = ...
savings = ...
```

unless those values were extracted from a real source.

For example:

```python
amazon_price = base * 1.05
```

is FORBIDDEN.

---

# 13. NEVER FABRICATE SAVINGS

Savings must be calculated only from verified real prices.

Valid:

```text
Actual listed price: ₹2,799
Actual current price: ₹2,499

Savings = ₹300
```

Invalid:

```text
Generated base = ₹2,400
Generated original = ₹2,799
Savings = ₹399
```

---

# 14. NEVER FABRICATE TRUST

Trust scores must be calculated from actual information collected from the source.

If there isn't enough information:

```text
Trust: Insufficient data
```

Do NOT automatically give every merchant:

```text
94/100
```

---

# 15. LIVE SEARCH FAILURE

If a website blocks automation:

```text
Amazon
⚠ Unable to verify product page
```

Do NOT invent a price.

Try another legitimate source.

If the search provider fails:

```text
Live search unavailable.
Please try again.
```

Do not switch to fabricated data.

---

# 16. BROWSER ACCESS

The desktop pet must trigger the actual search system.

Architecture:

```text
                  🐾 Omni
                     │
                     ▼
              Buyer Agent
                     │
                     ▼
             Search Planner
                     │
                     ▼
          LiveWebSearchProvider
                     │
                     ▼
               Search API
                     │
                     ▼
             Real URLs
                     │
                     ▼
               Playwright
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       Browser    Browser    Browser
       Store A    Store B    Store C
          │          │          │
          └──────────┼──────────┘
                     ▼
             Product Extractor
                     │
                     ▼
              Trust + Ranking
                     │
                     ▼
                  Omni
```

---

# 17. OMNI MUST SHOW REAL ACTIVITY

When Omni searches:

```text
🐾 Omni wakes

"Searching the web..."

Amazon
Opening...

Flipkart
Opening...

Myntra
Opening...

Other result
Opening...
```

These labels must correspond to actual browser/search tasks.

If a task fails:

```text
Amazon
⚠ Could not verify
```

Do not show:

```text
✓
```

unless successful.

---

# 18. REAL BROWSER WINDOWS

When the user requests a search, Playwright should actually launch/use a controlled Chromium browser.

The user should be able to see the relevant merchant pages being opened.

For AI-native merchants:

```text
Browser page
+
DMCP agent communication
```

Both should actually exist.

Do not fake browser activity using an animation.

The animation should reflect actual browser events.

---

# 19. DO NOT CONFUSE UI SIMULATION WITH EXECUTION

This is a critical rule.

The following are NOT valid implementations:

```text
fake loading animation
fake "Searching..."
fake store cards
fake browser activity
fake negotiation timeline
fake prices
fake merchant responses
```

The UI is a VIEW of the underlying system.

It must never be the system itself.

Correct:

```text
Real execution
     ↓
Real event
     ↓
UI update
```

Incorrect:

```text
UI animation
     ↓
pretend execution happened
```

---

# 20. DEMO DATA IS ALLOWED ONLY IN EXPLICIT TEST MODE

You may keep a synthetic environment for testing:

```text
TEST / SANDBOX MODE
```

But make the mode visually and technically explicit.

Example:

```text
MODE: LIVE WEB
```

or:

```text
MODE: TEST SANDBOX
```

Never mix them.

The user must know which mode is running.

---

# 21. REMOVE THE CURRENT FAKE IMPLEMENTATION

Search the entire repository for:

```text
DealMesh Partner
Amazon India
Flipkart Deals
base * 1.05
base * 1.07
DemoSearchProvider
fake
mock
static products
hardcoded prices
hardcoded deals
```

Identify every place where fake shopping results are generated.

Remove them from the LIVE WEB execution path.

Do not merely hide them in the UI.

---

# 22. ADD A SOURCE-OF-TRUTH PIPELINE

Every product must carry provenance.

Example:

```typescript
interface LiveProduct {
    title: string;
    url: string;
    merchant: string;

    price: number | null;
    originalPrice: number | null;

    rating: number | null;
    reviewCount: number | null;

    availability: string | null;

    source: string;

    discoveredAt: string;
    lastVerifiedAt: string | null;

    priceVerified: boolean;
    availabilityVerified: boolean;

    dataConfidence: number;
}
```

A product cannot enter the final recommendation list unless it has a valid source URL.

---

# 23. RECOMMENDATION RULE

The recommendation engine must operate on:

```text
REAL PRODUCTS ONLY
```

It should rank based on:

```text
verified price
trust
rating
review quality
delivery
returns
availability
product match
user preferences
```

If there are only two verified products, recommend among two.

Do NOT manufacture eight additional products just to make the UI look full.

---

# 24. USER EXPERIENCE

User:

> "Find me the best formal watch between ₹1,000 and ₹3,000."

Omni:

> "Searching the web."

Then actual execution begins.

After results:

> "I checked 6 stores and verified 14 products."

That statement is allowed ONLY if:

```text
6 real stores were actually accessed
14 real products were actually extracted
```

Then:

> "Best verified option: ₹2,399."

The URL must point to the actual product page.

---

# 25. IF NO PRODUCT CAN BE VERIFIED

Say:

> "I found several possible matches, but I couldn't reliably verify their current prices. I won't recommend a purchase until I can verify one."

This is MUCH better than fake information.

---

# 26. IMPORTANT: DO NOT LOWER THE QUALITY BAR TO MAKE THE DEMO WORK

If live search is difficult because:

* CAPTCHA
* robots restrictions
* dynamic pages
* login requirements
* anti-bot protection
* search API failure

do not replace the missing data with fake data.

Instead implement:

```text
retry
alternate real source
clear failure state
partial results
```

---

# 27. IMPLEMENTATION PRIORITY

Do this BEFORE polishing the shopping UI:

### STEP 1

Remove fabricated shopping result generation.

### STEP 2

Implement:

```text
LiveWebSearchProvider
```

### STEP 3

Implement real search API integration.

### STEP 4

Implement Playwright browser verification.

### STEP 5

Implement real product extraction.

### STEP 6

Implement provenance/freshness.

### STEP 7

Connect results to the existing ranking engine.

### STEP 8

Connect real events to Omni.

### STEP 9

Only then polish the search UI.

---

# 28. IMPORTANT EXISTING ARCHITECTURE

Keep the existing conceptual architecture:

```text
PET
=
user interface

BUYER AGENT
=
reasoning

BROWSER
=
web interaction

SEARCH ENGINE
=
discovery

TRUST ENGINE
=
evaluation

VALUE ENGINE
=
decision

POLICY ENGINE
=
authority

RISK ENGINE
=
transaction protection

RAZORPAY
=
money movement
```

But enforce that:

> **SEARCH ENGINE and BROWSER must perform real operations in LIVE WEB MODE.**

The current architecture already distinguishes the browser/search responsibilities.

---

# 29. CRITICAL RULE FOR ALL FUTURE DEVELOPMENT

From this point onward:

> **NEVER create fake shopping results to make a feature appear functional.**

If a feature cannot actually execute, mark it:

```text
NOT IMPLEMENTED
```

or:

```text
UNAVAILABLE
```

or:

```text
REQUIRES CONFIGURATION
```

but NEVER fabricate its output.

---

# 30. FINAL ACCEPTANCE TEST

Run the application.

Ask Omni:

> "Find me the best formal watch between ₹1,000 and ₹3,000."

I should be able to observe:

```text
Omni wakes
     ↓
real search request
     ↓
real search results
     ↓
real URLs
     ↓
real browser pages
     ↓
real product extraction
     ↓
real prices
     ↓
real verification
     ↓
real comparison
     ↓
real recommendation
```

Then click the recommended product.

The browser must open the EXACT real product URL from which the displayed information was obtained.

If the displayed price is ₹2,399, that ₹2,399 must be traceable to the real source.

If the source says ₹2,699, the system must show ₹2,699.

There must be no:

```text
fake price
fake store
fake product
fake discount
fake rating
fake availability
fake browser activity
fake verification
```

---

# FINAL PRINCIPLE

**The UI must never simulate an action that the backend did not actually perform.**

The system should be able to honestly answer:

> "Where did you get this price?"

with:

```text
Merchant
↓
Actual product URL
↓
Actual page
↓
Actual extracted price
↓
Timestamp
```

That is the standard required for DealMesh LIVE WEB MODE.


final flow of project 
                         USER
                          │
                          ▼
                 Voice / Text Request
                          │
                          ▼
                    DESKTOP PET
                          │
                          ▼
                    BUYER AGENT
                          │
                          ▼
                   Parse User Intent
                          │
                          ▼
                 Create Buyer Policy
                          │
                          ▼
              ┌───────────────────────┐
              │   REAL WEB SEARCH     │
              │   Multiple Merchants  │
              └───────────┬───────────┘
                          │
                          ▼
                  Candidate Products
                          │
          ┌───────────────┼────────────────┐
          ▼               ▼                ▼
       Price            Trust           Delivery
          │               │                │
          └───────────────┼────────────────┘
                          ▼
                    Value Ranking
                          │
                          ▼
                Verify Best Candidates
                          │
                          ▼
              Merchant Capability Check
                          │
                 ┌────────┴────────┐
                 ▼                 ▼
          Traditional          AI-Native
           Merchant             Merchant
                 │                 │
                 │                DMCP
                 │                 │
                 │                 ▼
                 │          Merchant Agent
                 │                 │
                 │                 ▼
                 │            Negotiate
                 │                 │
                 │        ┌────────┴────────┐
                 │        ▼                 ▼
                 │    Acceptable        Not Acceptable
                 │        │                 │
                 │        │             Counter-offer
                 │        │                 │
                 │        │◄────────────────┘
                 │        │
                 └────────┴───────────────┐
                                          ▼
                                    Deal Lock
                                          │
                                          ▼
                                Buyer Policy Check
                                          │
                              ┌───────────┴───────────┐
                              ▼                       ▼
                         Within Limit          Above Authority
                              │                       │
                              ▼                       ▼
                         Risk Engine              Ask User
                              │                       │
                       ┌──────┴──────┐                │
                       ▼             ▼                │
                     PASS          FAIL               │
                       │             │                │
                       │             ▼                │
                       │        Recovery Engine       │
                       │             │                │
                       │        Retry / Renew /       │
                       │        Renegotiate           │
                       │             │                │
                       └─────────────┴────────────────┘
                                     │
                                     ▼
                              Razorpay Order
                                     │
                                     ▼
                              User Payment
                                     │
                                     ▼
                              Razorpay Payment
                                     │
                                     ▼
                                Webhook
                                     │
                                     ▼
                           Verify Payment Event
                                     │
                          ┌──────────┴──────────┐
                          ▼                     ▼
                       SUCCESS                FAILURE
                          │                     │
                          ▼                     ▼
                   Transaction           Recovery /
                     Passport             Re-negotiate
                          │                     │
                          └──────────┬──────────┘
                                     ▼
                              Purchase Complete
                                     │
                                     ▼
                              🐾 PET WAKES
                                     │
                                     ▼
                         "Deal completed at ₹X"
                                     │
                                     ▼
                                  💤 SLEEP