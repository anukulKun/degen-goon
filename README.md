# DEGEN GOON 🦍

<p align="center">
  <img src="https://raw.githubusercontent.com/anukulKun/degen-goon/main/public/image.png" alt="DEGEN GOON" width="200"/>
</p>

> A paid, callable AI agent on CROO that roasts any Ethereum wallet with zero chill — send a wallet address, get back a brutal JSON roast with degen score, title, NGMI verdict, and advice.

---

## Hackathon

Submitted to the **CROO Agent Hackathon** on **DoraHacks** across two tracks:

| Track | Why |
|---|---|
| **Creator & Content Ops Agents** | DEGEN GOON is a content agent — it takes a wallet address and produces a creative, personality-driven roast on demand. |
| **Open A2A Agents** | Full CROO Agent Protocol (CAP) integration — negotiate, pay, deliver, and settle entirely on-chain via USDC on Base. Any agent can call DEGEN GOON as a dependency. |

---

## What It Does

1. A buyer (human or agent) submits an Ethereum wallet address.
2. DEGEN GOON feeds it to **Groq's LLM** with a degen personality prompt.
3. The LLM returns a structured JSON roast:

```json
{
  "roast": "Your portfolio is so rekt it made LUNA look stable.",
  "degenScore": 17,
  "degenTitle": "Lurking Lxmer",
  "ngmiVerdict": "NGMI — check your bags, ser.",
  "advice": "Stop lurking, start staking. Touch some grass, then touch some DeFi."
}
```

4. The result is delivered on-chain via CAP and the buyer gets it through `getDelivery()`.

No API keys exposed to buyers. No centralized payment rails. Pure A2A commerce.

---

## Live on CROO Agent Store

DEGEN GOON is listed on the [CROO Agent Store](https://agent.croo.network).

| Field | Value |
|---|---|
| Agent Name | DEGEN GOON |
| Service ID | `fc956a4b-ad98-44b2-a206-381e973d5af3` |
| Network | Base mainnet |
| Price | 0.50 USDC |
| SLA | 0h 10m |
| Deliverable Type | Schema (structured JSON) |

### How to Call via CAP

Any agent with a CROO SDK key can call DEGEN GOON:

```typescript
const client = new AgentClient({ baseURL, wsURL }, requesterSdkKey);

// 1. Negotiate — send the wallet address to roast
const neg = await client.negotiateOrder({
  serviceId: "fc956a4b-ad98-44b2-a206-381e973d5af3",
  requirements: JSON.stringify({
    type: "text",
    value: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  }),
});

// 2. Wait for OrderCreated → pay
await client.payOrder(orderId);

// 3. Wait for OrderCompleted → read the roast
const delivery = await client.getDelivery(orderId);
const roast = JSON.parse(delivery.deliverableSchema);
```

---

## Tech Stack

| Layer | Tech |
|---|---|
| AI / Roast Engine | Groq API |
| Agent Commerce | `@croo-network/sdk` — CAP (CROO Agent Protocol) |
| Runtime | Node.js 18+ / TypeScript |
| HTTP Server | Express (port 3000) |
| Settlement | USDC on Base mainnet via CAPVault escrow |
| Identity | CROO Agent DID + AA Wallet (auto-created on registration) |
| Deployment | Railway (Nixpacks) |

---

## CAP Integration — Full Order Lifecycle

```
Requester (buyer)                     DEGEN GOON (provider)
      │                                          │
      ├─ negotiateOrder({ serviceId, input }) ──►│
      │                                          ├─ [ws event: NegotiationCreated]
      │                                          ├─ acceptNegotiation(negotiationId)
      │◄── [ws event: OrderCreated] ─────────────┤
      ├─ payOrder(orderId)                       │
      │   (USDC locked in CAPVault escrow)       │
      │                                          │◄── [ws event: OrderPaid]
      │                                          ├─ GET /order → requesterWalletAddress
      │                                          ├─ Groq API → roastWallet(address)
      │                                          ├─ deliverOrder(orderId, { result })
      │◄── [ws event: OrderCompleted] ───────────┤
      ├─ getDelivery(orderId)                    │
      │   → { roast, degenScore, ... }           ├─ USDC settlement received ✓
      ▼                                          ▼
```

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    CROO Network                        │
│  ┌────────────┐    CAP API + WS     ┌──────────────┐ │
│  │  Requester  │◄──────────────────►│ DEGEN GOON   │ │
│  │  (any agent)│                    │ Provider     │ │
│  └──────┬──────┘                    └──────┬───────┘ │
│         │                                  │          │
│         │         ┌──────────────┐          │          │
│         │         │  CAPVault     │         │          │
│         │◄───────►│  (Base mainnet)│◄───────►│          │
│         │         │  USDC escrow  │         │          │
│         │         └──────────────┘         │          │
└──────────────────────────────────────────────────────┘
         │                                  │
         │                                  ▼
         │                          ┌──────────────┐
         │                          │  Groq API    │
         │                          │  llama-3.3   │
         │                          │  70B         │
         │                          └──────────────┘
         ▼
  ┌──────────────┐
  │  Roast JSON  │
  │  result      │
  └──────────────┘
```

---

## How to Run Locally

### Prerequisites

- Node.js >= 18
- npm
- A Groq API key (free at https://console.groq.com)
- A CROO SDK key (from https://agent.croo.network dashboard)

### Setup

```bash
git clone <repo-url>
cd degen-goon

npm install

cp .env.example .env
# Fill in GROQ_API_KEY, CROO_SDK_KEY (and CROO_SDK_KEY_REQUESTER for testing)

npm run build
npm start
```

The provider WebSocket connects and listens for incoming orders. The Express server also serves a manual roast UI at `http://localhost:3000`.

### Running the Test Requester

```bash
npx ts-node src/test-requester.ts
```

This fires a negotiation against your locally running provider using the `CROO_SDK_KEY_REQUESTER` key. The full lifecycle runs: negotiate → pay → receive roast → exit.

---

## Deploy on Render

One-click via Blueprint (or manual setup):

### Option A — Blueprint (auto)

Push to GitHub, then in Render dashboard click **New → Blueprint** and connect your repo. Render reads `render.yaml` and provisions everything automatically.

### Option B — Manual Web Service

1. In Render dashboard: **New Web Service** → connect your GitHub repo
2. Set these values:

| Field | Value |
|---|---|
| **Name** | `degen-goon` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Health Check Path** | `/api/health` |

3. Add environment variables (secrets marked 🔒):

| Variable | Value |
|---|---|
| `NODE_VERSION` | `18` |
| `GROQ_API_KEY` | 🔒 your Groq key |
| `CROO_API_URL` | `https://api.croo.network` |
| `CROO_WS_URL` | `wss://api.croo.network/ws` |
| `CROO_SDK_KEY` | 🔒 your provider SDK key |
| `PORT` | `10000` (Render sets this automatically) |

4. Deploy. Render runs `npm run build && npm start`, and the provider WebSocket connects on boot.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | Groq API key (get at https://console.groq.com) |
| `CROO_API_URL` | Yes | CROO backend API URL — `https://api.croo.network` |
| `CROO_WS_URL` | Yes | CROO WebSocket URL — `wss://api.croo.network/ws` |
| `CROO_SDK_KEY` | Yes | Provider SDK key for the DEGEN GOON agent (from dashboard) |
| `CROO_SDK_KEY_REQUESTER` | For testing | Requester SDK key used by `test-requester.ts` to simulate a buyer |
| `CROO_SERVICE_ID` | For testing | Service UUID — `fc956a4b-ad98-44b2-a206-381e973d5af3` |
| `PORT` | No (default 3000) | Express server port |

---

## Project Structure

```
degen-goon/
├── src/
│   ├── roast.ts            # Groq API call — generates { roast, degenScore, degenTitle, ngmiVerdict, advice }
│   ├── provider.ts          # CAP WebSocket listener — accept negotiations, deliver roasts
│   ├── index.ts             # Express server entry — boots HTTP + provider side-by-side
│   └── test-requester.ts    # One-shot e2e test — negotiates, pays, fetches delivery, exits
├── public/                  # Static demo UI
├── .env.example             # Template with all env vars
├── railway.json             # Railway deployment config
├── render.yaml              # Render Blueprint deployment config
├── Procfile                 # Railway / Render process definition
├── package.json
├── tsconfig.json
└── README.md
```

---

## What's Done

- [x] AI roast engine via Groq API
- [x] Structured JSON output — `roast`, `degenScore`, `degenTitle`, `ngmiVerdict`, `advice`
- [x] Hardcoded `FALLBACK_ROAST` for Groq downtime
- [x] CAP provider WebSocket listener — `provider.ts`
- [x] Accept negotiations via `acceptNegotiation()`
- [x] Process paid orders — extract wallet, call Groq, `deliverOrder()`
- [x] One-shot test requester — `test-requester.ts`
- [x] Express server with manual roast UI
- [x] Deployed on Railway (Nixpacks)
- [x] Listed on CROO Agent Store (Service ID: `fc956a4b-ad98-44b2-a206-381e973d5af3`)

---

## License

MIT — see [LICENSE](LICENSE) for details.
