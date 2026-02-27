// src/lib/walletkit.js — 3 Wallet Integration: Freighter, Albedo, xBull
let activeWalletType = null;
let activeWalletAddress = null;

// ── 1. FREIGHTER ───────────────────────────────────────────────
export async function connectFreighter() {
  const { isConnected, requestAccess, getAddress } = await import("@stellar/freighter-api");
  const connResult = await isConnected();
  if (!connResult.isConnected) {
    throw Object.assign(new Error("Freighter extension not found. Install it from freighter.app"), { name: "WalletNotFoundError" });
  }
  const accessResult = await requestAccess();
  if (accessResult.error) {
    const msg = accessResult.error.toLowerCase();
    if (msg.includes("reject") || msg.includes("denied")) {
      throw Object.assign(new Error("You rejected the connection."), { name: "UserRejectedError" });
    }
    throw new Error(accessResult.error);
  }
  const { address, error } = await getAddress();
  if (error) throw new Error(error);
  if (!address) throw Object.assign(new Error("Could not get address from Freighter."), { name: "WalletNotFoundError" });
  return address;
}

export async function signWithFreighter(xdr, address) {
  const { signTransaction } = await import("@stellar/freighter-api");
  const { signedTxXdr, error } = await signTransaction(xdr, {
    address,
    networkPassphrase: "Test SDF Network ; September 2015",
  });
  if (error) throw new Error(error);
  return signedTxXdr;
}

// ── 2. ALBEDO ──────────────────────────────────────────────────
export async function connectAlbedo() {
  const mod = await import("@albedo-link/intent");
  const albedo = mod.default?.default || mod.default || mod;
  const result = await albedo.publicKey({ require_existing: false });
  if (!result?.pubkey) throw Object.assign(new Error("Could not get address from Albedo."), { name: "WalletNotFoundError" });
  return result.pubkey;
}

export async function signWithAlbedo(xdr, address) {
  const mod = await import("@albedo-link/intent");
  const albedo = mod.default?.default || mod.default || mod;
  const result = await albedo.tx({ xdr, pubkey: address, network: "testnet" });
  return result.signed_envelope_xdr;
}

// ── 3. xBULL ──────────────────────────────────────────────────
export async function connectXBull() {
  try {
    const { xBullWalletConnect } = await import("@creit.tech/xbull-wallet-connect");
    const bridge = new xBullWalletConnect();
    const publicKey = await bridge.connect();
    bridge.closeConnections();
    if (!publicKey) throw Object.assign(new Error("Could not get address from xBull."), { name: "WalletNotFoundError" });
    return publicKey;
  } catch (e) {
    if (e.name === "WalletNotFoundError") throw e;
    throw Object.assign(new Error("xBull wallet not found or rejected. Install xBull extension."), { name: "WalletNotFoundError" });
  }
}

export async function signWithXBull(xdr, address) {
  const { xBullWalletConnect } = await import("@creit.tech/xbull-wallet-connect");
  const bridge = new xBullWalletConnect();
  const signedXdr = await bridge.sign({ xdr, publicKey: address, network: "Test SDF Network ; September 2015" });
  bridge.closeConnections();
  return signedXdr;
}

// ── Shared State ───────────────────────────────────────────────
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

export async function signTransaction(xdr, address) {
  if (activeWalletType === "albedo") return signWithAlbedo(xdr, address);
  if (activeWalletType === "xbull") return signWithXBull(xdr, address);
  return signWithFreighter(xdr, address);
}