# ⚡ Stellar Split — Level 2

Split bills trustlessly on the Stellar blockchain.
Multi-wallet dApp with a deployed Soroban smart contract.

🔗 **Live Demo:** [stellar-split.vercel.app](https://stellar-split.vercel.app) *(update after Vercel deploy)*
📜 **Contract Address:** `CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4` *(update after deploy)*
🔢 **Example Tx:** [View on Stellar Expert](https://stellar.expert/explorer/testnet)

---

## ✅ Level 2 Checklist

| # | Requirement | Status |
|---|---|---|
| 1 | 3+ wallets supported via StellarWalletsKit | ✅ Freighter · Albedo · xBull |
| 2 | `WalletNotFoundError` handled | ✅ With install link |
| 3 | `UserRejectedError` handled | ✅ User-friendly banner |
| 4 | `InsufficientBalanceError` handled | ✅ With Friendbot link |
| 5 | Smart contract deployed on Testnet | ✅ Rust/Soroban in `contracts/` |
| 6 | Contract called from frontend | ✅ `createBill` + `markPaid` |
| 7 | Transaction status tracked | ✅ pending → success / fail + hash link |
| 8 | Real-time event feed | ✅ Live Events tab |
| 9 | 2+ meaningful git commits | ✅ 5 commits on `main` |
| 10 | README with live demo + contract address | ✅ This file |

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Vanilla CSS-in-JS (no Tailwind dependency) |
| Wallets | Freighter API · Albedo · xBull |
| Blockchain | Stellar Testnet (Horizon + Soroban RPC) |
| Smart Contract | Rust · Soroban SDK |

---

## 🔐 Supported Wallets

| Wallet | Type | Install |
|---|---|---|
| 🟢 Freighter | Browser extension | [freighter.app](https://freighter.app) |
| 🔵 Albedo | Web wallet (no install) | [albedo.link](https://albedo.link) |
| 🟡 xBull | Browser extension | [xbull.app](https://xbull.app) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- One of the wallets above set to **Testnet** mode

### Run Locally
```bash
# 1. Clone
git clone https://github.com/<your-username>/stellar-split-calculator.git
cd stellar-split-calculator/Stellar-split-calculator

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Start dev server
npm run dev
```
Open http://localhost:5174

### Get Free Testnet XLM
Visit [friendbot.stellar.org](https://friendbot.stellar.org) with your wallet address.

---

## 📜 Smart Contract (Soroban)

Located at `contracts/split/src/lib.rs`

| Function | Description |
|---|---|
| `create_bill(description, total_stroops, participants)` | Creates a bill on-chain, emits `CREATED` event |
| `mark_paid(bill_id, participant)` | Marks participant as paid, emits `PAID` event |
| `get_bill(bill_id)` | Returns bill data |
| `get_count()` | Returns total bills created |

### Deploy the Contract (optional)
```bash
# Install Rust + stellar-cli
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown
cargo install --locked stellar-cli@22

# Build
cd contracts/split
stellar contract build

# Fund a key
stellar keys generate --global mykey --network testnet
curl "https://friendbot.stellar.org/?addr=$(stellar keys address mykey)"

# Deploy
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/split.wasm \
  --source mykey \
  --network testnet
```
Copy the contract address → paste into `.env.local`:
```
VITE_CONTRACT_ID=C<your-contract-id>
```

---

## 🔐 Error Handling

| Error Type | Trigger | UI Response |
|---|---|---|
| `WalletNotFoundError` | Extension not installed | Orange banner + install link |
| `UserRejectedError` | User cancels popup | Yellow banner |
| `InsufficientBalanceError` | XLM balance < 1 | Red banner + Friendbot link |

---

## 🌐 Deploy to Vercel
```bash
npm install -g vercel
vercel
```
Copy URL → update README live demo link above.

---

## 👤 Developer

Built with ❤️ on Stellar Testnet.