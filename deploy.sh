#!/bin/bash
# Stellar Split - Soroban Contract Deployer
# Run this in a compatible environment (Mac/Linux/Gitpod)

set -e

echo "🚀 Building and deploying the Soroban contract..."

# 1. Build the contract
cd contracts/split
stellar contract build

# 2. Add local identity if it doesn't exist
if ! stellar keys address split-admin >/dev/null 2>&1; then
  echo "🔑 Generating deployment key..."
  stellar keys generate --global split-admin --network testnet
fi

# 3. Fund identity
export ADMIN_ADDRESS=$(stellar keys address split-admin)
echo "💸 Funding deployment address: $ADMIN_ADDRESS"
curl -s "https://friendbot.stellar.org/?addr=$ADMIN_ADDRESS" >/dev/null

# 4. Deploy
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
echo "1. Paste this ID into your .env.local file:"
echo "   VITE_CONTRACT_ID=$CONTRACT_ID"
echo "2. Update your README.md with the new Contract Address."
