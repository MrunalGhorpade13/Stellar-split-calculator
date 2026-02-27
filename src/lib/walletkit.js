// src/lib/walletkit.js
// Custom multi-wallet implementation using direct stable APIs
// @creit.tech/stellar-wallets-kit v2 has cascading CJS/ESM conflicts so we use its modules directly

/**
 * Connect using Freighter browser extension (most reliable, ESM native)
 * @returns {Promise<string>} public key
 */
export async function connectFreighter() {
  const { isConnected, requestAccess, getAddress } = await import("@stellar/freighter-api");

  const connResult = await isConnected();
  if (!connResult.isConnected) {
    throw Object.assign(new Error("Freighter extension not found. Please install it."), { name: "WalletNotFoundError" });
  }

  const accessResult = await requestAccess();
  if (accessResult.error) {
    if (accessResult.error.toLowerCase().includes("reject") || accessResult.error.toLowerCase().includes("denied")) {
      throw Object.assign(new Error("You rejected the connection request."), { name: "UserRejectedError" });
    }
    throw new Error(accessResult.error);
  }

  const { address, error } = await getAddress();
  if (error) throw new Error(error);
  if (!address) throw Object.assign(new Error("Could not get address from Freighter."), { name: "WalletNotFoundError" });
  return address;
}

/**
 * Sign a transaction with Freighter
 */
export async function signWithFreighter(xdr, address) {
  const { signTransaction } = await import("@stellar/freighter-api");
  const { signedTxXdr, error } = await signTransaction(xdr, {
    address,
    networkPassphrase: "Test SDF Network ; September 2015",
  });
  if (error) throw new Error(error);
  return signedTxXdr;
}

/**
 * Albedo wallet connection (opens popup window, no extension needed)
 */
export async function connectAlbedo() {
  const albedoModule = await import("@albedo-link/intent");
  const albedo = albedoModule.default?.default || albedoModule.default || albedoModule;
  const result = await albedo.publicKey({ require_existing: false });
  if (!result?.pubkey) throw Object.assign(new Error("Could not get address from Albedo."), { name: "WalletNotFoundError" });
  return result.pubkey;
}

export async function signWithAlbedo(xdr, address) {
  const albedoModule = await import("@albedo-link/intent");
  const albedo = albedoModule.default?.default || albedoModule.default || albedoModule;
  const result = await albedo.tx({ xdr, pubkey: address, network: "testnet" });
  return result.signed_envelope_xdr;
}

// Track the active wallet type for signing
let activeWalletType = null;
let activeWalletAddress = null;

export function setActiveWallet(type, address) {
  activeWalletType = type;
  activeWalletAddress = address;
}

export function getActiveWallet() {
  return { type: activeWalletType, address: activeWalletAddress };
}

export function disconnectWallet() {
  activeWalletType = null;
  activeWalletAddress = null;
}

/**
 * Sign a transaction with the currently active wallet
 */
export async function signTransaction(xdr, address) {
  if (activeWalletType === "albedo") {
    return signWithAlbedo(xdr, address);
  }
  // Default: Freighter
  return signWithFreighter(xdr, address);
}