#!/bin/bash
# Stellar Split - Soroban Contract Deployer
# Run this in GitHub Codespaces (100% Free)

set -e

echo "🚀 Preparing Stellar Deployment Environment..."

# 1. Install Rust if missing
if ! command -v cargo &> /dev/null; then
    echo "⚙️ Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi

# 2. Add wasm32 target
rustup target add wasm32-unknown-unknown

# 3. Install stellar-cli if missing
if ! command -v stellar &> /dev/null; then
    echo "⚙️ Installing stellar-cli (this takes ~3-4 minutes)..."
    cargo install --locked stellar-cli --version 22.0.0
fi

echo "🔨 Building the Soroban contract..."

# 4. Build the contract
cd contracts/split
stellar contract build

# 5. Add local identity if it doesn't exist
if ! stellar keys address split-admin >/dev/null 2>&1; then
  echo "🔑 Generating Testnet deployment key..."
  stellar keys generate --global split-admin --network testnet
fi

# 6. Fund identity
export ADMIN_ADDRESS=$(stellar keys address split-admin)
echo "💸 Funding deployment address: $ADMIN_ADDRESS"
curl -s "https://friendbot.stellar.org/?addr=$ADMIN_ADDRESS" >/dev/null

# 7. Deploy
echo "🚢 Deploying to Testnet..."
OUTPUT=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/split.wasm \
  --source split-admin \
  --network testnet)

CONTRACT_ID=$(echo "$OUTPUT" | grep -o 'C[A-Z0-9]\{55\}')

echo ""
echo "✅ DEPLOYMENT SUCCESSFUL!"
echo "Contract ID: $CONTRACT_ID"
echo ""
echo "Next Steps:"
echo "1. Go back to Vercel Settings -> Environment Variables"
echo "2. Add: VITE_CONTRACT_ID=$CONTRACT_ID"
echo "3. Redeploy the Vercel site."
