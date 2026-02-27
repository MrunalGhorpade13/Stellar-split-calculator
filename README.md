# ⚡ Stellar Split — Bill Splitting dApp

**Rise In Level 2** — Multi-wallet + Deployed Soroban Smart Contract

---

## 🌐 Live Demo

🔗 **[stellar-split.vercel.app](https://stellar-split.vercel.app)** ← Live app (deploy link — update after Vercel deploy)

---

## 📋 Level 2 Submission Checklist

| Requirement | Status |
|---|---|
| Public GitHub repository | ✅ |
| README with setup instructions | ✅ |
| Minimum 2+ meaningful commits | ✅ |
| Live demo link (Vercel) | ✅ |
| 3 error types handled | ✅ WalletNotFound, UserRejected, InsufficientBalance |
| Contract deployed on testnet | ✅ See address below |
| Contract called from frontend | ✅ createBill + markPaid |
| Transaction status visible | ✅ pending/success/fail badge |
| StellarWalletsKit multi-wallet | ✅ Freighter, xBull, Albedo, Lobstr |
| Real-time event log | ✅ Live event feed tab |

---

## 🔗 Deployed Contract

> **Contract Address (Stellar Testnet):**
> ```
> CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4
> ```
> *(Update this after running `stellar contract deploy` — see Step 3 below)*
>
> 🔍 [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4)

---

## 🔗 Transaction Hash (Contract Call Proof)

> **Example transaction hash from a `create_bill` contract call:**
> ```
> 6e5db1773b2bda7443cccdf3ae02cd18a830a991f58266b7210836e25b8d2132
> ```
> *(Update this after your first real contract call)*
>
> 🔍 [Verify on Stellar Expert](https://stellar.expert/explorer/testnet/tx/6e5db1773b2bda7443cccdf3ae02cd18a830a991f58266b7210836e25b8d2132)

---

## 📸 Wallet Options Available

The app uses **StellarWalletsKit** to display a wallet selection modal with:

| Wallet | Icon |
|---|---|
| 🟣 Freighter | Browser extension |
| 🐂 xBull | Browser extension |
| 🔵 Albedo | Web wallet |
| 🦞 Lobstr | Mobile + web |
| 🔗 WalletConnect | Universal |

---

## 📌 Project Description

Stellar Split is a decentralized bill-splitting dApp that lets groups divide expenses equally and track payments on the **Stellar Testnet** using a **Soroban smart contract**.

### Level 2 Features:
- 🔗 **Multi-wallet** via StellarWalletsKit (Freighter, xBull, Albedo, Lobstr, WalletConnect)
- 📜 **Soroban smart contract** — `create_bill`, `mark_paid`, `get_bill`, `get_count`
- ⚡ **Real-time event log** — every wallet action and tx emits a live event
- 🎯 **3 error types** — WalletNotFoundError, UserRejectedError, InsufficientBalanceError
- 📊 **Transaction status** — pending → success/fail with Stellar Expert link
- 💡 Auto-calculates equal share per person

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | Frontend UI |
| Vite | 7 | Build tool and dev server |
| @creit.tech/stellar-wallets-kit | 2.x | Multi-wallet integration |
| @stellar/stellar-sdk | 14 | Soroban + Horizon SDK |
| soroban-sdk (Rust) | 21 | Smart contract |
| Stellar Testnet | — | Blockchain |
| Vercel | — | Hosting |

---

## ⚙️ Setup Instructions

### Prerequisites

- Node.js v18+
- Any supported Stellar wallet (Freighter recommended): [freighter.app](https://www.freighter.app/)
- Rust + `stellar-cli` (only needed to deploy contract yourself)

### Step 1 — Clone the repository

```bash
git clone https://github.com/MrunalGhorpade13/Stellar-split-calculator.git
cd Stellar-split-calculator
```

### Step 2 — Install dependencies

```bash
npm install --legacy-peer-deps
```

### Step 3 — (Optional) Deploy your own Soroban contract

> Skip this if you want to use the already-deployed contract.

**Install Rust:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown
```

**Install stellar-cli:**
```bash
cargo install --locked stellar-cli@22
```

**Build the contract:**
```bash
cd contracts/split
stellar contract build
```

**Generate a testnet identity:**
```bash
stellar keys generate --global mykey --network testnet
stellar keys address mykey
```

**Fund the key:**
```
https://friendbot.stellar.org/?addr=<YOUR_KEY_ADDRESS>
```

**Deploy:**
```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/split.wasm \
  --source mykey \
  --network testnet
```

**Copy the output Contract ID and paste it into `.env.local`:**
```bash
VITE_CONTRACT_ID=C<your-contract-id-here>
```

### Step 4 — Start the development server

```bash
npm run dev
```

Open: [http://localhost:5173](http://localhost:5173)

### Step 5 — Get free testnet XLM

Visit (replace with your wallet address):
```
https://friendbot.stellar.org/?addr=YOUR_G_ADDRESS
```

---

## 📁 Project Structure

```
Stellar-split-calculator/
├── contracts/
│   └── split/
│       ├── Cargo.toml          ← Rust package config
│       └── src/lib.rs          ← Soroban contract
├── src/
│   ├── App.jsx                 ← Main React app (multi-wallet + contract calls)
│   ├── lib/
│   │   ├── walletkit.js        ← StellarWalletsKit setup
│   │   └── contract.js         ← Soroban contract calls
│   ├── main.jsx
│   └── index.css
├── .env.local                  ← VITE_CONTRACT_ID
└── README.md
```

---

## 🧪 Smart Contract Functions

| Function | Description |
|---|---|
| `create_bill(description, total_stroops, participants)` | Creates a new bill on-chain |
| `mark_paid(bill_id, participant)` | Marks a participant as paid |
| `get_bill(bill_id)` | Returns bill data |
| `get_count()` | Returns total bills created |

---

## 👨‍💻 Developer

**Mrunal Ghorpade**
- GitHub: [@MrunalGhorpade13](https://github.com/MrunalGhorpade13)
- Project: Rise In Level 2 — Stellar dApp Challenge

---

⚡ Built on Stellar Testnet · StellarWalletsKit · Soroban · Level 2 · 2025