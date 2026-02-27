# Stellar Split - Level 1

Split bills securely using the Stellar blockchain.
A single-wallet dApp integrated with Freighter for testnet transactions.

**Live Demo:** [stellar-split-level1.vercel.app](https://stellar-split-level1.vercel.app) *(placeholder)*

---

## Level 1 Features

| Feature | Description | Status |
|---|---|---|
| Wallet Integration | Authentic connection via the Freighter browser extension | Complete |
| Network Validation | Ensures the user is connected specifically to the Stellar Testnet | Complete |
| Account Balance | Retrieves and displays the user's active XLM balance | Complete |
| Bill Splitting UI | Allows users to input a total amount and divide it among participants | Complete |
| Simulated Payments | Generates simulated Stellar transaction hashes for mock payments | Complete |
| Error Handling | Displays friendly error messages for standard failure states | Complete |

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite |
| Styling | Vanilla CSS-in-JS |
| Wallet SDK | `@stellar/freighter-api` |
| Blockchain | Stellar Testnet (Horizon API) |

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- [Freighter Wallet](https://freighter.app) browser extension set to **Testnet** mode

### Running Locally
```bash
# 1. Clone the repository
git clone https://github.com/MrunalGhorpade13/Stellar-split-calculator.git
cd stellar-split-calculator/Stellar-split-calculator

# 2. Checkout the Level 1 commit (optional)
git checkout f02d301

# 3. Install dependencies
npm install

# 4. Start the Vite development server
npm run dev
```
Access the application at http://localhost:5174.

### Obtaining Testnet XLM
Visit [friendbot.stellar.org](https://friendbot.stellar.org) with your Freighter wallet address to fund your testnet account.

---

## Error Handling Scenarios

| Error Type | Trigger | System Response |
|---|---|---|
| `WalletNotFoundError` | Freighter is not installed in the browser | User prompted with an installation link |
| `NetworkError` | Wallet is set to Public network instead of Testnet | System requests user to switch networks |
| `UserRejectedError` | User cancels the wallet connection popup | Handled gracefully with a dismissal notification |

---

## Developer
Developed for the Stellar Blockchain ecosystem (Level 1 / Belt 1).
