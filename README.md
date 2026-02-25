⚡ Stellar Split — Split Bill Calculator dApp

Rise In White Belt Level 1 — A decentralized bill splitting app built on the Stellar Testnet
📌 Project Description
Stellar Split is a beginner-friendly decentralized application (dApp) that allows users to split a bill among multiple participants and send individual XLM payments on the Stellar Testnet — all in one click.
Built as part of the Rise In White Belt Level 1 challenge, this project demonstrates core Stellar development fundamentals:

Connecting and disconnecting a Freighter wallet
Fetching and displaying live XLM balance from Horizon
Building and submitting real XLM transactions on Stellar Testnet
Showing transaction success/failure feedback with hash proof


🔗 Links
ItemLink🌐 Live Appstellar-split.vercel.app💻 GitHubgithub.com/MrunalGhorpade13/Stellar-split-calculator🔍 Transaction ProofView on Stellar Expert

✅ White Belt Level 1 Checklist
RequirementStatusFreighter wallet setup on Testnet✅ CompleteWallet connect functionality✅ CompleteWallet disconnect functionality✅ CompleteFetch XLM balance from Horizon✅ CompleteDisplay balance clearly in UI✅ CompleteSend XLM transaction on Testnet✅ CompleteShow success state + transaction hash✅ CompleteShow failure state + error code✅ CompletePublic GitHub repository✅ CompleteDeployed public URL✅ Complete

📸 Screenshots
1. Wallet Connected + Balance Displayed + Successful Transaction

Freighter wallet connected showing address GBEF...SNNZ with live balance 9940.0000 XLM. Successful transaction showing 10 XLM sent to "freind" with confirmed hash.

wallet connected transaction - c:\Users\Dell\Downloads\screenshot1.png

2. Freighter Transaction Confirmation Popup

Freighter popup showing transaction details — wallet GBEF...SNNZ sending XLM with fee 0.00001 XLM on Testnet

freighter-confirm.png- c:\Users\Dell\Downloads\screenshot2.png

3. Freighter Wallet Balance

Freighter wallet showing balance of 9,949.99997 XLM on Stellar Testnet

freighter-balance.png- c:\Users\Dell\Downloads\screenshot3.png

4. Transaction Hash Proof

Successfully confirmed transaction on Stellar Testnet:

6e5db1773b2bda7443cccdf3ae02cd18a830a991f58266b7210836e25b8d2132
🔍 View on Stellar Expert

🚀 Features

🔗 Connect / Disconnect Freighter wallet with one click
💰 Live XLM Balance fetched directly from Horizon Testnet API
➗ Equal Split — auto-divides total bill equally among all participants
✏️ Custom Split — set individual custom amounts per person
📝 Optional Memo — attach a label to all transactions (max 28 chars)
✅ Success Feedback — green card with clickable transaction hash link
❌ Error Feedback — red card with Stellar error code
🔍 Explorer Link — every transaction links directly to stellar.expert


🛠️ Tech Stack
TechnologyVersionPurposeReact18Frontend UI frameworkVite7Build tool and dev serverTailwind CSSv3Utility-first styling@stellar/stellar-sdkv12Transaction building + Horizon API@stellar/freighter-apiv2Wallet connection + signingStellar Horizon Testnet—Blockchain data + tx submissionVercel—Deployment and hosting

📁 Project Structure
Stellar-split-calculator/
├── index.html                 ← App entry point
├── package.json               ← Dependencies and scripts
├── vite.config.js             ← Vite config + global polyfill
├── tailwind.config.js         ← Tailwind content paths
├── postcss.config.js          ← PostCSS setup
├── README.md                  ← This file
├── screenshots/               ← README screenshots folder
└── src/
    ├── main.jsx               ← React root mount
    ├── App.jsx                ← All dApp logic and UI
    └── index.css              ← Tailwind directives

⚙️ Setup Instructions — How to Run Locally
Prerequisites

Node.js v18 or higher → nodejs.org
Google Chrome browser
Freighter wallet extension → freighter.app

Step 1 — Clone the repository
bashgit clone https://github.com/MrunalGhorpade13/Stellar-split-calculator.git
cd Stellar-split-calculator
Step 2 — Install dependencies
bashnpm install
Step 3 — Start the development server
bashnpm run dev
Step 4 — Open in Chrome
http://localhost:5173
Step 5 — Setup Freighter Wallet

Install Freighter from freighter.app
Create a new wallet and save your seed phrase
Click the network name in Freighter → switch to Testnet

Step 6 — Get free testnet XLM from Friendbot
Open this URL in your browser and replace with your wallet address:
https://friendbot.stellar.org?addr=YOUR_G_ADDRESS_HERE
You will receive 10,000 free testnet XLM instantly ✅
Step 7 — Use the app

Click Connect Freighter Wallet
Enter total bill amount in XLM
Add participant names and Stellar addresses
Choose Equal Split or Custom Split
Click Send Payments
Approve each transaction in Freighter popup
View transaction hash in green success card ✅


🧪 Proof of Work
Confirmed Testnet Transaction Hash:
6e5db1773b2bda7443cccdf3ae02cd18a830a991f58266b7210836e25b8d2132
Verify on Stellar Expert:
https://stellar.expert/explorer/testnet/tx/6e5db1773b2bda7443cccdf3ae02cd18a830a991f58266b7210836e25b8d2132
Wallet Address: GBEF...SNNZ
Network: Stellar Testnet (Test SDF Network ; September 2015)
Horizon API: https://horizon-testnet.stellar.org

👨‍💻 Developer
Mrunal Ghorpade

GitHub: @MrunalGhorpade13
Project: Rise In White Belt Level 1 — Stellar dApp Challenge



⚡ Built on Stellar Testnet · Rise In White Belt Level 1 · 2025