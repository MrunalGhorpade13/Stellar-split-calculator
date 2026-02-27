<div style="font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333;">

# Stellar Split: Split Bill Calculator dApp
**Rise In White Belt Level 1**

A decentralized bill-splitting application built strictly on the Stellar Testnet. This centralized application provides a seamless, entry-level demonstration of integrating with the Stellar blockchain ecosystem.

## Project Description
Stellar Split is a beginner-friendly decentralized application (dApp) that allows users to split a bill among multiple participants and send individual XLM payments concurrently on the Stellar Testnet. Built as the capstone for the Rise In White Belt Level 1 challenge, this project demonstrates core Stellar development fundamentals, including:

- Connecting and disconnecting the Freighter wallet securely.
- Fetching and displaying live XLM balances via the Horizon API.
- Structuring and submitting real XLM transactions on the Stellar Testnet.
- Handling transaction success and failure states with cryptographic hash verification.

## Important Links
| Resource | URL |
|---|---|
| **Live Application** | [stellar-split.vercel.app](https://stellar-split.vercel.app) |
| **Source Code** | [github.com/MrunalGhorpade13/Stellar-split-calculator](https://github.com/MrunalGhorpade13/Stellar-split-calculator) |
| **Transaction Proof** | [View on Stellar Expert](https://stellar.expert/explorer/testnet/tx/6e5db1773b2bda7443cccdf3ae02cd18a830a991f58266b7210836e25b8d2132) |

---

## White Belt Level 1 Requirements

| Requirement | Status |
|---|---|
| Freighter wallet setup on Testnet | Complete |
| Wallet connect functionality | Complete |
| Wallet disconnect functionality | Complete |
| Fetch XLM balance from Horizon | Complete |
| Display balance clearly in UI | Complete |
| Send XLM transaction on Testnet | Complete |
| Show success state with transaction hash | Complete |
| Show failure state with error code | Complete |
| Public GitHub repository | Complete |
| Deployed public URL | Complete |

---

## Application Features

| Feature | Description |
|---|---|
| **Wallet Management** | Connect and disconnect the Freighter wallet with a single operation. |
| **Live Ledger Sync** | Real-time XLM balances fetched directly from the Horizon Testnet API. |
| **Equal Split** | Automatically divides the total bill equally among all specified participants. |
| **Custom Split** | Allows precise, individual allocations of the bill per participant. |
| **Transaction Memos** | Attach contextual labels to all transactions (maximum 28 characters). |
| **Verification** | Direct integration with Stellar Expert to verify transaction hashes on the ledger. |

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend** | React | 18 | Component-based UI framework |
| **Build Tool** | Vite | 7 | Local development server and bundler |
| **Styling** | Tailwind CSS | v3 | Utility-first CSS framework |
| **Blockchain SDK** | `@stellar/stellar-sdk` | v12 | Transaction construction and Horizon API routing |
| **Wallet Interaction** | `@stellar/freighter-api` | v2 | Wallet connection and transaction signing workflows |
| **Network** | Stellar Horizon | Testnet | Blockchain state querying and transaction submission |
| **Infrastructure** | Vercel | N/A | Cloud hosting and continuous deployment |

---

## Setup Instructions: Local Development

### Prerequisites
1. **Node.js**: Version 18 or higher (Download from nodejs.org)
2. **Browser**: Google Chrome or compatible Chromium browser
3. **Wallet**: Freighter wallet extension installed and configured globally to **Testnet**

### Installation Steps

```bash
# 1. Clone the repository
git clone https://github.com/MrunalGhorpade13/Stellar-split-calculator.git
cd Stellar-split-calculator

# 2. Install package dependencies
npm install

# 3. Start the Vite development server
npm run dev
```

Navigate to `http://localhost:5173` in your browser.

### Funding Your Testnet Account
To execute transactions, your Testnet account must hold test XLM.
1. Open the Stellar Friendbot: `https://friendbot.stellar.org?addr=YOUR_G_ADDRESS_HERE`
2. Replace `YOUR_G_ADDRESS_HERE` with your Freighter public key.
3. You will securely receive 10,000 test XLM for development.

---

## Proof of Work

**Confirmed Testnet Transaction Hash:**  
`6e5db1773b2bda7443cccdf3ae02cd18a830a991f58266b7210836e25b8d2132`

**Network Specifications:**
- **Wallet Address:** GBEF...SNNZ
- **Network Designation:** Stellar Testnet (Test SDF Network ; September 2015)
- **Horizon API Endpoint:** `https://horizon-testnet.stellar.org`

---

**Developer:** Mrunal Ghorpade  
**GitHub:** [@MrunalGhorpade13](https://github.com/MrunalGhorpade13)  
*Built on the Stellar Testnet · Rise In White Belt Level 1*

</div>
